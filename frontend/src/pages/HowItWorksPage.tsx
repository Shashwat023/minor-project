// frontend/src/pages/HowItWorksPage.tsx
// Step-by-step explanation of the MemoryCare pipeline.

import React from "react";
import { Link } from "react-router-dom";
import SectionWrapper from "../components/ui/SectionWrapper";
import TimelineStep from "../components/ui/TimelineStep";
import FadeInSection from "../components/ui/FadeInSection";
import GradientBorderCard from "../components/ui/GradientBorderCard";

const STEPS = [
  {
    title: "Start a Secure Session",
    desc: "The caregiver opens MemoryCare and starts a new session, selecting the patient profile. A unique session ID is generated and a secure video link is created.",
  },
  {
    title: "Connect via Video Call",
    desc: "Both caregiver and patient (or family member) join the WebRTC-powered video call. Peer-to-peer encryption ensures privacy. Audio recording begins automatically.",
  },
  {
    title: "Real-Time Transcription",
    desc: "Audio chunks are sent every 20 seconds to our STT pipeline (Whisper). Transcriptions are processed immediately and stored with session context.",
  },
  {
    title: "AI Summary Generation",
    desc: "Each transcription chunk is fed to the LLM pipeline which generates rolling clinical summaries. These appear live in the caregiver's dashboard.",
  },
  {
    title: "Visual Assessment",
    desc: "The ML service captures periodic snapshots from the video feed, analyzing visual cues and behavioral indicators for comprehensive assessment.",
  },
  {
    title: "Session Report",
    desc: "When the session ends, a comprehensive final summary is generated combining all chunks. The report is stored and available for longitudinal tracking.",
  },
];

const TECH_STACK = [
  { label: "Video", tech: "WebRTC + Socket.IO", desc: "Peer-to-peer video with STUN/TURN relay" },
  { label: "Speech", tech: "OpenAI Whisper", desc: "State-of-the-art speech recognition" },
  { label: "AI", tech: "LLM Pipeline", desc: "Context-aware summary generation" },
  { label: "Vision", tech: "ML Service", desc: "Automated visual snapshot analysis" },
];

const HowItWorksPage: React.FC = () => (
  <div className="page-wrapper">
    <div className="page-content" style={{ paddingTop: "64px" }}>
      <SectionWrapper
        label="How It Works"
        title="From call to clinical insight in seconds"
        description="MemoryCare's pipeline transforms every video consultation into structured, actionable clinical data — automatically."
      >
        <div className="timeline">
          {STEPS.map((step, i) => (
            <TimelineStep
              key={i}
              number={i + 1}
              title={step.title}
              description={step.desc}
              isLast={i === STEPS.length - 1}
              delay={i * 0.1}
            />
          ))}
        </div>
      </SectionWrapper>

      <SectionWrapper
        label="Technology"
        title="Built on proven foundations"
        description="Every component in our stack is chosen for reliability, speed, and privacy."
      >
        <div className="feature-grid">
          {TECH_STACK.map((item, i) => (
            <GradientBorderCard key={i} delay={i * 0.1}>
              <div style={{
                fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.1em", color: "var(--accent)", marginBottom: "0.75rem",
              }}>
                {item.label}
              </div>
              <h3 style={{
                fontSize: "1.25rem", fontWeight: 700, color: "var(--text-1)",
                marginBottom: "0.5rem",
              }}>
                {item.tech}
              </h3>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-3)", lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </GradientBorderCard>
          ))}
        </div>
      </SectionWrapper>

      <div className="cta-section">
        <FadeInSection>
          <div className="cta-content">
            <h2>See it in action</h2>
            <p>Experience the full pipeline — start a demo session and watch AI summaries generate in real-time.</p>
            <Link to="/demo" className="btn btn-primary">Start Demo Session</Link>
          </div>
        </FadeInSection>
      </div>
    </div>
  </div>
);

export default HowItWorksPage;
