// frontend/src/App.tsx
// Entry point — routes between:
//   GuestCall    — when URL has ?room=  (teammate's view, zero setup)
//   Multi-page   — everything else with react-router-dom
//
// CRITICAL: The ?room= detection is preserved at the top level
// so GuestCall ALWAYS takes priority, exactly as before.

import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import GuestCall from "./components/GuestCall";
import Navbar from "./components/ui/Navbar";
import Footer from "./components/ui/Footer";

// Lazy load pages for performance
const LandingPage = lazy(() => import("./pages/LandingPage"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage"));
const DemoPage = lazy(() => import("./pages/DemoPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const SessionHistoryPage = lazy(() => import("./pages/SessionHistoryPage"));
const PatientProfilePage = lazy(() => import("./pages/PatientProfilePage"));
const InsightsPage = lazy(() => import("./pages/InsightsPage"));
const CaregiverGuidePage = lazy(() => import("./pages/CaregiverGuidePage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));

// Loading fallback
const PageLoader = () => (
  <div style={{
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", background: "var(--bg-base)",
  }}>
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "3px solid var(--glass-border)",
        borderTopColor: "var(--accent)",
        animation: "spin 0.8s linear infinite",
        margin: "0 auto 1rem",
      }} />
      <div style={{ color: "var(--text-4)", fontSize: "0.875rem" }}>Loading…</div>
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Layout wrapper — hides nav/footer on Demo page, footer on Landing
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isDemoPage = location.pathname === "/demo";
  const isLandingPage = location.pathname === "/";

  if (isDemoPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      {children}
      {!isLandingPage && <Footer />}
    </>
  );
};

const AppRoutes: React.FC = () => (
  <Layout>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/sessions" element={<SessionHistoryPage />} />
        <Route path="/patient/:patientId" element={<PatientProfilePage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/guide" element={<CaregiverGuidePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </Suspense>
  </Layout>
);

const App: React.FC = () => {
  // ?room= takes absolute priority — exactly as before
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("room");

  if (roomId) return <GuestCall roomId={roomId} />;

  // Everything else → multi-page app with routing
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
