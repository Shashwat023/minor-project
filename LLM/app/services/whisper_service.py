# LLM/app/services/whisper_service.py
# Speech-to-text using OpenAI Whisper (local, no API key).
# Uses asyncio.to_thread so the blocking Whisper call never freezes the event loop.

import asyncio
import logging
import os
import tempfile
from typing import Optional

import whisper

logger = logging.getLogger(__name__)

def _detect_audio_format(audio_bytes: bytes) -> dict:
    """
    Detect actual audio format from file headers.
    Returns format info including extension and codec details.
    """
    if not audio_bytes or len(audio_bytes) < 12:
        return {'format': 'unknown', 'extension': '.webm', 'confidence': 0}
    
    # File header signatures
    headers = {
        b'\x1a\x45\xdf\xa3': {'format': 'webm', 'extension': '.webm', 'codec': 'matroska'},
        b'RIFF': {'format': 'wav', 'extension': '.wav', 'codec': 'pcm'},
        b'OggS': {'format': 'ogg', 'extension': '.ogg', 'codec': 'opus/vorbis'},
        b'ftyp': {'format': 'mp4', 'extension': '.mp4', 'codec': 'aac/mp4'},
        b'ID3': {'format': 'mp3', 'extension': '.mp3', 'codec': 'mpeg'},
    }
    
    # Check for known headers
    for header, info in headers.items():
        if audio_bytes.startswith(header):
            return info
    
    # Default fallback
    return {'format': 'unknown', 'extension': '.webm', 'codec': 'unknown'}

_model: Optional[whisper.Whisper] = None

# large-v3-turbo is accurate but slow (~2-4 min on CPU for a 60s clip).
# For hackathon/real-time use, "base" or "small" gives 5-10x speedup with
# acceptable accuracy for conversational English.
# Override via WHISPER_MODEL env var: base | small | medium | large-v3-turbo
# Using "small" for better stability vs "base" which can have NaN issues
_MODEL_NAME = os.getenv("WHISPER_MODEL", "small")


def _get_model() -> whisper.Whisper:
    """Load the Whisper model once (lazy, thread-safe after first call)."""
    global _model
    if _model is None:
        logger.info("Loading Whisper model '%s'…", _MODEL_NAME)
        _model = whisper.load_model(_MODEL_NAME)
        logger.info("Whisper model '%s' loaded", _MODEL_NAME)
    return _model


def _run_transcribe(tmp_path: str) -> str:
    """
    Blocking Whisper call — always run via asyncio.to_thread.
    Returns transcribed text (may be empty string).
    """
    global _model
    try:
        model = _get_model()
        
        # Try transcription with error handling for NaN tensors
        result = model.transcribe(tmp_path, language="en", fp16=False)
        text = result.get("text", "").strip()
        
        # Validate result isn't corrupted
        if not text or len(text) < 1:
            return ""
            
        return text
        
    except ValueError as e:
        error_str = str(e)
        if "NaN" in error_str or "tensor" in error_str.lower():
            logger.warning("Whisper encountered corrupted audio data - reloading model as safeguard")
            _model = None
            return ""
        raise
    except Exception as e:
        logger.error(f"Transcription error: {e}", exc_info=True)
        return ""


async def transcribe(audio_bytes: bytes) -> Optional[str]:
    """
    Transcribe raw audio bytes (audio/webm) to text.
    Runs in a thread pool so it never blocks the FastAPI event loop.
    Returns transcribed text, or None on failure.
    """
    # Validate audio bytes
    if not audio_bytes or len(audio_bytes) < 100:
        return None
    
    # Check for obvious silence/corruption patterns
    # Silent audio = lots of zeros (low entropy)
    # Corrupted audio = highly repetitive pattern
    first_100 = audio_bytes[:100]
    unique_bytes = len(set(first_100))
    
    if unique_bytes < 8:
        return None
    
    # Detect actual audio format from file headers
    format_info = _detect_audio_format(audio_bytes)
    
    tmp_path: Optional[str] = None
    try:
        # Use detected format for file extension
        ext = format_info.get('extension', '.webm')
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        # Move blocking transcription off the event loop
        text = await asyncio.to_thread(_run_transcribe, tmp_path)
        
        # Accept any non-empty transcription (even 1-2 chars like "ok", "yes")
        if not text:
            return None

        return text

    except Exception as exc:
        logger.error(f"Transcription pipeline failed: {exc}", exc_info=True)
        return None

    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError:
                pass
