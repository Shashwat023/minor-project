// frontend/src/pages/InsightsPage.tsx
// Data visualization page with CSS-based charts and metric rings.

import React from "react";
import { motion } from "framer-motion";
import SectionWrapper from "../components/ui/SectionWrapper";
import DashboardCard from "../components/ui/DashboardCard";
import MetricCard from "../components/ui/MetricCard";
import FadeInSection from "../components/ui/FadeInSection";

const WEEKLY_DATA = [
  { day: "Mon", sessions: 3, height: 45 },
  { day: "Tue", sessions: 5, height: 75 },
  { day: "Wed", sessions: 2, height: 30 },
  { day: "Thu", sessions: 7, height: 100 },
  { day: "Fri", sessions: 4, height: 60 },
  { day: "Sat", sessions: 1, height: 15 },
  { day: "Sun", sessions: 2, height: 30 },
];

const PATIENT_TRENDS = [
  { name: "Margaret Johnson", trend: "Stable", score: 82, color: "var(--success)" },
  { name: "Robert Smith", trend: "Improving", score: 71, color: "var(--accent)" },
  { name: "Eleanor Davis", trend: "Monitoring", score: 64, color: "var(--warning)" },
];

const InsightsPage: React.FC = () => (
  <div className="page-wrapper">
    <div className="page-content" style={{ paddingTop: "64px" }}>
      <SectionWrapper>
        <FadeInSection>
          <div style={{ marginBottom: "2rem" }}>
            <h1 style={{
              fontSize: "1.75rem", fontWeight: 800, color: "var(--text-1)",
              letterSpacing: "-0.02em", marginBottom: "0.375rem",
            }}>
              Insights
            </h1>
            <p style={{ fontSize: "0.9375rem", color: "var(--text-4)" }}>
              Longitudinal trends and care quality metrics across all patients.
            </p>
          </div>
        </FadeInSection>

        <div className="dashboard-metrics">
          <MetricCard label="Avg Session Score" value="72%" change="+3% this month" trend="up" delay={0.05} />
          <MetricCard label="Sessions This Week" value="24" change="+6 from last week" trend="up" delay={0.1} />
          <MetricCard label="Summary Quality" value="96%" change="Consistent" trend="neutral" delay={0.15} />
          <MetricCard label="Response Time" value="1.8s" change="-0.3s improvement" trend="up" delay={0.2} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginTop: "0.25rem" }}>
          <DashboardCard label="Weekly Sessions" delay={0.25}>
            <div className="chart-bar-group">
              {WEEKLY_DATA.map((d, i) => (
                <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                  <motion.div
                    style={{
                      width: "100%",
                      background: "linear-gradient(to top, var(--accent), var(--accent-light))",
                      borderRadius: "4px 4px 0 0",
                      minHeight: 4,
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${d.height}%` }}
                    transition={{ duration: 0.6, delay: 0.3 + i * 0.08, ease: [0.34, 1.56, 0.64, 1] }}
                  />
                  <div style={{
                    fontSize: "0.6875rem", color: "var(--text-4)",
                    marginTop: "0.5rem", fontWeight: 600,
                  }}>
                    {d.day}
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard label="Patient Trends" delay={0.3}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {PATIENT_TRENDS.map((p, i) => (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.1 }}
                  style={{
                    display: "flex", alignItems: "center", gap: "1rem",
                    padding: "1rem", background: "var(--glass-1)",
                    borderRadius: "var(--radius-sm)", border: "1px solid var(--glass-border)",
                  }}
                >
                  {/* Ring */}
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
                    background: `conic-gradient(${p.color} ${p.score * 3.6}deg, var(--glass-2) 0)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative",
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: "var(--bg-secondary)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.75rem", fontWeight: 800, color: "var(--text-1)",
                    }}>
                      {p.score}
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-1)" }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: p.color, fontWeight: 600 }}>
                      {p.trend}
                    </div>
                  </div>

                  <div style={{
                    width: 60, height: 24,
                    background: `linear-gradient(90deg, transparent, ${p.color}40)`,
                    borderRadius: 4,
                    display: "flex", alignItems: "flex-end",
                  }}>
                    {[30, 50, 35, 65, 55, 70, p.score].map((v, j) => (
                      <div key={j} style={{
                        flex: 1, background: p.color,
                        height: `${v}%`, borderRadius: "1px 1px 0 0",
                        opacity: 0.5 + (j / 14),
                      }} />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </DashboardCard>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem", marginTop: "1.25rem" }}>
          <DashboardCard label="Top Keywords" delay={0.4}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {["sleep quality", "medication", "appetite", "mood", "confusion", "routine", "hydration", "agitation", "recall", "engagement"].map((kw, i) => (
                <span key={kw} style={{
                  padding: "0.3rem 0.75rem",
                  background: i < 3 ? "var(--accent-dim)" : "var(--glass-2)",
                  border: `1px solid ${i < 3 ? "rgba(123,143,255,0.2)" : "var(--glass-border)"}`,
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.75rem",
                  color: i < 3 ? "var(--accent)" : "var(--text-3)",
                  fontWeight: 600,
                }}>
                  {kw}
                </span>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard label="Session Duration Trend" delay={0.45}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "0.375rem", height: 100 }}>
              {[8, 12, 10, 15, 14, 18, 12, 16, 14, 22, 15, 14].map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${(v / 22) * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.04 }}
                  style={{
                    flex: 1,
                    background: `linear-gradient(to top, rgba(74,222,128,0.2), var(--success))`,
                    borderRadius: "2px 2px 0 0",
                  }}
                />
              ))}
            </div>
          </DashboardCard>

          <DashboardCard label="Care Quality" delay={0.5}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem 0" }}>
              <div style={{
                width: 100, height: 100, borderRadius: "50%",
                background: `conic-gradient(var(--success) ${96 * 3.6}deg, var(--glass-2) 0)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
              }}>
                <div style={{
                  width: 76, height: 76, borderRadius: "50%",
                  background: "var(--bg-secondary)",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-1)" }}>96</div>
                  <div style={{ fontSize: "0.625rem", color: "var(--text-4)", fontWeight: 600, textTransform: "uppercase" }}>Score</div>
                </div>
              </div>
            </div>
          </DashboardCard>
        </div>
      </SectionWrapper>
    </div>
  </div>
);

export default InsightsPage;
