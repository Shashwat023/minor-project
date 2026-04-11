# LLM/app/services/redis_service.py
# Redis cache operations for session summaries.
# Falls back to an in-memory dict when Redis is unavailable.

import json
import logging
import time
from typing import Dict, List, Optional

import redis.asyncio as aioredis

from app.models.schemas import ChunkSummary

logger = logging.getLogger(__name__)


class RedisService:
    """Async wrapper around Redis for session summary storage."""

    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        self._url = redis_url
        self._client: Optional[aioredis.Redis] = None
        # In-memory fallback if Redis goes down
        self._fallback: Dict[str, List[str]] = {}
        self._fallback_current: Dict[str, str] = {}
        self._connected = False

    # ── lifecycle ───────────────────────────────────────────────────────────

    async def connect(self) -> None:
        """Attempt to connect to Redis. Silently fall back on failure."""
        try:
            self._client = aioredis.from_url(
                self._url, decode_responses=True, socket_connect_timeout=3
            )
            await self._client.ping()
            self._connected = True
            logger.info("Redis connection established at %s", self._url)
        except Exception as exc:
            logger.warning("Redis unavailable (%s) – using in-memory fallback", exc)
            self._connected = False

    async def disconnect(self) -> None:
        if self._client:
            await self._client.close()

    # ── write ───────────────────────────────────────────────────────────────

    async def store_summary(
        self, session_id: str, summary: ChunkSummary
    ) -> None:
        """Append a chunk summary to the session list and set it as current."""
        payload = summary.model_dump_json()
        summaries_key = f"session:{session_id}:summaries"
        current_key = f"session:{session_id}:current"

        if self._connected:
            try:
                async with self._client.pipeline(transaction=True) as pipe:
                    pipe.rpush(summaries_key, payload)
                    pipe.set(current_key, payload)
                    await pipe.execute()
                return
            except Exception as exc:
                logger.error(f"Redis write failed: {exc}")
                self._connected = False

        # Fallback
        self._fallback.setdefault(summaries_key, []).append(payload)
        self._fallback_current[current_key] = payload

    # ── read ────────────────────────────────────────────────────────────────

    async def get_current_summary(
        self, session_id: str
    ) -> Optional[ChunkSummary]:
        """Return the latest 1-min summary for a session, or None."""
        current_key = f"session:{session_id}:current"

        if self._connected:
            try:
                raw = await self._client.get(current_key)
                if raw:
                    return ChunkSummary.model_validate_json(raw)
                return None
            except Exception as exc:
                logger.error(f"Redis read failed: {exc}")
                self._connected = False

        raw = self._fallback_current.get(current_key)
        if raw:
            return ChunkSummary.model_validate_json(raw)
        return None

    async def get_all_summaries(
        self, session_id: str
    ) -> List[ChunkSummary]:
        """Return all chunk summaries for a session in order."""
        summaries_key = f"session:{session_id}:summaries"

        if self._connected:
            try:
                raw_list = await self._client.lrange(summaries_key, 0, -1)
                return [
                    ChunkSummary.model_validate_json(item) for item in raw_list
                ]
            except Exception as exc:
                logger.error("Redis lrange failed (%s) – connection lost, switching to fallback", exc)
                self._connected = False  # ✓ FIX#2: Reset flag on read failure

        raw_list = self._fallback.get(summaries_key, [])
        return [ChunkSummary.model_validate_json(item) for item in raw_list]

    # ── cleanup ─────────────────────────────────────────────────────────────

    async def delete_session(self, session_id: str) -> None:
        """Remove ALL keys for a session (comprehensive cleanup)."""
        # Define all possible session-related keys
        session_keys = [
            f"session:{session_id}:summaries",      # List of all chunk summaries
            f"session:{session_id}:current",        # Current/latest summary
            f"session:{session_id}:metadata",       # Any future metadata
            f"session:{session_id}:state",          # Any state tracking
        ]

        if self._connected:
            try:
                # Delete all session keys from Redis
                deleted_count = await self._client.delete(*session_keys)
                logger.info(f"Deleted {deleted_count} Redis keys for session {session_id}")
                
                # Extra verification: scan for any remaining keys matching session pattern
                pattern = f"session:{session_id}:*"
                cursor = 0
                remaining_keys = []
                while True:
                    cursor, keys = await self._client.scan(cursor, match=pattern, count=100)
                    remaining_keys.extend(keys)
                    if cursor == 0:
                        break
                
                if remaining_keys:
                    logger.warning(f"Found {len(remaining_keys)} leftover keys for session {session_id}")
                    # Delete any leftover keys
                    await self._client.delete(*remaining_keys)
                    logger.info(f"Cleaned up {len(remaining_keys)} additional keys")
                    
            except Exception as exc:
                logger.error(f"Redis delete failed: {exc}", exc_info=True)

        # Also clean fallback in-memory storage
        removed_from_fallback = 0
        for key in session_keys:
            if key in self._fallback:
                del self._fallback[key]
                removed_from_fallback += 1
            if key in self._fallback_current:
                del self._fallback_current[key]
                removed_from_fallback += 1
        
        if removed_from_fallback > 0:
            logger.info(f"Cleaned up {removed_from_fallback} keys from fallback memory")

    # ── session reset ───────────────────────────────────────────────────────
    
    async def clear_session_fallback(self, session_id: str) -> None:
        # Explicitly clear in-memory fallback for this session
        # Prevents stale summaries from leaking into the next session
        summaries_key = f"session:{session_id}:summaries"
        current_key = f"session:{session_id}:current"
        
        count = 0
        if summaries_key in self._fallback:
            del self._fallback[summaries_key]
            count += 1
        if current_key in self._fallback_current:
            del self._fallback_current[current_key]
            count += 1
        
        if count > 0:
            logger.info(f"Cleared fallback memory for session {session_id} ({count} keys removed)")


# Module-level singleton (initialised in main.py startup)
redis_service = RedisService()
