# LLM/app/services/llm_service.py
# LLM summarization — Groq API (primary and only provider).

import asyncio
import logging
import os
import re
import time
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# ── Config ─────────────────────────────────────────────────────────────────────
_GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
_GROQ_MODEL   = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

# ── Initialize Groq ────────────────────────────────────────────────────────────
_groq_client = None
_groq_init_error = None
_groq_initialized = False

def _init_groq():
    """Lazy initialization of Groq - ensures logging is configured first."""
    global _groq_client, _groq_init_error, _groq_initialized
    
    if _groq_initialized:
        return
    
    _groq_initialized = True
    
    if not _GROQ_API_KEY:
        _groq_init_error = "GROQ_API_KEY environment variable is not set"
        logger.warning("✗ %s", _groq_init_error)
        return
    
    try:
        from groq import Groq
        _groq_client = Groq(api_key=_GROQ_API_KEY)
        logger.info("✓ Groq initialized successfully (model=%s)", _GROQ_MODEL)
    except Exception as e:
        _groq_init_error = str(e)
        logger.error("✗ Groq initialization FAILED: %s", e)
        _groq_client = None


# ── Prompts ────────────────────────────────────────────────────────────────────
_CHUNK_SYSTEM = """\
You are a clinical note assistant for a dementia care session.
Your task: read the raw speech transcript below and return a SHORT topic summary.

RULES (follow strictly):
1. Write 1-3 sentences MAXIMUM.
2. Capture only the TOPIC or THEME — do NOT copy the words from the transcript.
3. Think of it as a chapter title or a label for the conversation, then expand slightly.
4. Examples of what good output looks like:
   - Transcript: "Hey, nice to meet you. How's everything?" → Summary: "Greetings and initial check-in."
   - Transcript: "How was your Goa trip? The night clubs were nice. Beaches were soothing." → Summary: "Discussed a recent trip to Goa, including nightlife and beach experiences."
   - Transcript: "Do you remember your daughter's birthday last month?" → Summary: "Client was prompted about a memory recall regarding a family birthday."
5. If the transcript is mostly silence or filler words, reply with: "Brief pause or unclear audio."
6. Never start with "The transcript shows" or "In this segment". Start directly with the topic.
7. Never include quotation marks or literal phrases from the transcript.\
"""

_FINAL_SYSTEM = """\
You are a clinical note writer for a dementia care session.
You will receive a numbered list of short chunk summaries from a caregiving conversation.
Your job: write ONE cohesive clinical paragraph (4-6 sentences) capturing the full session.

RULES:
1. Synthesize the chunks — do NOT list them or number them.
2. Mention: overall topics covered, client engagement/mood, and any notable events or memory prompts.
3. Write in third-person clinical note style (e.g., "The client..."). Do NOT use the words "caregiver" or "patient". Use "client".
4. Do NOT repeat what was said word for word. Describe what HAPPENED at a high level.
5. Keep it under 120 words.\
"""


def _strip_thinking(text: str) -> str:
    """Remove <think>...</think> blocks that some models emit."""
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()


# ── Sync helpers ───────────────────────────────────────────────────────────────

def _groq_chat(system: str, user: str, max_tokens: int) -> str:
    """Call Groq API synchronously."""
    _init_groq()  # Ensure initialized
    
    if not _groq_client:
        raise RuntimeError(f"Groq not available: {_groq_init_error}")
    
    try:
        response = _groq_client.chat.completions.create(
            model=_GROQ_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user",   "content": user},
            ],
            max_tokens=max_tokens,
            temperature=0.2,
        )
        
        result = _strip_thinking(response.choices[0].message.content or "")
        return result
    except Exception as e:
        logger.error(f"Groq API call failed: {e}", exc_info=True)
        raise


# ── Async Generation ───────────────────────────────────────────────────────────

async def _generate(system: str, user: str, max_tokens: int, input_len: int = 0) -> str:
    """
    Generate response using Groq API.
    Runs via asyncio.to_thread to keep the event loop unblocked.
    """
    try:
        result = await asyncio.to_thread(_groq_chat, system, user, max_tokens)
        
        if not result or len(result.strip()) == 0:
            logger.warning("Groq returned empty response")
            raise RuntimeError("Groq returned empty response")
        
        return result
        
    except asyncio.TimeoutError:
        logger.error("Groq request timed out")
        raise RuntimeError("Groq request timed out")
    except Exception as e:
        msg = str(e)
        if "rate_limit" in msg.lower() or "429" in msg:
            logger.error(f"Groq rate limit exceeded: {e}")
        elif "invalid" in msg.lower() or "401" in msg or "403" in msg:
            logger.error(f"Groq authentication error: {e}")
        else:
            logger.error(f"Groq failed: {e}", exc_info=True)
        raise RuntimeError(f"Groq LLM failed: {e}")


# ── Public API ─────────────────────────────────────────────────────────────────

async def summarize(text: str, session_id: str = "", chunk_number: int = 0) -> str:
    """
    Produce a 1-3 sentence topic summary of a conversation chunk.
    Returns a safe fallback string if all providers fail — never crashes the pipeline.
    
    Args:
        text: The transcribed speech text to summarize
        session_id: The session ID (for cache-busting in LLM)
        chunk_number: The chunk number within session (for cache-busting)
    """
    if not text or not text.strip():
        return ""

    trimmed  = text.strip()[:1500]
    
    user_msg = (
        f"[Session: {session_id}, Chunk: {chunk_number}]\n"
        f"Summarize this conversation excerpt in 1-3 sentences. "
        f"Topic label style. No verbatim copying.\n\n"
        f"TRANSCRIPT:\n{trimmed}"
    )

    try:
        result = await asyncio.wait_for(
            _generate(_CHUNK_SYSTEM, user_msg, 150, len(trimmed)),
            timeout=15.0,
        )
        return result
        
    except asyncio.TimeoutError:
        logger.warning("LLM summarization timeout")
        return "Brief pause or unclear audio."
    except Exception as exc:
        logger.error(f"LLM summarization failed: {exc}")
        return "Brief pause or unclear audio."


async def compile_final_summary(summaries: list[str]) -> str:
    """Compile chunk summaries into one cohesive clinical paragraph."""
    if not summaries:
        return "No conversation data was recorded in this session."

    numbered = "\n".join(f"{i+1}. {s}" for i, s in enumerate(summaries))
    user_msg = (
        f"Below are {len(summaries)} short topic summaries from a dementia care session.\n"
        f"Write ONE cohesive clinical paragraph (4-6 sentences) summarizing the full session.\n\n"
        f"CHUNK SUMMARIES:\n{numbered}\n\n"
        f"CLINICAL SESSION NOTE:"
    )

    try:
        result = await asyncio.wait_for(
            _generate(_FINAL_SYSTEM, user_msg, 300, len(numbered)),
            timeout=25.0,
        )
        if result:
            logger.info("Final summary compiled: %d chars from %d chunks", len(result), len(summaries))
            return result
    except asyncio.TimeoutError:
        logger.error("Final summary timed out (25s)")
    except Exception as exc:
        logger.error("Final summary failed: %s", exc)

    return "Session topics: " + " | ".join(summaries)
