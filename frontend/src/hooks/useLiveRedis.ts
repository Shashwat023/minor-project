// frontend/src/hooks/useLiveRedis.ts
// Polls /api/summary for the latest chunk summary.
//
// FIX: Rewrote using a self-scheduling async function INSIDE useEffect.
// The previous version had a circular useCallback dependency where
// scheduleNext captured 'poll' before it was defined, causing the
// poll chain to die after the first fetch attempt (setTimeout called undefined).

import { useEffect, useRef, useState } from "react";
import { fetchSummary, SummaryResponse } from "../lib/api";

interface UseLiveRedisResult {
  summary:     string | null;
  chunkNumber: number | null;
  timestamp:   number | null;
  isPolling:   boolean;
}

const POLL_INTERVAL_MS = 5_000;  // 5s base — avoids flooding the tunnel
const MAX_BACKOFF_MS   = 30_000; // 30s max backoff on failures

export function useLiveRedis(
  sessionId: string | null,
  enabled = true
): UseLiveRedisResult {
  const [data,       setData]       = useState<SummaryResponse | null>(null);
  const lastChunkRef = useRef<number | null>(null);
  const mountedRef   = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!enabled || !sessionId) {
      setData(null);
      lastChunkRef.current = null;
      return;
    }

    lastChunkRef.current = null;
    let failCount = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    // Self-scheduling async function — no circular dependency possible
    // because doPoll is defined once inside this effect scope.
    const doPoll = async () => {
      if (stopped || !mountedRef.current) return;

      try {
        const result = await fetchSummary(sessionId);

        if (result?.summary != null && result.chunk_number !== lastChunkRef.current) {
          lastChunkRef.current = result.chunk_number;
          if (mountedRef.current) {
            setData(result);
            console.log(
              `[useLiveRedis] ✓ chunk #${result.chunk_number}: "${result.summary?.slice(0, 80)}…"`
            );
          }
        }

        failCount = 0; // reset on success

      } catch (err) {
        failCount++;
        console.warn(`[useLiveRedis] poll failure #${failCount}:`, err);
      }

      if (stopped || !mountedRef.current) return;

      // Schedule next poll with exponential backoff on failures
      const delay = failCount > 0
        ? Math.min(POLL_INTERVAL_MS * Math.pow(2, failCount - 1), MAX_BACKOFF_MS)
        : POLL_INTERVAL_MS;

      timeoutId = setTimeout(doPoll, delay);
    };

    // First poll after one interval (gives audio time to upload first)
    timeoutId = setTimeout(doPoll, POLL_INTERVAL_MS);

    return () => {
      stopped = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [enabled, sessionId]); // no poll/scheduleNext in deps — they're inside the effect

  return {
    summary:     data?.summary     ?? null,
    chunkNumber: data?.chunk_number ?? null,
    timestamp:   data?.timestamp   ?? null,
    isPolling:   enabled && !!sessionId,
  };
}
