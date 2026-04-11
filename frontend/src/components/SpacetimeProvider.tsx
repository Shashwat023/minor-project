// frontend/src/components/SpacetimeProvider.tsx
// React context provider that wraps the app with a SpacetimeDB connection.
//
// Components deeper in the tree can call:
//   const { conn, isConnected } = useSpacetime();
//
// This file is additive — existing components are unaffected unless they
// explicitly opt in by calling the hook.

import React, { createContext, useContext } from "react";
import {
  useSpacetimeConnection,
  type SpacetimeConnectionState,
} from "../hooks/useSpacetimeConnection";

const SpacetimeContext = createContext<SpacetimeConnectionState>({
  conn: null,
  isConnected: false,
  identity: null,
  error: null,
});

/** Use this hook to access the SpacetimeDB connection from any component. */
export function useSpacetime(): SpacetimeConnectionState {
  return useContext(SpacetimeContext);
}

/** Wrap your app (or a subtree) to provide a live SpacetimeDB connection. */
export const SpacetimeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const state = useSpacetimeConnection();

  return (
    <SpacetimeContext.Provider value={state}>
      {children}
    </SpacetimeContext.Provider>
  );
};
