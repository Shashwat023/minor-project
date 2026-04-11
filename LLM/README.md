# MemoryCare LLM/RAG Backend

AI-powered audio summarisation pipeline for dementia care sessions.

## Architecture

```
Audio (webm) → Whisper STT → Groq LLM Summary → Redis Cache
                                                ↕ (poll)
                                    Frontend Dashboard
```

## Prerequisites

| Dependency | Version | Notes |
|-----------|---------|-------|
| Python | 3.10+ | |
| Redis | 7+ | `redis-server` running on port 6379 |
| FFmpeg | 6+ | Required by Whisper for audio processing |
| Groq API Key | Latest | Get free key at https://console.groq.com |

## Quick Start

```bash
# 1. Install dependencies
cd LLM
pip install -r requirements.txt

# 2. Copy and fill environment variables
cp .env.example .env
# Edit .env with your Groq API key from https://console.groq.com

# 3. Ensure Redis is running
redis-server

# 4. Start the server
python run.py
```

Server starts on **http://localhost:8001**. Health check: `GET /health`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/audio` | Upload 1-min audio chunk for processing |
| GET | `/api/summary?session_id=...` | Poll latest summary |
| POST | `/api/session/end` | End session, get final summary |
| GET | `/api/past-summaries?client_id=...&limit=5` | RAG past summaries |
| GET | `/health` | Service health check |

See [API_CONTRACTS.md](./API_CONTRACTS.md) for full request/response schemas.

## Environment Variables

See [.env.example](.env.example) for all required variables.

## Error Handling

- All errors are **logged silently** — no exceptions propagated to frontend
- STT failure → chunk skipped
- LLM failure → raw transcription used as summary
- Redis failure → in-memory fallback
- Pinecone failure → empty results returned
