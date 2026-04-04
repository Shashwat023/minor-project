# ml-service/app/main.py
# Dev 1 owns this file.
# Phase 1: returns mock detection responses + accepts snapshot saves.
# Phase 2: real DeepFace detection replaces the mock returns.

import asyncio
import base64
import logging
import os
import time
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")

app = FastAPI(title="MemoryCare ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Snapshot save directory ─────────────────────────────────────────────────────
# Resolves to ml-service/client_snaps/ regardless of where the process is run from
_SNAP_DIR = Path(__file__).parent.parent / "client_snaps"
_SNAP_DIR.mkdir(parents=True, exist_ok=True)
logger.info("Snapshot save directory: %s", _SNAP_DIR.resolve())

latest_result = {"matched": False}


# ── Request models ──────────────────────────────────────────────────────────────

class FrameRequest(BaseModel):
    frame: str          # base64 JPEG string
    session_id: str
    frame_width: int
    frame_height: int


class RegisterRequest(BaseModel):
    person_id: str
    name: str
    relationship: str
    photo: str          # base64 JPEG string


class SnapshotRequest(BaseModel):
    """Snapshot sent from the frontend SnapshotCapture component."""
    session_id: str
    snapshot_number: int          # sequential counter from the frontend
    timestamp: int                # Unix epoch seconds
    image_data: str               # base64-encoded PNG (without data: prefix)


class SnapshotResponse(BaseModel):
    status: str
    filename: str
    path: str


# ── Routes ──────────────────────────────────────────────────────────────────────

@app.post("/detect")
async def detect(req: FrameRequest):
    # TODO Dev 1: replace mock below with real DeepFace logic
    global latest_result
    latest_result = {
        "matched": True,
        "is_new": False,
        "person_id": "person_101",
        "confidence": 0.91,
        "box": {"x": 150, "y": 80, "w": 120, "h": 140}
    }
    return latest_result


@app.post("/register")
async def register(req: RegisterRequest):
    # TODO Dev 1: extract embedding from req.photo and store it
    return {"status": "registered", "person_id": req.person_id}


@app.get("/latest_result")
async def get_latest_result():
    return latest_result


@app.post("/snapshot", response_model=SnapshotResponse)
async def save_snapshot(req: SnapshotRequest):
    """
    Accept a base64 PNG snapshot from the frontend and save it to client_snaps/.

    Filename format: {session_id}_snap{snapshot_number:04d}_{timestamp}.png
    Example: person_101_session_1234567890_snap0001_1234567890.png
    """
    try:
        # Strip the data URI header if the frontend accidentally included it
        b64 = req.image_data
        if "," in b64:
            b64 = b64.split(",", 1)[1]

        image_bytes = base64.b64decode(b64)

        filename = f"{req.session_id}_snap{req.snapshot_number:04d}_{req.timestamp}.png"
        save_path = _SNAP_DIR / filename

        save_path.write_bytes(image_bytes)
        logger.info("Saved snapshot: %s (%d bytes)", filename, len(image_bytes))

        return SnapshotResponse(
            status="saved",
            filename=filename,
            path=str(save_path.resolve()),
        )
    except Exception as exc:
        logger.error("Failed to save snapshot: %s", exc, exc_info=True)
        return SnapshotResponse(status="error", filename="", path="")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ml-service"}


# ── Snapshot cleanup task ────────────────────────────────────────────────────────
# Automatically delete snapshots older than 10 seconds

async def cleanup_old_snapshots():
    """
    Background task that periodically scans client_snaps/ and deletes files
    where (current_time - file_mtime) > 10 seconds.
    
    Runs every 2 seconds to keep the directory lightweight and ephemeral.
    """
    TTL_SECONDS = 10
    CLEANUP_INTERVAL = 2
    
    while True:
        try:
            current_time = time.time()
            deleted_count = 0
            
            # Scan all files in the snapshot directory
            for snap_file in _SNAP_DIR.iterdir():
                if snap_file.is_file():
                    file_mtime = snap_file.stat().st_mtime
                    age_seconds = current_time - file_mtime
                    
                    if age_seconds > TTL_SECONDS:
                        try:
                            snap_file.unlink()
                            deleted_count += 1
                            logger.debug("Deleted expired snapshot: %s (age: %.1fs)", snap_file.name, age_seconds)
                        except Exception as exc:
                            logger.warning("Failed to delete snapshot %s: %s", snap_file.name, exc)
            
            if deleted_count > 0:
                logger.info("Cleanup: deleted %d expired snapshot(s)", deleted_count)
        
        except Exception as exc:
            logger.error("Error during snapshot cleanup: %s", exc, exc_info=True)
        
        # Sleep before next cleanup scan
        await asyncio.sleep(CLEANUP_INTERVAL)


@app.on_event("startup")
async def start_cleanup_task():
    """
    Start the background cleanup task when the FastAPI app starts.
    The task runs asynchronously in the background without blocking the app.
    """
    logger.info("Starting background snapshot cleanup task (TTL: 10s, interval: 2s)")
    asyncio.create_task(cleanup_old_snapshots())
