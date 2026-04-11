// frontend/src/hooks/useLiveDetection.ts
import { useEffect, useState } from "react";
import { useSpacetime } from "../components/SpacetimeProvider";
import type { LiveDetection } from "../spacetime-sdk/types";

/**
 * Hook to provide reactive access to the latest ML live detection for a given session.
 */
export function useLiveDetection(sessionId: string | null): LiveDetection | null {
  const { conn, isConnected } = useSpacetime();
  const [detection, setDetection] = useState<LiveDetection | null>(null);

  useEffect(() => {
    if (!conn || !isConnected) return;

    if (!sessionId) {
      setDetection(null);
      return;
    }

    // Attempt to load existing detection for the session
    try {
      const existing = [...conn.db.liveDetection.iter()].find(d => d.sessionId === sessionId);
      if (existing) {
        setDetection(existing);
      } else {
        setDetection(null);
      }
    } catch (e) {
      console.warn("[useLiveDetection] error reading initial state:", e);
    }

    // Event handlers
    const onInsert = (_ctx: any, row: LiveDetection) => {
      if (row.sessionId === sessionId) {
        setDetection(row);
      }
    };

    const onUpdate = (_ctx: any, _old: LiveDetection, newRow: LiveDetection) => {
      if (newRow.sessionId === sessionId) {
        setDetection(newRow);
      }
    };

    // NOTE: SpacetimeDB TS SDK does not cleanly support removing specific listeners yet,
    // so we register them. In a real heavy app we might need a centralized emitter,
    // but this matches the existing pattern in useSpacetimeTables.ts.
    conn.db.liveDetection.onInsert(onInsert);
    conn.db.liveDetection.onUpdate(onUpdate);

  }, [conn, isConnected, sessionId]);

  return detection;
}
