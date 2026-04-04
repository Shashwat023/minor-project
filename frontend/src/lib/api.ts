// frontend/src/lib/api.ts
// Centralised API client — all paths are RELATIVE (no host prefix).
//
// Vite proxies:
//   /api/*  →  localhost:8001  (LLM: audio, summary, session, RAG)
//   /ml/*   →  localhost:8002  (ML: snapshot save)
//
// Works identically on localhost AND via Cloudflare/any tunnel because
// relative paths always resolve to whatever host the page was loaded from.
// Vite's dev server (running on your machine) then forwards them locally.
//
// NEVER hardcode http://localhost:PORT here — it breaks external access.

// Retry helper with exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3
): Promise<Response> {
  let lastError: Error = new Error("Unknown fetch error");

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      // 4xx = client error, don't retry
      if (res.status >= 400 && res.status < 500) throw new Error(`HTTP ${res.status}`);
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err as Error;
      if (attempt === maxRetries) break;
      const delay = 300 * Math.pow(2, attempt); // 300ms, 600ms, 1200ms
      console.warn(`Fetch retry ${attempt + 1}/${maxRetries} in ${delay}ms —`, (err as Error).message);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError;
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SummaryResponse {
  summary: string | null;
  chunk_number: number | null;
  timestamp: number | null;
}

export interface AudioChunkResponse {
  status: string;
  chunk_id: string;
}

export interface SessionEndResponse {
  final_summary: string;
  summary_sent_to_dev2: boolean;
}

export interface SnapshotResponse {
  status: string;
  filename: string;
  path: string;
}

// ── LLM Service (/api/*) ───────────────────────────────────────────────────────

export async function sendAudioChunk(
  sessionId: string,
  audioBlob: Blob,
  chunkNumber: number,
  timestamp: number = Date.now()
): Promise<AudioChunkResponse | null> {
  try {
    const form = new FormData();
    form.append("audio_chunk", audioBlob, `chunk_${chunkNumber}.webm`);
    form.append("session_id", sessionId);
    form.append("chunk_number", String(chunkNumber));
    form.append("timestamp", String(Math.floor(timestamp / 1000)));

    const res = await fetchWithRetry("/api/audio", { method: "POST", body: form });
    const data = (await res.json()) as AudioChunkResponse;
    return data;
  } catch (err) {
    console.error("sendAudioChunk failed:", err);
    return null;
  }
}

export async function fetchSummary(
  sessionId: string
): Promise<SummaryResponse | null> {
  try {
    const res = await fetchWithRetry(
      `/api/summary?session_id=${encodeURIComponent(sessionId)}`
    );
    const data = (await res.json()) as SummaryResponse;
    return data;
  } catch (err) {
    console.error("fetchSummary failed:", err);
    return null;
  }
}

export async function endSession(
  sessionId: string
): Promise<SessionEndResponse | null> {
  try {
    const res = await fetchWithRetry("/api/session/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    });
    return (await res.json()) as SessionEndResponse;
  } catch (err) {
    console.error("endSession failed:", err);
    return null;
  }
}

// ── ML Service (/ml/*) ────────────────────────────────────────────────────────

export async function sendSnapshot(
  sessionId: string,
  snapshotNumber: number,
  timestamp: number,
  imageData: string
): Promise<SnapshotResponse | null> {
  try {
    const res = await fetchWithRetry("/ml/snapshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        snapshot_number: snapshotNumber,
        timestamp,
        image_data: imageData,
      }),
    });
    return (await res.json()) as SnapshotResponse;
  } catch (err) {
    console.error("sendSnapshot failed:", err);
    return null;
  }
}
