// frontend/src/lib/spacetime.ts
// Dev 3 owns this file.
// Central SpacetimeDB connection used everywhere in the app.

const STDB_URL = "ws://localhost:3000"
const STDB_DB  = "memorycare-db"

// Placeholder - Dev 3 replaces with real SpacetimeDB client in Phase 2
export const stdb = {
  call: (reducer: string, ...args: unknown[]) => {
    console.log("[stdb mock] " + reducer, args)
  },
  subscribe: (queries: string[]) => {
    console.log("[stdb mock] subscribe", queries)
  },
}

export { STDB_URL, STDB_DB }
