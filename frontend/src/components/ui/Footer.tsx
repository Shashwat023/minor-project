// frontend/src/components/ui/Footer.tsx
// Site-wide footer with brand, link columns, and bottom bar.

import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => (
  <footer className="site-footer">
    <div className="footer-inner">
      <div className="footer-col">
        <Link to="/" className="nav-brand" style={{ marginBottom: "0.25rem" }}>
          <div className="nav-logo" style={{ width: 28, height: 28 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
            </svg>
          </div>
          <span className="nav-wordmark" style={{ fontSize: "1rem" }}>MemoryCare</span>
        </Link>
        <p className="footer-brand-text">
          AI-powered dementia care platform providing real-time insights through secure video consultations.
        </p>
      </div>

      <div className="footer-col">
        <h4>Platform</h4>
        <Link to="/how-it-works">How It Works</Link>
        <Link to="/demo">Try Demo</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/insights">Insights</Link>
      </div>

      <div className="footer-col">
        <h4>Resources</h4>
        <Link to="/guide">Caregiver Guide</Link>
        <Link to="/sessions">Session History</Link>
        <Link to="/patient/person_101">Patient Profile</Link>
      </div>

      <div className="footer-col">
        <h4>Company</h4>
        <Link to="/about">About</Link>
        <Link to="/privacy">Privacy Policy</Link>
        <Link to="/contact">Contact</Link>
      </div>
    </div>

    <div className="footer-bottom">
      <span>© {new Date().getFullYear()} MemoryCare. All rights reserved.</span>
      <span>Built with care for those who care.</span>
    </div>
  </footer>
);

export default Footer;
