// frontend/src/components/SnapshotCapture.tsx
// Captures a frame from the active video element every 5 seconds
// and POSTs it as base64 PNG to ml-service via the /ml/snapshot Vite proxy.
// Saved on disk: ml-service/client_snaps/{session_id}_snap{N:04d}_{ts}.png

import React, { useEffect, useRef, useCallback } from "react";
import { sendSnapshotToML } from "../services/mlSnapshotService";

interface SnapshotCaptureProps {
  active:          boolean;
  sessionId:       string | null;
  /** Primary video element ID — falls back to "video-feed" (local cam) */
  videoElementId?: string;
}

const SNAPSHOT_INTERVAL_MS = 5_000;

/** Find the first video element that has actual frame data loaded. */
function getActiveVideo(primaryId: string): HTMLVideoElement | null {
  const check = (id: string): HTMLVideoElement | null => {
    const el = document.getElementById(id) as HTMLVideoElement | null;
    if (!el) return null;
    if (el.readyState < 2 || el.videoWidth === 0 || el.videoHeight === 0) return null;
    return el;
  };
  return check(primaryId) ?? check("video-feed") ?? null;
}

const SnapshotCapture: React.FC<SnapshotCaptureProps> = ({
  active,
  sessionId,
  videoElementId = "video-remote",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef  = useRef(0);

  const captureAndSend = useCallback(async () => {
    if (!sessionId) return;

    const video  = getActiveVideo(videoElementId);
    const canvas = canvasRef.current;
    if (!video || !canvas) return; // no frame ready yet — skip tick silently

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    countRef.current += 1;
    const snapshotNumber = countRef.current;
    const timestamp      = Math.floor(Date.now() / 1000);
    const b64            = canvas.toDataURL("image/png").split(",")[1];

    console.log(`[Snapshot] #${snapshotNumber}  source="${video.id}"  ${canvas.width}×${canvas.height}`);

    // Non-blocking fire-and-forget to ML endpoint via env var
    sendSnapshotToML(b64);

    try {
      // Relative path — proxied by Vite to localhost:8002
      // Works on localhost AND via Cloudflare tunnel
      const res = await fetch("/ml/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id:      sessionId,
          snapshot_number: snapshotNumber,
          timestamp,
          image_data:      b64,
        }),
      });

      if (!res.ok) {
        console.warn(`[Snapshot] HTTP ${res.status}`);
        return;
      }

      const data = await res.json();
      if (data.status === "saved") console.log(`[Snapshot] ✓ ${data.filename}`);
      else console.warn("[Snapshot] unexpected response:", data);
    } catch (err) {
      console.error("[Snapshot] request failed:", err);
    }
  }, [sessionId, videoElementId]);

  useEffect(() => {
    if (active) {
      countRef.current = 0;
      captureAndSend(); // immediate first capture
      timerRef.current = setInterval(captureAndSend, SNAPSHOT_INTERVAL_MS);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [active, captureAndSend]);

  return <canvas ref={canvasRef} style={{ display: "none" }} aria-hidden="true" />;
};

export default SnapshotCapture;
