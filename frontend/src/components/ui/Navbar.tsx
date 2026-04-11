// frontend/src/components/ui/Navbar.tsx
// Global navigation bar with route links, scroll-aware background.

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const BrainIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const NAV_ITEMS = [
  { to: "/how-it-works", label: "How It Works" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/sessions", label: "Sessions" },
  { to: "/insights", label: "Insights" },
  { to: "/guide", label: "Guide" },
  { to: "/about", label: "About" },
];

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <nav className={`site-nav ${scrolled ? "scrolled" : ""}`}>
      <Link to="/" className="nav-brand">
        <div className="nav-logo"><BrainIcon /></div>
        <div>
          <div className="nav-wordmark">MemoryCare</div>
          <div className="nav-subtitle">AI-Assisted Dementia Care</div>
        </div>
      </Link>

      <div className={`nav-links ${menuOpen ? "open" : ""}`}>
        {NAV_ITEMS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`nav-link ${location.pathname === to ? "active" : ""}`}
          >
            {label}
          </Link>
        ))}
        <Link to="/demo" className="nav-cta">Try Demo</Link>
      </div>

      <button
        className="nav-toggle"
        onClick={() => setMenuOpen((p) => !p)}
        aria-label="Toggle navigation"
      >
        <MenuIcon />
      </button>
    </nav>
  );
};

export default Navbar;
