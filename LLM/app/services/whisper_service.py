# LLM/app/services/whisper_service.py
# Speech-to-text using faster-whisper for lower latency and better stability.
# Uses asyncio.to_thread so the blocking Whisper call never freezes the event loop.

import asyncio
import logging
import os
import subprocess
import tempfile
from typing import Optional

from faster_whisper import WhisperModel

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
    
    for header, info in headers.items():
        if audio_bytes.startswith(header):
            return info
    
    return {'format': 'unknown', 'extension': '.webm', 'codec': 'unknown'}


_model: Optional[WhisperModel] = None

# Using "base" for speed and stability
_MODEL_NAME = os.getenv("WHISPER_MODEL", "base")

# Limit concurrent transcription jobs to prevent CPU overload and cascading latency
_transcribe_semaphore = asyncio.Semaphore(int(os.getenv("MAX_CONCURRENT_STT", "2")))

def _get_model() -> WhisperModel:
    """Load the faster-whisper model once (lazy, thread-safe after first call)."""
    global _model
    if _model is None:
        logger.info("Loading faster-whisper model '%s'…", _MODEL_NAME)
        # CPU-optimized settings: int8 compute type
        _model = WhisperModel(
            _MODEL_NAME, 
            device="cpu", 
            compute_type="int8"
        )
        logger.info("faster-whisper model '%s' loaded", _MODEL_NAME)
    return _model

def _convert_audio_to_wav(input_path: str, output_path: str) -> bool:
    """
    Standardize audio format using ffmpeg: mono channel, 16kHz sample rate, wav.
    Prevents malformed tensors that lead to NaN errors.
    Returns True if successful, False otherwise.
    """
    try:
        # Run ffmpeg to convert to 16kHz mono WAV
        cmd = [
            "ffmpeg", "-y", "-i", input_path,
            "-ac", "1", "-ar", "16000",
            "-f", "wav", output_path
        ]
        # Suppress output to avoid spamming logs unless there's an error
        result = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True, timeout=15)
        if result.returncode != 0:
            logger.error(f"FFmpeg conversion failed: {result.stderr}")
            return False
        return True
    except subprocess.TimeoutExpired:
        logger.error("FFmpeg conversion timed out.")
        return False
    except Exception as e:
        logger.error(f"Error during audio conversion: {e}", exc_info=True)
        return False

def _run_transcribe(wav_path: str) -> str:
    """
    Blocking faster-whisper call — always run via asyncio.to_thread.
    Returns transcribed text (may be empty string).
    """
    global _model
    try:
        model = _get_model()
        
        # CPU-optimized settings
        segments, info = model.transcribe(
            wav_path,
            language="en",
            beam_size=1,
            best_of=1,
            temperature=0.0,
            condition_on_previous_text=False,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500)
        )
        
        # Generator evaluation and text assembly
        texts = []
        for segment in segments:
            texts.append(segment.text)
            
        text = " ".join(texts).strip()
        
        # Validate result isn't corrupted
        if not text or len(text) < 1:
            return ""
            
        return text
        
    except Exception as e:
        error_str = str(e)
        if "NaN" in error_str or "tensor" in error_str.lower():
            logger.warning("faster-whisper encountered corrupted audio data - reloading model as safeguard")
            _model = None
            return ""
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
    first_100 = audio_bytes[:100]
    unique_bytes = len(set(first_100))
    if unique_bytes < 8:
        return None
    
    format_info = _detect_audio_format(audio_bytes)
    
    tmp_input_path: Optional[str] = None
    tmp_wav_path: Optional[str] = None
    
    # Limit concurrency
    async with _transcribe_semaphore:
        try:
            ext = format_info.get('extension', '.webm')
            
            # Temporary file for the raw input
            with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp_in:
                tmp_in.write(audio_bytes)
                tmp_input_path = tmp_in.name
                
            # Temporary file for the converted WAV
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_wav:
                tmp_wav_path = tmp_wav.name
            
            # Convert audio
            success = await asyncio.to_thread(_convert_audio_to_wav, tmp_input_path, tmp_wav_path)
            if not success:
               return None

            # Move blocking transcription off the event loop
            text = await asyncio.to_thread(_run_transcribe, tmp_wav_path)
            
            if not text:
                return None

            return text

        except Exception as exc:
            logger.error(f"Transcription pipeline failed: {exc}", exc_info=True)
            return None

        finally:
            if tmp_input_path and os.path.exists(tmp_input_path):
                try:
                    os.unlink(tmp_input_path)
                except OSError:
                    pass
            if tmp_wav_path and os.path.exists(tmp_wav_path):
                try:
                    os.unlink(tmp_wav_path)
                except OSError:
                    pass
