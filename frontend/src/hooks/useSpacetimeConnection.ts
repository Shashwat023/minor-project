// frontend/src/hooks/useSpacetimeConnection.ts
// Custom hook to manage a SpacetimeDB connection lifecycle.
//
// USAGE:
//   const { conn, isConnected, identity } = useSpacetimeConnection();
//
// This hook creates ONE connection, subscribes to all public tables,
// and exposes the typed DbConnection so components can call reducers
// or read tables via conn.db.<table>.
//
// ──────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { DbConnection } from "../spacetime-sdk/index";
import type { Identity } from "spacetimedb";

export interface SpacetimeConnectionState {
  /** The live DbConnection, null until connected. */
  conn: DbConnection | null;
  /** True once the WebSocket handshake + initial subscription sync is done. */
  isConnected: boolean;
  /** The hex string of our client identity. */
  identity: string | null;
  /** Any connection-level error. */
  error: string | null;
}

const STDB_URL = import.meta.env.VITE_STDB_URL || "ws://localhost:3000";
const STDB_DB  = import.meta.env.VITE_STDB_DB  || "memorycare-db";
const TOKEN_KEY = "stdb_auth_token";

/**
 * Establishes and manages a single SpacetimeDB WebSocket connection.
 *
 * - Connects on mount, disconnects on unmount.
 * - Subscribes to ALL public tables via `subscribeToAllTables`.
 * - Saves/restores auth tokens in localStorage for identity persistence.
 */
export function useSpacetimeConnection(): SpacetimeConnectionState {
  const [state, setState] = useState<SpacetimeConnectionState>({
    conn: null,
    isConnected: false,
    identity: null,
    error: null,
  });

  // Ref to avoid re-creating connections on re-render
  const connRef = useRef<DbConnection | null>(null);

  useEffect(() => {
    // Prevent double-connect in React StrictMode (dev)
    if (connRef.current) return;

    const savedToken = localStorage.getItem(TOKEN_KEY) ?? undefined;

    try {
      const builder = DbConnection.builder()
        .withUri(STDB_URL)
        .withDatabaseName(STDB_DB)
        .onConnect((conn: DbConnection, identity: Identity, token: string) => {
          console.log(
            "🟢 SpacetimeDB connected | identity:",
            identity.toHexString()
          );

          // Persist the auth token for future reconnects
          localStorage.setItem(TOKEN_KEY, token);

          // Subscribe to all public tables
          conn
            .subscriptionBuilder()
            .onApplied(() => {
              console.log("✅ SpacetimeDB initial sync complete");
              setState((prev) => ({ ...prev, isConnected: true }));
            })
            .onError(() => {
              console.error("🔴 SpacetimeDB subscription error");
            })
            .subscribeToAllTables();

          setState((prev) => ({
            ...prev,
            conn,
            identity: identity.toHexString(),
          }));
        })
        .onConnectError((_ctx, err: Error) => {
          console.error("🔴 SpacetimeDB connect error:", err);
          setState((prev) => ({ ...prev, error: err.message }));
        })
        .onDisconnect(() => {
          console.warn("🟡 SpacetimeDB disconnected");
          setState((prev) => ({
            ...prev,
            isConnected: false,
            conn: null,
          }));
          connRef.current = null;
        });

      // Attach saved token if present (identity persistence)
      if (savedToken) {
        builder.withToken(savedToken);
      }

      const connection = builder.build();
      connRef.current = connection;
    } catch (err: any) {
      console.error("🔴 SpacetimeDB build error:", err);
      setState((prev) => ({ ...prev, error: err.message }));
    }

    return () => {
      // Cleanup on unmount
      if (connRef.current) {
        try {
          connRef.current.disconnect();
        } catch {
          // Already disconnected
        }
        connRef.current = null;
      }
    };
  }, []);

  return state;
}
