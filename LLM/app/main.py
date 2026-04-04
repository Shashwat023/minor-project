# LLM/app/main.py
# FastAPI application entry point.
# CORS is intentionally open for hackathon/local testing.
# In production, restrict CORS_ORIGINS to specific domains.

import json
import logging
import os
import re
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routes import audio, summary
from app.services.redis_service import redis_service

load_dotenv()

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    redis_service._url = redis_url
    await redis_service.connect()
    
    # Initialize Groq with logging properly configured
    from app.services import llm_service
    llm_service._init_groq()
    
    logger.info("MemoryCare LLM backend started")
    yield
    await redis_service.disconnect()
    logger.info("MemoryCare LLM backend stopped")


app = FastAPI(
    title="MemoryCare LLM Backend",
    description="Audio → STT → LLM summarisation → Redis pipeline",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ────────────────────────────────────────────────────────────────────────
# Strategy: allow * for hackathon testing.
# The frontend uses Vite proxy for all API calls — the browser never calls this
# service directly across origins. But if it ever does (e.g. during local dev
# without the proxy), the wildcard ensures it isn't blocked.
#
# CORS_ORIGINS env var is still respected if you want to lock it down:
#   CORS_ORIGINS=["https://your-domain.com"]
# Set CORS_ORIGINS=* to allow all (default for hackathon).

_raw = os.getenv("CORS_ORIGINS", "*")

if _raw.strip() == "*":
    # Wildcard — allow all origins (suitable for hackathon, dev, ngrok testing)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,   # must be False when allow_origins=["*"]
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info("CORS: wildcard (*) — all origins allowed")
else:
    try:
        origins: list = json.loads(_raw)
    except (json.JSONDecodeError, TypeError):
        origins = [o.strip() for o in _raw.split(",") if o.strip()]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info("CORS: restricted to %s", origins)

# ── Routers ─────────────────────────────────────────────────────────────────────
app.include_router(audio.router,   tags=["Audio"])
app.include_router(summary.router, tags=["Summary"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "memorycare-llm"}
