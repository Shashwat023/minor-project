// frontend/src/pages/DemoPage.tsx
// Wraps the existing Dashboard component with enhanced layout.
// This is the "Try Session" / "Demo" page — all original functionality preserved.

import React from "react";
import Dashboard from "../components/Dashboard";

const DemoPage: React.FC = () => {
  // The existing Dashboard handles everything:
  // - session management
  // - video call (WebRTC)
  // - live summary polling
  // - snapshot capture
  // - voice recording
  // We just mount it inside the page wrapper.
  // NOTE: Dashboard has its own .app layout with navbar, so we render it directly.
  return <Dashboard />;
};

export default DemoPage;
