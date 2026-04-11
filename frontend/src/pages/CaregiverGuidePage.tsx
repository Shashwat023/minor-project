// frontend/src/pages/CaregiverGuidePage.tsx
// FAQ and guidance for caregivers using MemoryCare.

import React from "react";
import { Link } from "react-router-dom";
import SectionWrapper from "../components/ui/SectionWrapper";
import AnimatedAccordion from "../components/ui/AnimatedAccordion";
import FadeInSection from "../components/ui/FadeInSection";
import GradientBorderCard from "../components/ui/GradientBorderCard";

const FAQ_ITEMS = [
  {
    id: "1",
    title: "How do I start a video session with my patient?",
    content: "Navigate to the Demo page and click 'Start Session'. Select the patient from the dropdown, then click 'Join Video Call'. Share the generated link with the patient or family member on the other end. The call connects automatically when both parties join.",
  },
  {
    id: "2",
    title: "How does the AI summary work?",
    content: "During the call, audio is recorded in 20-second chunks and sent to our speech-to-text pipeline. Each chunk is transcribed and then processed by an LLM to generate a rolling clinical summary. You'll see these summaries update in real-time on the right panel of your dashboard.",
  },
  {
    id: "3",
    title: "Is patient data secure?",
    content: "Yes. Video calls use WebRTC peer-to-peer encryption. Audio processing happens on your secure server infrastructure. All data is transmitted over encrypted channels and session data is stored with access controls. We follow HIPAA-conscious architecture principles.",
  },
  {
    id: "4",
    title: "What happens when the session ends?",
    content: "When you click 'End Session', all audio chunks are compiled and a comprehensive final summary is generated. This summary covers the entire conversation and can be reviewed in the Session History. If the bridge service is configured, summaries are also forwarded to the database.",
  },
  {
    id: "5",
    title: "Can I review past sessions?",
    content: "Yes. Visit the Session History page to see all past sessions. Each entry shows the patient name, date, duration, number of audio chunks processed, and the AI-generated summary. You can filter by patient to see their specific history.",
  },
  {
    id: "6",
    title: "What does the visual assessment capture?",
    content: "The ML service automatically captures periodic screenshots from the video feed during active calls. These snapshots are analyzed for visual cues such as facial expressions and behavioral indicators. This adds a visual dimension to the AI's understanding of each session.",
  },
  {
    id: "7",
    title: "How should I prepare the patient for a call?",
    content: "Ensure the patient is in a comfortable, well-lit environment. Minimize background noise. If possible, have a family member nearby for support. The platform is designed to be non-intrusive — the patient simply needs to be on a video call as they would normally.",
  },
  {
    id: "8",
    title: "What if the video call disconnects?",
    content: "If the connection drops, the system detects it immediately. You can rejoin the call by clicking 'Rejoin Call' on the dashboard. Audio chunks already sent will be preserved, so no session data is lost. The summary will continue from where it left off.",
  },
];

const TIPS = [
  { icon: "💡", title: "Consistent Scheduling", desc: "Regular session times help establish routine and reduce patient anxiety." },
  { icon: "📋", title: "Review Before Sessions", desc: "Check past session summaries to maintain continuity and track changes." },
  { icon: "🎯", title: "Structured Questions", desc: "Use consistent questions about sleep, mood, and daily activities for comparable data." },
  { icon: "❤️", title: "Patience & Warmth", desc: "Allow extra response time. A calm, warm demeanor directly improves session quality." },
];

const CaregiverGuidePage: React.FC = () => (
  <div className="page-wrapper">
    <div className="page-content" style={{ paddingTop: "64px" }}>
      <SectionWrapper
        label="Caregiver Guide"
        title="Getting the most from MemoryCare"
        description="Practical guidance for caregivers using the platform, from session setup to interpreting AI insights."
      >
        <div className="feature-grid" style={{ marginBottom: "4rem" }}>
          {TIPS.map((tip, i) => (
            <GradientBorderCard key={i} delay={i * 0.1}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>{tip.icon}</div>
              <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--text-1)", marginBottom: "0.5rem" }}>
                {tip.title}
              </h3>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-3)", lineHeight: 1.6 }}>
                {tip.desc}
              </p>
            </GradientBorderCard>
          ))}
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{
            fontSize: "1.5rem", fontWeight: 700, color: "var(--text-1)",
            textAlign: "center", marginBottom: "2rem",
          }}>
            Frequently Asked Questions
          </h2>
          <AnimatedAccordion items={FAQ_ITEMS} />
        </div>
      </SectionWrapper>

      <div className="cta-section">
        <FadeInSection>
          <div className="cta-content">
            <h2>Ready to start?</h2>
            <p>Jump into your first AI-assisted care session or explore the dashboard.</p>
            <div className="hero-actions">
              <Link to="/demo" className="btn btn-primary">Start Session</Link>
              <Link to="/dashboard" className="btn btn-secondary">View Dashboard</Link>
            </div>
          </div>
        </FadeInSection>
      </div>
    </div>
  </div>
);

export default CaregiverGuidePage;
