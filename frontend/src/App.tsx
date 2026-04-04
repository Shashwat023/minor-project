// frontend/src/App.tsx
// Entry point — routes between:
//   GuestCall  — when URL has ?room=  (teammate's view, zero setup)
//   Dashboard  — everything else      (caregiver's full view)

// import { SpacetimeDBClient } from "./spacetime-sdk/spacetime_db_client";
// // You can import your tables like this later:
// // import { KnownPerson, Notification } from "./spacetime-sdk";

// const SPACETIMEDB_URL = import.meta.env.NGROK_LINK; 
// const SPACETIMEDB_MODULE = "memorycare-bs4ml"; 

// // Initialize the connection
// SpacetimeDBClient.connect(SPACETIMEDB_URL, SPACETIMEDB_MODULE);

// SpacetimeDBClient.onConnect(() => {
//   console.log("🟢 Connected to Backend!");
// });

import React from "react";
import GuestCall  from "./components/GuestCall";
import Dashboard  from "./components/Dashboard";

const App: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("room");

  // Any URL with ?room= → minimal guest call UI
  if (roomId) return <GuestCall roomId={roomId} />;

  // Default → full caregiver dashboard
  return <Dashboard />;
};

export default App;
