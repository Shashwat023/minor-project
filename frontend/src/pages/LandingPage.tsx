// frontend/src/pages/LandingPage.tsx
// Immersive cinematic landing — the user scrolls THROUGH a 3D neural environment.
// 4 Scenes: Fragmented Memory → AI Intervention → Structured Cognition → Continuous Care
// The 3D frame sequence is a FIXED full-viewport background. Content floats above it.

import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import NeuralHero3D from "../components/ui/NeuralHero3D";

// Total scroll height: 4 scenes × 100vh + buffer
const SCENE_COUNT = 4;
const TOTAL_HEIGHT_VH = SCENE_COUNT * 100;

// ── Fade-in helper ────────────────────────────────────────────────────────────
const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, y = 30, className, style }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.5 }}
    transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
    style={style}
  >
    {children}
  </motion.div>
);

// ── Glass panel component ─────────────────────────────────────────────────────
const GlassPanel: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className = "", style }) => (
  <motion.div
    className={`immersive-glass ${className}`}
    style={style}
    initial={{ opacity: 0, y: 24, scale: 0.97 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    viewport={{ once: true, amount: 0.4 }}
    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
);

const LandingPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollHeight, setScrollHeight] = useState(TOTAL_HEIGHT_VH * (window.innerHeight / 100));

  // Recalculate on mount and resize
  useEffect(() => {
    const calc = () => {
      if (containerRef.current) {
        setScrollHeight(containerRef.current.scrollHeight);
      }
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  return (
    <div ref={containerRef} className="immersive-landing">
      {/* ═══ FIXED 3D NEURAL ENVIRONMENT ═══ */}
      <NeuralHero3D scrollHeight={scrollHeight} />

      {/* ═══ SCENE 1 — FRAGMENTED MEMORY ═══ */}
      <section className="immersive-scene immersive-scene--1">
        <div className="immersive-scene__content">
          <Reveal delay={0.1}>
            <span className="immersive-badge">
              <span className="immersive-badge__dot" />
              AI-Assisted Dementia Care
            </span>
          </Reveal>

          <Reveal delay={0.25}>
            <h1 className="immersive-title">
              <span className="immersive-title__line">Compassionate care,</span>
              <span className="immersive-title__line immersive-title__gradient">
                powered by AI.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.5}>
            <p className="immersive-subtitle">
              MemoryCare reconstructs fragmented cognitive patterns into
              structured clinical understanding — in real-time.
            </p>
          </Reveal>

          <Reveal delay={0.65}>
            <div className="immersive-actions">
              <Link to="/demo" className="btn btn-primary btn--glow">
                Start a Session
              </Link>
              <Link to="/how-it-works" className="btn btn-secondary btn--glass">
                How It Works
              </Link>
            </div>
          </Reveal>

          {/* Scroll indicator */}
          <Reveal delay={1.0}>
            <div className="immersive-scroll-hint">
              <div className="immersive-scroll-hint__line" />
              <span>Scroll to explore</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ SCENE 2 — AI INTERVENTION ═══ */}
      <section className="immersive-scene immersive-scene--2">
        <div className="immersive-scene__content immersive-scene__content--left">
          <Reveal>
            <span className="immersive-scene-label">AI Intervention</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="immersive-heading">
              Neural pathways<br />begin forming.
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="immersive-body">
              As conversations happen, our AI listens, transcribes, and begins
              constructing cognitive maps from fragmented dialogue.
            </p>
          </Reveal>

          <div className="immersive-panels">
            <GlassPanel>
              <div className="immersive-panel-icon">🎙️</div>
              <h4>Real-Time Transcription</h4>
              <p>
                Live speech-to-text powered by Whisper, capturing every word
                with clinical precision.
              </p>
            </GlassPanel>

            <GlassPanel style={{ transitionDelay: "0.1s" }}>
              <div className="immersive-panel-icon">🧠</div>
              <h4>Cognitive Pattern Recognition</h4>
              <p>
                AI identifies behavioral markers, mood shifts, and memory
                recall patterns as they emerge.
              </p>
            </GlassPanel>

            <GlassPanel style={{ transitionDelay: "0.2s" }}>
              <div className="immersive-panel-icon">📡</div>
              <h4>Conversation Analysis</h4>
              <p>
                LLM-generated clinical summaries updated continuously throughout
                every session.
              </p>
            </GlassPanel>
          </div>
        </div>
      </section>

      {/* ═══ SCENE 3 — STRUCTURED COGNITION ═══ */}
      <section className="immersive-scene immersive-scene--3">
        <div className="immersive-scene__content immersive-scene__content--right">
          <Reveal>
            <span className="immersive-scene-label">Structured Understanding</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="immersive-heading">
              Fragmented memories<br />become clinical insight.
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="immersive-body">
              The neural network stabilizes. Scattered observations transform
              into actionable medical intelligence.
            </p>
          </Reveal>

          <div className="immersive-cards">
            <GlassPanel className="immersive-card--wide">
              <div className="immersive-card__header">
                <div className="immersive-card__icon">📊</div>
                <div>
                  <h4>Clinical Summaries</h4>
                  <p className="immersive-card__meta">AI-generated per session</p>
                </div>
              </div>
              <p>
                Comprehensive session notes synthesized from conversation,
                visual assessment, and behavioral analysis.
              </p>
            </GlassPanel>

            <div className="immersive-cards__row">
              <GlassPanel>
                <div className="immersive-card__icon">📈</div>
                <h4>Longitudinal Trends</h4>
                <p>Track cognitive changes across sessions,
                  weeks, and months.</p>
              </GlassPanel>

              <GlassPanel>
                <div className="immersive-card__icon">🔍</div>
                <h4>Behavioral Detection</h4>
                <p>Automated identification of agitation,
                  confusion, and mood patterns.</p>
              </GlassPanel>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SCENE 4 — CONTINUOUS CARE ═══ */}
      <section className="immersive-scene immersive-scene--4">
        <div className="immersive-scene__content immersive-scene__content--center">
          <Reveal>
            <span className="immersive-scene-label">Continuous Intelligence</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="immersive-heading immersive-heading--large">
              Care that learns.<br />
              <span className="immersive-title__gradient">Always.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="immersive-body" style={{ maxWidth: 520 }}>
              Every session strengthens the network. MemoryCare delivers
              continuous, evolving intelligence for the entire care team.
            </p>
          </Reveal>

          <Reveal delay={0.35}>
            <div className="immersive-stats">
              <div className="immersive-stat">
                <div className="immersive-stat__value">98%</div>
                <div className="immersive-stat__label">Summary Accuracy</div>
              </div>
              <div className="immersive-stat">
                <div className="immersive-stat__value">&lt;2s</div>
                <div className="immersive-stat__label">Processing Latency</div>
              </div>
              <div className="immersive-stat">
                <div className="immersive-stat__value">24/7</div>
                <div className="immersive-stat__label">Always Available</div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.5}>
            <div className="immersive-actions immersive-actions--final">
              <Link to="/demo" className="btn btn-primary btn--glow btn--lg">
                Start a Session
              </Link>
              <Link to="/dashboard" className="btn btn-secondary btn--glass">
                View Dashboard
              </Link>
              <Link to="/insights" className="btn btn-secondary btn--glass">
                Explore Insights
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
