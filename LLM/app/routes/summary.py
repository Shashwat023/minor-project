# LLM/app/routes/summary.py
# GET /api/summary — polling endpoint for live summaries
# POST /api/session/end — compile final summary and clean up

import logging
import json
import os
import urllib.request

from fastapi import APIRouter, Query

from app.models.schemas import SessionEndRequest, SessionEndResponse, SummaryResponse
from app.services import llm_service
from app.services.redis_service import redis_service

logger = logging.getLogger(__name__)
router = APIRouter()


async def _forward_summary_to_dev2(session_id: str, final_summary: str) -> bool:
    """
    Optional integration hook.
    If DEV2_SUMMARY_BRIDGE_URL is configured, POST summary payload to that endpoint.
    """
    bridge_url = os.getenv("DEV2_SUMMARY_BRIDGE_URL", "").strip()
    if not bridge_url:
        return False

    payload = {
        "session_id": session_id,
        "final_summary": final_summary,
    }
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        bridge_url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=5) as response:
            status_code = getattr(response, "status", 200)
            logger.info(f"Forwarded summary to Dev 2 bridge (status={status_code})")
            return 200 <= status_code < 300
    except Exception as exc:
        logger.warning(f"Forward to Dev 2 failed: {exc}")
        return False


@router.get("/api/summary", response_model=SummaryResponse)
async def get_current_summary(
    session_id: str = Query(..., description="Active session identifier"),
) -> SummaryResponse:
    """
    Return the latest 1-minute summary for the given session.

    Frontend polls this every 2 seconds. Returns null summary if nothing new.
    Includes status field to indicate if chunk succeeded or failed.
    """
    try:
        logger.info(f"Poll request for session: {session_id}")
        current = await redis_service.get_current_summary(session_id)
        if current is None:
            return SummaryResponse(summary=None)

        return SummaryResponse(
            summary=current.text,
            chunk_number=current.chunk_number,
            timestamp=current.timestamp,
            status=current.status,
        )
    except Exception as exc:
        logger.error(f"Failed to fetch current summary for {session_id}: {exc}")
        return SummaryResponse(summary=None)


@router.post("/api/session/end", response_model=SessionEndResponse)
async def end_session(body: SessionEndRequest) -> SessionEndResponse:
    """
    End a recording session:
    1. Retrieve all chunk summaries from Redis.
    2. Compile them into one final summary via LLM.
    3. Delete all session keys from Redis.
    4. Optionally forward to Dev 2's DB service.
    """
    session_id = body.session_id

    sent_to_dev2 = False

    try:
        # 1 — gather all chunk summaries
        all_summaries = await redis_service.get_all_summaries(session_id)
        texts = [s.text for s in all_summaries]
        logger.info(f"Retrieved {len(all_summaries)} chunks")

        # 2 — compile final summary
        if texts:
            final_text = await llm_service.compile_final_summary(texts)
            logger.info(f"Final summary compiled ({len(final_text)} chars)")
        else:
            final_text = "No conversation data was recorded in this session."
            logger.warning("No chunks found, using default message")

        # 3 — cleanup Redis (comprehensive deletion)
        await redis_service.delete_session(session_id)
        logger.info("Redis cleanup complete")

        # 4 — forward to Dev 2 DB bridge (if configured)
        sent_to_dev2 = await _forward_summary_to_dev2(session_id, final_text)

        return SessionEndResponse(
            final_summary=final_text,
            summary_sent_to_dev2=sent_to_dev2,
        )

    except Exception as exc:
        logger.error(f"Session end failed: {exc}", exc_info=True)
        return SessionEndResponse(
            final_summary="Session ended with errors. Please check logs.",
            summary_sent_to_dev2=False,
        )
