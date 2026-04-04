# MemoryCare LLM/RAG API Contracts

## 1. POST `/api/audio`

Upload a 1-minute audio chunk for background processing (STT → LLM → Redis).

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audio_chunk` | File (audio/webm) | ✅ | Raw audio binary |
| `session_id` | string | ✅ | e.g. `patient_1_session_1711540000` |
| `chunk_number` | integer | ✅ | Sequential chunk index (1, 2, 3…) |
| `timestamp` | integer | ❌ | Unix epoch; defaults to server time |

**Response (200):**
```json
{
  "status": "processing",
  "chunk_id": "chunk_1"
}
```

---

## 2. GET `/api/summary`

Poll for the latest 1-minute summary.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `session_id` | string (query) | ✅ | Active session ID |

**Response (200) — summary available:**
```json
{
  "summary": "Discussed gardening and medication schedule",
  "chunk_number": 1,
  "timestamp": 1234567920
}
```

**Response (200) — no new summary:**
```json
{
  "summary": null,
  "chunk_number": null,
  "timestamp": null
}
```

---

## 3. POST `/api/session/end`

End a recording session. Compiles all chunk summaries and cleans up Redis.

**Body (JSON):**
```json
{
  "session_id": "patient_1_session_123"
}
```

**Response (200):**
```json
{
  "final_summary": "Complete session summary text...",
  "summary_sent_to_dev2": true
}
```

---

## 4. GET `/api/past-summaries`

RAG query for past session summaries by client ID.

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `client_id` | string (query) | ✅ | — | Client/patient ID |
| `limit` | integer (query) | ❌ | 5 | Max results (1-20) |

**Response (200):**
```json
{
  "summaries": [
    {
      "id": "summary_123",
      "date": "2024-01-15",
      "text": "Discussed family vacation plans...",
      "relevance_score": 0.92
    }
  ]
}
```

---

## 5. GET `/health`

**Response (200):**
```json
{
  "status": "ok",
  "service": "memorycare-llm"
}
```
