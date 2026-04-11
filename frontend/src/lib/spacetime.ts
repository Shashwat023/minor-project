// frontend/src/lib/spacetime.ts
// Re-exports SpacetimeDB connection state from the React provider.
// Use `useSpacetime()` in components, or import STDB_URL/STDB_DB for config.

export const STDB_URL = import.meta.env.VITE_STDB_URL || "ws://localhost:3000";
export const STDB_DB  = import.meta.env.VITE_STDB_DB  || "memorycare-db";

// For component usage, prefer:
//   import { useSpacetime } from "../components/SpacetimeProvider";
//   const { conn, isConnected } = useSpacetime();
