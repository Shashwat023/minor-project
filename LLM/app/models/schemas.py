# LLM/app/models/schemas.py
# Pydantic models for request/response validation across all API endpoints.

from pydantic import BaseModel, Field
from typing import Optional, List


# ─── Audio Route ────────────────────────────────────────────────────────────────

class AudioChunkResponse(BaseModel):
    """Response after accepting an audio chunk for processing."""
    status: str = Field(default="processing", description="Processing status")
    chunk_id: str = Field(..., description="Unique identifier for this chunk")


# ─── Summary Route ──────────────────────────────────────────────────────────────

class SummaryResponse(BaseModel):
    """Current 1-minute summary returned by polling endpoint."""
    summary: Optional[str] = Field(None, description="Summarised text or null")
    chunk_number: Optional[int] = Field(None, description="Which chunk this came from")
    timestamp: Optional[int] = Field(None, description="Unix epoch when summary was generated")
    status: Optional[str] = Field(
        default=None,
        description="success | failed | pending - null if no summary",
    )


class SessionEndRequest(BaseModel):
    """Body for POST /api/session/end."""
    session_id: str = Field(..., description="The session to close")


class SessionEndResponse(BaseModel):
    """Response after ending a session."""
    final_summary: str = Field(..., description="Compiled session summary")
    summary_sent_to_dev2: bool = Field(
        default=False,
        description="Whether the summary was forwarded to Dev 2 DB service",
    )


# ─── RAG Route ──────────────────────────────────────────────────────────────────

class PastSummaryItem(BaseModel):
    """A single past summary returned by RAG search."""
    id: str
    date: str
    text: str
    relevance_score: float


class PastSummariesResponse(BaseModel):
    """Wrapper for the list of past summaries."""
    summaries: List[PastSummaryItem] = []


# ─── Internal models (used between services, not exposed via API) ───────────────

class ChunkSummary(BaseModel):
    """Internal representation of a processed audio chunk summary."""
    chunk_number: int
    text: str
    timestamp: int
    status: str = Field(
        default="success",
        description="success | failed | pending",
    )  # ✓ success, ✗ failed, ⏳ pending
