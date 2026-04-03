// frontend/src/App.tsx
// Entry point — routes between:
//   GuestCall  — when URL has ?room=  (teammate's view, zero setup)
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
