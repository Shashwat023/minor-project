#!/usr/bin/env python3
"""
Test the complete audio pipeline step by step.
This helps identify where the STT → LLM → Redis pipeline fails.
"""

import asyncio
import logging
import os
import sys
import time
from pathlib import Path

# Add app to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.services.whisper_service import transcribe
from app.services.llm_service import summarize
from app.services.redis_service import RedisService
from app.models.schemas import ChunkSummary

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


async def test_pipeline_with_saved_chunk():
    """Test pipeline with a saved audio chunk."""
    debug_dir = Path("debug_audio")
    if not debug_dir.exists():
        logger.error("No debug_audio directory found. Run a session first to generate failing chunks.")
        return
    
    # Find a failed chunk
    failed_chunks = list(debug_dir.glob("*_failed.webm"))
    if not failed_chunks:
        logger.error("No failed chunks found. Run a session first.")
        return
    
    chunk_file = failed_chunks[0]
    chunk_number = chunk_file.stem.split('_')[1]
    session_id = f"test_session_{int(time.time())}"
    
    logger.info(f"=== TESTING PIPELINE WITH {chunk_file.name} ===")
    logger.info(f"Session ID: {session_id}")
    logger.info(f"Chunk Number: {chunk_number}")
    
    with open(chunk_file, 'rb') as f:
        audio_bytes = f.read()
    
    logger.info(f"Audio size: {len(audio_bytes)} bytes")
    
    # Step 1: STT
    logger.info("\n--- STEP 1: STT ---")
    start_time = time.time()
    transcribed_text = await transcribe(audio_bytes)
    stt_duration = time.time() - start_time
    
    if transcribed_text:
        logger.info(f"✅ STT SUCCESS in {stt_duration:.1f}s: '{transcribed_text}'")
    else:
        logger.error(f"❌ STT FAILED in {stt_duration:.1f}s: No transcription")
        return
    
    # Step 2: LLM
    logger.info("\n--- STEP 2: LLM ---")
    start_time = time.time()
    summary_text = await summarize(transcribed_text, session_id, int(chunk_number))
    llm_duration = time.time() - start_time
    
    if summary_text:
        logger.info(f"✅ LLM SUCCESS in {llm_duration:.1f}s: '{summary_text}'")
    else:
        logger.error(f"❌ LLM FAILED in {llm_duration:.1f}s: No summary")
        return
    
    # Step 3: Redis
    logger.info("\n--- STEP 3: REDIS ---")
    start_time = time.time()
    summary = ChunkSummary(
        chunk_number=int(chunk_number),
        text=summary_text,
        timestamp=int(time.time()),
        status="success",
    )
    
    try:
        redis_service = RedisService()
        await redis_service.store_summary(session_id, summary)
        redis_duration = time.time() - start_time
        logger.info(f"✅ REDIS SUCCESS in {redis_duration:.1f}s")
        logger.info(f"🎉 FULL PIPELINE SUCCESS!")
    except Exception as e:
        redis_duration = time.time() - start_time
        logger.error(f"❌ REDIS FAILED in {redis_duration:.1f}s: {e}")


async def test_whisper_directly():
    """Test Whisper with a simple audio file."""
    logger.info("\n=== TESTING WHISPER DIRECTLY ===")
    
    # Test with silence (should return None)
    silence_bytes = b'\x00' * 1000
    result = await transcribe(silence_bytes)
    logger.info(f"Silence test: {result}")
    
    # Test with minimal audio
    minimal_bytes = b'\x1a\x45\xdf\xa3' + b'\x00' * 1000
    result = await transcribe(minimal_bytes)
    logger.info(f"Minimal audio test: {result}")


async def main():
    import argparse
    parser = argparse.ArgumentParser(description="Test audio pipeline")
    parser.add_argument("--chunk", action="store_true", help="Test with saved chunk")
    parser.add_argument("--whisper", action="store_true", help="Test Whisper directly")
    
    args = parser.parse_args()
    
    if args.whisper:
        await test_whisper_directly()
    elif args.chunk:
        await test_pipeline_with_saved_chunk()
    else:
        # Test both
        await test_whisper_directly()
        await test_pipeline_with_saved_chunk()


if __name__ == "__main__":
    asyncio.run(main())
