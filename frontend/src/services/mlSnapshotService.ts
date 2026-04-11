// frontend/src/services/mlSnapshotService.ts
// Service to POST webcam snapshot base64 frames directly to an ML endpoint via NGROK or other URLs.

/**
 * Sends a base64 encoded image to the configured ML endpoint.
 * Gracefully catches errors to avoid blocking the UI thread.
 * Endpoint is configured via VITE_ML_SNAPSHOT_URL environment variable.
 */
export async function sendSnapshotToML(base64Image: string): Promise<void> {
  const endpoint = import.meta.env.VITE_ML_SNAPSHOT_URL;
  if (!endpoint) {
    // If no endpoint is configured, silently skip or log at trace level
    return;
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!res.ok) {
      console.warn(`[ML Snapshot] HTTP ${res.status} from ML endpoint`);
    }
  } catch (err) {
    console.warn("[ML Snapshot] Request failed (non-blocking):", err);
  }
}
