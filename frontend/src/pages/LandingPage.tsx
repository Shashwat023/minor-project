// frontend/src/pages/LandingPage.tsx
// Premium landing page with parallax hero, animated headline, feature grid,
// social proof stats, and CTA sections.

import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import ParallaxHero from "../components/ui/ParallaxHero";
import AnimatedHeadline from "../components/ui/AnimatedHeadline";
import SectionWrapper from "../components/ui/SectionWrapper";
import FadeInSection from "../components/ui/FadeInSection";
import AnimatedCard from "../components/ui/AnimatedCard";
import StaggerContainer, { staggerItem } from "../components/ui/StaggerContainer";
import GradientBorderCard from "../components/ui/GradientBorderCard";
import FeatureCarousel from "../components/ui/FeatureCarousel";

const FEATURES = [
  {
    icon: "🎥",
    iconClass: "",
    title: "Real-Time Video Calls",
    desc: "Secure, low-latency WebRTC video consultations between caregivers and patients — anytime, anywhere.",
  },
  {
    icon: "🧠",
    iconClass: "blue",
    title: "AI-Powered Summaries",
    desc: "Live conversation transcription and LLM-generated clinical summaries updated in real-time during calls.",
  },
  {
    icon: "📸",
    iconClass: "green",
    title: "Visual Assessment",
    desc: "Automated snapshot capture with ML analysis to track visual indicators and behavioral patterns.",
  },
  {
    icon: "📊",
    iconClass: "amber",
    title: "Longitudinal Insights",
    desc: "Session-over-session trend analysis to track cognitive and behavioral changes over time.",
  },
  {
    icon: "🔒",
    iconClass: "rose",
    title: "Privacy-First Design",
    desc: "End-to-end encrypted calls with HIPAA-conscious architecture. Data stays secure and controlled.",
  },
  {
    icon: "👥",
    iconClass: "",
    title: "Multi-Caregiver Support",
    desc: "Share session notes and insights across the entire care team for coordinated decision-making.",
  },
];

const TESTIMONIALS = [
  {
    quote: "MemoryCare transformed how our team coordinates care. The AI summaries save us hours of documentation.",
    author: "Dr. Sarah Chen",
    role: "Geriatric Specialist",
  },
  {
    quote: "Being able to review past session insights gives us confidence in tracking progression patterns.",
    author: "James Rodriguez",
    role: "Family Caregiver",
  },
  {
    quote: "The real-time summary feature is like having a clinical assistant in every consultation.",
    author: "Dr. Priya Patel",
    role: "Neurologist",
  },
];

const LandingPage: React.FC = () => (
  <div className="page-wrapper">
    <div className="page-content">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <ParallaxHero>
        <FadeInSection delay={0.1}>
          <span className="hero-badge">
            <span className="badge-dot" />
            AI-Assisted Dementia Care
          </span>
        </FadeInSection>

        <AnimatedHeadline
          text="Compassionate care,"
          className="hero-title"
          delay={0.2}
        />
        <AnimatedHeadline
          text="powered by AI."
          className="hero-title"
          gradient
          delay={0.6}
          as="h1"
        />

        <FadeInSection delay={0.9}>
          <p className="hero-subtitle">
            MemoryCare combines real-time video consultations with live AI-generated 
            clinical summaries, helping caregivers deliver better outcomes through 
            every interaction.
          </p>
        </FadeInSection>

        <FadeInSection delay={1.1}>
          <div className="hero-actions">
            <Link to="/demo" className="btn btn-primary">
              Start a Session
            </Link>
            <Link to="/how-it-works" className="btn btn-secondary">
              How It Works
            </Link>
          </div>
        </FadeInSection>

        <FadeInSection delay={1.3}>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">98%</div>
              <div className="hero-stat-label">Summary Accuracy</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">&lt;2s</div>
              <div className="hero-stat-label">Processing Latency</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">24/7</div>
              <div className="hero-stat-label">Always Available</div>
            </div>
          </div>
        </FadeInSection>
      </ParallaxHero>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <SectionWrapper
        label="Features"
        title="Everything you need for intelligent care"
        description="A complete platform that augments human judgment with AI precision, designed specifically for dementia care professionals."
      >
        <StaggerContainer className="feature-grid" stagger={0.08}>
          {FEATURES.map((f, i) => (
            <motion.div key={i} variants={staggerItem}>
              <AnimatedCard delay={0} hoverable>
                <div className={`feature-icon ${f.iconClass}`}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </AnimatedCard>
            </motion.div>
          ))}
        </StaggerContainer>
      </SectionWrapper>

      {/* ── Testimonials Carousel ─────────────────────────────────────── */}
      <SectionWrapper
        label="Trusted by professionals"
        title="What caregivers are saying"
        description="Hear from the people who use MemoryCare every day to deliver better patient outcomes."
      >
        <FeatureCarousel>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="carousel-item">
              <GradientBorderCard delay={i * 0.1}>
                <p style={{
                  fontSize: "1.0625rem",
                  color: "var(--text-2)",
                  lineHeight: 1.7,
                  marginBottom: "1.5rem",
                  fontStyle: "italic",
                }}>
                  "{t.quote}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: "var(--accent-dim)", border: "1px solid rgba(188,108,37,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1rem", fontWeight: 700, color: "var(--accent)",
                  }}>
                    {t.author[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-1)" }}>
                      {t.author}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-4)" }}>
                      {t.role}
                    </div>
                  </div>
                </div>
              </GradientBorderCard>
            </div>
          ))}
        </FeatureCarousel>
      </SectionWrapper>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <div className="cta-section">
        <FadeInSection>
          <div className="cta-content">
            <h2>Ready to transform dementia care?</h2>
            <p>
              Start your first AI-assisted session today. No setup required — 
              just connect and let MemoryCare handle the rest.
            </p>
            <div className="hero-actions">
              <Link to="/demo" className="btn btn-primary">
                Try the Demo
              </Link>
              <Link to="/contact" className="btn btn-secondary">
                Get in Touch
              </Link>
            </div>
          </div>
        </FadeInSection>
      </div>
    </div>
  </div>
);

export default LandingPage;
