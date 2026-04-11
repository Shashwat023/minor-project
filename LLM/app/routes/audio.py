# LLM/app/routes/audio.py
# POST /api/audio — accepts audio chunks, triggers STT → LLM → Redis pipeline.
#
# LATENCY DESIGN:
#   - The HTTP response is returned IMMEDIATELY (fire-and-forget background task).
#   - The pipeline (Whisper → Groq → Redis) runs in the background via asyncio.
#   - Both Whisper and Groq calls use asyncio.to_thread so they don't block the loop.
#   - Expected round-trip (base Whisper + Groq API): ~2-5s for a 15s chunk.
#   - Frontend polls /api/summary every 2s — summary appears within one poll cycle.

import asyncio
import logging
import time

from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile

from app.models.schemas import AudioChunkResponse, ChunkSummary
from app.services import whisper_service, llm_service
from app.services.redis_service import redis_service

logger = logging.getLogger(__name__)
router = APIRouter()


async def _process_audio_chunk(
    session_id: str,
    audio_bytes: bytes,
    chunk_number: int,
    content_type: str,
) -> None:
    """
    Background pipeline: STT → LLM summary → Redis storage.
    Both blocking steps run inside asyncio.to_thread — the event loop stays free.
    """
    try:
        # Check if session is already ended before starting heavy lifting
        if await redis_service.is_session_closed(session_id):
            logger.warning(f"Aborting chunk {chunk_number} processing: session {session_id} is closed.")
            return

        # ── Step 1: Whisper STT ─────────────────────────────────────────────
        transcribed_text = await whisper_service.transcribe(audio_bytes)
        
        if not transcribed_text:
            logger.error(f"Chunk {chunk_number}: STT failed")
            # Store failure status so frontend knows this chunk failed
            failed_summary = ChunkSummary(
                chunk_number=chunk_number,
                text="Audio processing...",
                timestamp=int(time.time()),
                status="failed",
            )
            await redis_service.store_summary(session_id, failed_summary)
            return

        # ── Step 2: LLM summarisation ───────────────────────────────────────
        summary_text = await llm_service.summarize(transcribed_text, session_id, chunk_number)
        
        if not summary_text:
            logger.error(f"Chunk {chunk_number}: LLM summarization failed")
            # Store failure status
            failed_summary = ChunkSummary(
                chunk_number=chunk_number,
                text="[Summary generation failed - please try again]",
                timestamp=int(time.time()),
                status="failed",
            )
            await redis_service.store_summary(session_id, failed_summary)
            return

        # ── Step 3: Store in Redis ──────────────────────────────────────────
        summary = ChunkSummary(
            chunk_number=chunk_number,
            text=summary_text,
            timestamp=int(time.time()),
            status="success",
        )
        await redis_service.store_summary(session_id, summary)

    except Exception as exc:
        logger.error(f"Chunk {chunk_number} processing failed: {exc}", exc_info=True)


@router.post("/api/audio", response_model=AudioChunkResponse)
async def receive_audio(
    background_tasks: BackgroundTasks,
    audio_chunk: UploadFile = File(..., description="Audio file in audio/webm format"),
    session_id: str = Form(...),
    chunk_number: int = Form(...),
    timestamp: int = Form(default=0),
) -> AudioChunkResponse:
    """
    Accept audio chunk and immediately return while the pipeline runs in the background.
    The frontend should not wait for this — poll /api/summary separately.
    """
    try:
        # Clear session data on first chunk
        if chunk_number == 1:
            logger.info(f"First chunk for session {session_id} — cleaning up old session data")
            await redis_service.delete_session(session_id)
            await redis_service.clear_session_fallback(session_id)
        
        audio_bytes = await audio_chunk.read()
        logger.info(f"Received chunk {chunk_number} for session {session_id} ({len(audio_bytes)} bytes)")

        # Add background task with error handling wrapper
        async def _safe_process():
            try:
                await _process_audio_chunk(
                    session_id,
                    audio_bytes,
                    chunk_number,
                    audio_chunk.content_type or "unknown",
                )
            except Exception as e:
                logger.error(f"Background processing failed for chunk {chunk_number}: {e}", exc_info=True)
        
        background_tasks.add_task(_safe_process)
        
        return AudioChunkResponse(status="processing", chunk_id=f"chunk_{chunk_number}")

    except Exception as exc:
        logger.error(f"Failed to accept audio chunk {chunk_number}: {exc}", exc_info=True)
        return AudioChunkResponse(status="error", chunk_id=f"chunk_{chunk_number}")
