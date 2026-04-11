// frontend/src/pages/SessionHistoryPage.tsx
// Session history — reads live data from SpacetimeDB MeetingSummary table.
// Falls back to fixture data while STDB is syncing or empty.

import React, { useState } from "react";
import { motion } from "framer-motion";
import SectionWrapper from "../components/ui/SectionWrapper";
import FadeInSection from "../components/ui/FadeInSection";
import { useSpacetimeTables } from "../hooks/useSpacetimeTables";
import type { MeetingSummary } from "../spacetime-sdk/types";

const PATIENTS: Record<string, string> = {
  person_101: "Margaret Johnson",
  person_102: "Robert Smith",
  person_103: "Eleanor Davis",
};

// Fixture fallback while STDB syncs
const FIXTURE_SESSIONS = [
  {
    sessionId: "person_101_session_fixture_1", personId: "person_101",
    meetingDate: "2026-04-03", summary: "Patient greeted caregiver, discussed sleep quality and mild morning confusion. Mood stable. Medication adherence confirmed.",
  },
  {
    sessionId: "person_102_session_fixture_2", personId: "person_102",
    meetingDate: "2026-04-02", summary: "Reviewed medication schedule, discussed appetite changes. Improved recall during conversation. Hydration monitoring recommended.",
  },
  {
    sessionId: "person_103_session_fixture_3", personId: "person_103",
    meetingDate: "2026-04-01", summary: "Increased evening agitation reported. Environmental adjustments and routine modifications discussed. Follow-up recommended.",
  },
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

const SessionHistoryPage: React.FC = () => {
  const { meetingSummaries, synced } = useSpacetimeTables();
  const [filter, setFilter] = useState("all");

  // Use live STDB data if synced and non-empty, otherwise fixture data
  const liveSessions: MeetingSummary[] = synced && meetingSummaries.length > 0
    ? [...meetingSummaries].sort((a, b) => {
        // Sort by createdAt descending (newest first)
        return Number(b.createdAt - a.createdAt);
      })
    : (FIXTURE_SESSIONS as unknown as MeetingSummary[]);

  const filtered = filter === "all"
    ? liveSessions
    : liveSessions.filter((s) => s.personId === filter);

  const isLive = synced && meetingSummaries.length > 0;

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ paddingTop: "64px" }}>
        <SectionWrapper>
          <FadeInSection>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h1 style={{
                  fontSize: "1.75rem", fontWeight: 800, color: "var(--text-1)",
                  letterSpacing: "-0.02em", marginBottom: "0.25rem",
                }}>
                  Session History
                </h1>
                <p style={{ fontSize: "0.9375rem", color: "var(--text-4)" }}>
                  {filtered.length} sessions
                  {isLive
                    ? " · live from SpacetimeDB"
                    : " · sample data (no sessions recorded yet)"}
                </p>
              </div>
              <select
                className="select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Patients</option>
                {Object.entries(PATIENTS).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
          </FadeInSection>

          {!synced && (
            <div style={{
              padding: "1rem 1.25rem",
              background: "var(--info-dim)",
              border: "1px solid rgba(56,189,248,0.2)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.875rem",
              color: "var(--info)",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}>
              <span className="dot dot-accent" />
              Connecting to SpacetimeDB — showing sample data…
            </div>
          )}

          <div className="session-list">
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--text-4)" }}>
                No sessions found for this patient yet.
              </div>
            ) : (
              filtered.map((s, i) => {
                const patientName = PATIENTS[s.personId] ?? s.personId;
                return (
                  <motion.div
                    key={s.sessionId}
                    className="session-item"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    whileHover={{ x: 4 }}
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
                );
              })
            )}
          </div>
        </SectionWrapper>
      </div>
    </div>
  );
};

export default SessionHistoryPage;
