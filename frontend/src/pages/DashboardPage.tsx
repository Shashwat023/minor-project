// frontend/src/pages/DashboardPage.tsx
// Dashboard overview — live metrics and recent sessions from SpacetimeDB.

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import MetricCard from "../components/ui/MetricCard";
import DashboardCard from "../components/ui/DashboardCard";
import FadeInSection from "../components/ui/FadeInSection";
import { useSpacetimeTables } from "../hooks/useSpacetimeTables";

const PATIENTS: Record<string, string> = {
  person_101: "Margaret Johnson",
  person_102: "Robert Smith",
  person_103: "Eleanor Davis",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return iso; }
}

// Fixture data shown while STDB is empty
const FIXTURE_SESSIONS = [
  {
    sessionId: "f1", personId: "person_101", meetingDate: "2026-04-03",
    summary: "Patient greeted caregiver, discussed sleep quality and mild morning confusion. Mood stable.",
  },
  {
    sessionId: "f2", personId: "person_102", meetingDate: "2026-04-02",
    summary: "Medication schedule reviewed, appetite changes noted. Improved recall during conversation.",
  },
  {
    sessionId: "f3", personId: "person_103", meetingDate: "2026-04-01",
    summary: "Evening agitation discussed. Environmental adjustments and routine modifications recommended.",
  },
];

const DashboardPage: React.FC = () => {
  const { meetingSummaries, knownPersons, synced } = useSpacetimeTables();

  // Derived metrics
  const totalSessions = synced && meetingSummaries.length > 0
    ? meetingSummaries.length
    : 47;

  const activePatients = synced
    ? Math.max(knownPersons.length, Object.keys(PATIENTS).length)
    : 3;

  // Recent sessions: last 3 by date
  const recentSessions = useMemo(() => {
    if (synced && meetingSummaries.length > 0) {
      return [...meetingSummaries]
        .sort((a, b) => Number(b.createdAt - a.createdAt))
        .slice(0, 3);
    }
    return FIXTURE_SESSIONS;
  }, [meetingSummaries, synced]);

  const isLive = synced && meetingSummaries.length > 0;

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ paddingTop: "64px" }}>
        <div className="section" style={{ paddingBottom: "2rem" }}>
          <FadeInSection>
            <div style={{ marginBottom: "2rem", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div>
                <h1 style={{
                  fontSize: "1.75rem", fontWeight: 800, color: "var(--text-1)",
                  letterSpacing: "-0.02em", marginBottom: "0.375rem",
                }}>
                  Dashboard
                </h1>
                <p style={{ fontSize: "0.9375rem", color: "var(--text-4)" }}>
                  Overview of your care sessions and patient metrics.
                </p>
              </div>
              {/* DB status pill */}
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
                padding: "0.3rem 0.875rem",
                borderRadius: "9999px",
                background: isLive ? "var(--success-dim)" : "var(--glass-2)",
                border: `1px solid ${isLive ? "rgba(34,197,94,0.3)" : "var(--glass-border)"}`,
                fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: isLive ? "var(--success)" : "var(--text-4)",
              }}>
                <span className={`dot ${isLive ? "dot-active" : synced ? "dot-idle" : "dot-pending"}`} style={{ width: 6, height: 6 }} />
                {isLive ? "Live Data" : synced ? "No sessions yet" : "Syncing…"}
              </span>
            </div>
          </FadeInSection>

          <div className="dashboard-metrics">
            <MetricCard label="Total Sessions" value={String(totalSessions)} change={isLive ? "from SpacetimeDB" : "+8 this week"} trend="up" delay={0.05} />
            <MetricCard label="Active Patients" value={String(activePatients)} change="No change" trend="neutral" delay={0.1} />
            <MetricCard label="Avg Duration" value="14m" change="+2m from last month" trend="up" delay={0.15} />
            <MetricCard label="AI Summaries" value={String(isLive ? meetingSummaries.length : 142)} change={isLive ? "from SpacetimeDB" : "+23 this week"} trend="up" delay={0.2} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <DashboardCard
              label="Recent Sessions"
              delay={0.25}
              action={
                <Link to="/sessions" style={{ fontSize: "0.75rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                  View All →
                </Link>
              }
            >
              <div className="session-list">
                {recentSessions.map((s, i) => {
                  const patientName = PATIENTS[s.personId] ?? s.personId;
                  return (
                    <Link key={s.sessionId} to="/sessions" style={{ textDecoration: "none", color: "inherit" }}>
                      <motion.div
                        className="session-item"
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ transitionDelay: `${i * 0.06}s` }}
                      >
                        <div className="session-item-avatar">{patientName[0]}</div>
                        <div className="session-item-info">
                          <div className="session-item-name">{patientName}</div>
                          <div className="session-item-meta">
                            {formatDate(s.meetingDate)}
                            {isLive && <span style={{ color: "var(--success)", marginLeft: "0.5rem", fontSize: "0.6875rem", fontWeight: 700 }}>● LIVE</span>}
                          </div>
                          <div className="session-item-summary">{s.summary}</div>
                        </div>
                        <span className="session-item-badge complete">complete</span>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </DashboardCard>

            <DashboardCard label="Quick Actions" delay={0.3}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <Link to="/demo" className="btn btn-primary" style={{ justifyContent: "center" }}>
                  Start New Session
                </Link>
                <Link to="/sessions" className="btn btn-secondary" style={{ justifyContent: "center" }}>
                  Session History
                </Link>
                <Link to="/insights" className="btn btn-secondary" style={{ justifyContent: "center" }}>
                  View Insights
                </Link>
                <Link to="/patient/person_101" className="btn btn-secondary" style={{ justifyContent: "center" }}>
                  Patient Profiles
                </Link>
              </div>
            </DashboardCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
