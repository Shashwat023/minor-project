#!/usr/bin/env python3
"""
Test audio format detection and Whisper compatibility.
This helps identify format mismatches causing transcription failures.
"""

import asyncio
import logging
import os
import sys
from pathlib import Path

# Add app to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.services.whisper_service import _detect_audio_format, transcribe

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


def test_format_detection():
    """Test format detection with known file signatures."""
    print("\n" + "="*60)
    print("TESTING AUDIO FORMAT DETECTION")
    print("="*60)
    
    # Test known signatures
    test_cases = [
        (b'\x1a\x45\xdf\xa3B\x86\x81\x01', "WebM/EBML"),
        (b'RIFF\x24\x08\x00\x00WAVEfmt ', "WAV"),
        (b'OggS\x00\x02\x00\x00\x00\x00\x00\x00\x00', "OGG"),
        (b'ftypisom\x00\x00\x02\x00', "MP4"),
        (b'ID3\x03\x00\x00\x00\x00\x00', "MP3"),
        (b'\x00\x01\x02\x03\x04\x05\x06\x07', "Unknown"),
    ]
    
    for header, description in test_cases:
        result = _detect_audio_format(header)
        print(f"{description:15} -> {result}")


async def test_saved_chunks():
    """Test transcription with saved audio chunks."""
    debug_dir = Path("debug_audio")
    if not debug_dir.exists():
        logger.info("No debug_audio directory found")
        return
    
    audio_files = list(debug_dir.glob("*.webm")) + list(debug_dir.glob("*.ogg")) + list(debug_dir.glob("*.wav"))
    
    if not audio_files:
        logger.info("No audio files found in debug_audio")
        return
    
    print("\n" + "="*60)
    print("TESTING SAVED AUDIO CHUNKS")
    print("="*60)
    
    for audio_file in audio_files:
        print(f"\n--- Testing {audio_file.name} ---")
        
        with open(audio_file, 'rb') as f:
            audio_bytes = f.read()
        
        # Detect format
        format_info = _detect_audio_format(audio_bytes)
        print(f"Detected format: {format_info}")
        
        # Test transcription
        try:
            result = await transcribe(audio_bytes)
            if result:
                print(f"✅ SUCCESS: '{result}'")
            else:
                print("⚠️ EMPTY: No speech detected")
        except Exception as e:
            print(f"❌ FAILED: {e}")


def create_format_reference():
    """Create a reference for common audio format signatures."""
    reference = """
AUDIO FORMAT SIGNATURES REFERENCE:
=====================================
WebM (Matroska):    1A 45 DF A3 (EBML header)
WAV (RIFF):         52 49 46 46 (RIFF header)
OGG:                4F 67 67 53 (OggS header)
MP4:                66 74 79 70 (ftyp box)
MP3:                49 44 33 (ID3 tag)

Common Issues:
- Browser records as OGG/Opus but backend expects WebM
- MediaRecorder produces different codecs after tunnel reconnect
- Container/codec mismatch causes Whisper decode failure
- Short chunks may have incomplete headers
"""
    print(reference)


async def main():
    import argparse
    parser = argparse.ArgumentParser(description="Test audio format handling")
    parser.add_argument("--detect", action="store_true", help="Test format detection")
    parser.add_argument("--chunks", action="store_true", help="Test saved audio chunks")
    parser.add_argument("--reference", action="store_true", help="Show format reference")
    
    args = parser.parse_args()
    
    if args.reference:
        create_format_reference()
    elif args.detect:
        test_format_detection()
    elif args.chunks:
        await test_saved_chunks()
    else:
        # Run all tests
        test_format_detection()
        await test_saved_chunks()


if __name__ == "__main__":
    asyncio.run(main())
