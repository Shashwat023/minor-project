// frontend/src/pages/PatientProfilePage.tsx
// Patient profile with stats, session history, and care notes.

import React from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import SectionWrapper from "../components/ui/SectionWrapper";
import DashboardCard from "../components/ui/DashboardCard";
import MetricCard from "../components/ui/MetricCard";
import FadeInSection from "../components/ui/FadeInSection";

const PATIENTS: Record<string, {
  name: string;
  age: number;
  diagnosis: string;
  since: string;
  sessions: number;
  lastVisit: string;
  notes: string[];
  careTeam: string[];
}> = {
  person_101: {
    name: "Margaret Johnson",
    age: 78,
    diagnosis: "Early-stage Alzheimer's",
    since: "Jan 2026",
    sessions: 23,
    lastVisit: "Apr 3, 2026",
    notes: [
      "Shows mild morning confusion that typically resolves by midday",
      "Responds well to structured daily routines",
      "Medication adherence has been consistent",
      "Family photos trigger positive reminiscence episodes",
    ],
    careTeam: ["Dr. Sarah Chen", "Nurse Maria Santos", "James (son)"],
  },
  person_102: {
    name: "Robert Smith",
    age: 82,
    diagnosis: "Moderate cognitive impairment",
    since: "Feb 2026",
    sessions: 15,
    lastVisit: "Apr 2, 2026",
    notes: [
      "Improved recall observed over past 3 sessions",
      "Appetite changes noted — monitoring nutritional intake",
      "Engages well during conversational exercises",
      "Sleep patterns have stabilized with adjusted routine",
    ],
    careTeam: ["Dr. Priya Patel", "Nurse Tom Chen"],
  },
  person_103: {
    name: "Eleanor Davis",
    age: 75,
    diagnosis: "Vascular dementia",
    since: "Mar 2026",
    sessions: 9,
    lastVisit: "Apr 1, 2026",
    notes: [
      "Evening agitation episodes reported — sundowning pattern",
      "Responds positively to daily walking routine",
      "Structured activities improve daytime engagement",
      "Environmental adjustments recommended for evening calm",
    ],
    careTeam: ["Dr. Sarah Chen", "Nurse Maria Santos", "Lisa (daughter)"],
  },
};

const PatientProfilePage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const patient = PATIENTS[patientId || "person_101"];

  if (!patient) {
    return (
      <div className="page-wrapper">
        <div className="page-content" style={{ paddingTop: "64px" }}>
          <SectionWrapper>
            <div style={{ textAlign: "center", padding: "4rem 0" }}>
              <h2 style={{ color: "var(--text-1)", marginBottom: "1rem" }}>Patient not found</h2>
              <Link to="/dashboard" className="btn btn-secondary">Back to Dashboard</Link>
            </div>
          </SectionWrapper>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ paddingTop: "64px" }}>
        <SectionWrapper>
          <FadeInSection>
            <div className="profile-header">
              <div className="profile-avatar">{patient.name[0]}</div>
              <div className="profile-info">
                <h2>{patient.name}</h2>
                <p>{patient.diagnosis} · Age {patient.age} · Since {patient.since}</p>
              </div>
              <div className="profile-stats">
                <div className="profile-stat">
                  <div className="profile-stat-value">{patient.sessions}</div>
                  <div className="profile-stat-label">Sessions</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-value">{patient.lastVisit.split(",")[0]}</div>
                  <div className="profile-stat-label">Last Visit</div>
                </div>
              </div>
            </div>
          </FadeInSection>

          <div className="dashboard-metrics">
            <MetricCard label="Total Sessions" value={patient.sessions} delay={0.05} />
            <MetricCard label="This Month" value="4" change="+1 from last" trend="up" delay={0.1} />
            <MetricCard label="Avg Duration" value="14m" delay={0.15} />
            <MetricCard label="AI Notes" value={patient.sessions * 3} delay={0.2} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.25rem" }}>
            <DashboardCard label="Clinical Notes" delay={0.25}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {patient.notes.map((note, i) => (
                  <motion.div
                    key={i}
                    className="past-item"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                  >
                    <p className="past-item-text">{note}</p>
                  </motion.div>
                ))}
              </div>
            </DashboardCard>

            <DashboardCard label="Care Team" delay={0.3}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {patient.careTeam.map((member, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.75rem", background: "var(--glass-1)",
                    borderRadius: "var(--radius-sm)", border: "1px solid var(--glass-border)",
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "var(--accent-dim)", border: "1px solid rgba(123,143,255,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.875rem", fontWeight: 700, color: "var(--accent-light)",
                    }}>
                      {member[0]}
                    </div>
                    <span style={{ fontSize: "0.875rem", color: "var(--text-2)" }}>{member}</span>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </div>

          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <Link to="/demo" className="btn btn-primary">Start New Session</Link>
          </div>
        </SectionWrapper>
      </div>
    </div>
  );
};

export default PatientProfilePage;
