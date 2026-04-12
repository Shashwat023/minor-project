import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SpacetimeProvider } from "./components/SpacetimeProvider";
import { AgitationProvider } from "./contexts/AgitationContext";
import "./index.css";
import "./styles/landing.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SpacetimeProvider>
      <AgitationProvider>
        <App />
      </AgitationProvider>
    </SpacetimeProvider>
  </React.StrictMode>
);
