// frontend/src/pages/AboutPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import SectionWrapper from "../components/ui/SectionWrapper";
import FadeInSection from "../components/ui/FadeInSection";
import AnimatedCard from "../components/ui/AnimatedCard";

const VALUES = [
  { icon: "🤝", title: "Compassion First", desc: "Technology amplifies human connection. Every feature supports — never replaces — the caregiver relationship." },
  { icon: "🔬", title: "Evidence-Based", desc: "AI models built on clinical frameworks. Summaries grounded in validated assessment methodologies." },
  { icon: "🛡️", title: "Privacy by Design", desc: "Encryption, access controls, and data minimization are architectural foundations, not afterthoughts." },
  { icon: "♿", title: "Accessible to All", desc: "Contrast ratios, interaction patterns, and UX designed for all technical abilities and accessibility needs." },
];

const TEAM = [
  { name: "Research & AI", desc: "LLM pipeline, RAG, speech-to-text" },
  { name: "Computer Vision", desc: "ML service, snapshot analysis" },
  { name: "Real-Time Systems", desc: "WebRTC, signaling, bridge" },
  { name: "Database", desc: "SpacetimeDB, session persistence" },
  { name: "Frontend & UX", desc: "React dashboard, responsive design" },
];

const AboutPage: React.FC = () => (
  <div className="page-wrapper">
    <div className="page-content" style={{ paddingTop: "64px" }}>
      <SectionWrapper label="About" title="Redefining dementia care with AI"
        description="MemoryCare was born from a belief that technology can make caregiving more informed, consistent, and compassionate.">
        <FadeInSection>
          <div style={{ maxWidth: 720, margin: "0 auto 4rem", textAlign: "center" }}>
            <p style={{ fontSize: "1.0625rem", color: "var(--text-3)", lineHeight: 1.8, marginBottom: "1.5rem" }}>
              By combining real-time video consultations with live speech transcription, AI summarization, and
              visual assessment, we help caregivers focus on what matters most: the person in front of them.
            </p>
          </div>
        </FadeInSection>
      </SectionWrapper>

      <SectionWrapper label="Our Values" title="What guides us">
        <div className="feature-grid">
          {VALUES.map((v, i) => (
            <AnimatedCard key={i} delay={i * 0.08}>
              <div className="feature-icon">{v.icon}</div>
              <h3>{v.title}</h3>
              <p>{v.desc}</p>
            </AnimatedCard>
          ))}
        </div>
      </SectionWrapper>

      <SectionWrapper label="The Team" title="Built by specialists">
        <div className="feature-grid">
          {TEAM.map((t, i) => (
            <FadeInSection key={i} delay={i * 0.08}>
              <div style={{ padding: "1.5rem", background: "var(--glass-1)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-md)" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-1)", marginBottom: "0.375rem" }}>{t.name}</h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-3)", lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </SectionWrapper>

      <div className="cta-section">
        <FadeInSection>
          <div className="cta-content">
            <h2>Join us in building the future of care</h2>
            <Link to="/contact" className="btn btn-primary">Get in Touch</Link>
          </div>
        </FadeInSection>
      </div>
    </div>
  </div>
);

export default AboutPage;
