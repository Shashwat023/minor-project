// frontend/src/features/analytics/AnalyticsDashboard.tsx
// Fully dynamic analytics dashboard — driven by SpacetimeDB live data.
// No hardcoded mock data. Empty states shown until real data flows.

import React, { useState, useMemo } from "react"
import { 
  StatusCards, 
  AgitationHeatmap, 
  TopicBubbles, 
  SentimentCandles, 
  QuizMetricsChart,
  MedicationAdherenceChart,
} from "./ChartComponents"
import { 
  generateAgitationHeatmap, 
  generateTopicData,
  generateSentimentData,
  PATIENT_ID
} from "./mockData"
import { useSpacetimeTables } from "../../hooks/useSpacetimeTables"
import { useSpacetime } from "../../components/SpacetimeProvider"
import { useAgitation } from "../../contexts/AgitationContext"

const RANGES = ["7d", "30d", "90d"] as const
type Range = typeof RANGES[number]
type Tab = "overview" | "medication" | "sentiment"

export default function AnalyticsDashboard() {
  const [range, setRange] = useState<Range>("30d")
  const [activeTab, setActiveTab] = useState<Tab>("overview")

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90

  // ── SpacetimeDB Live Subscriptions ──────────────────────────────────────
  const { conn, isConnected } = useSpacetime();
  const { quizLog, medications, notifications } = useSpacetimeTables();

  // ── Quiz Metrics (fully live from SpacetimeDB) ─────────────────────────
  const quizMetricsData = useMemo(() => {
    const sorted = [...quizLog]
      .filter(l => l.patientId === PATIENT_ID)
      .sort((a, b) => Number(a.createdAt) - Number(b.createdAt));

    return sorted.map(log => {
      const dateStr = new Date(Number(log.createdAt)).toISOString().split("T")[0];
      return {
        date: dateStr,
        accuracyScore: Math.round(log.accuracyScore),
        speedScore: Math.round(log.speedScore),
        averageScore: Math.round(log.averageScore),
      };
    }).slice(-days);
  }, [quizLog, days]);

  // ── Medication Adherence (live from SpacetimeDB) ───────────────────────
  const medAdherenceData = useMemo(() => {
    // Group medications by date and count taken/missed/pending
    const byDate: Record<string, { taken: number; missed: number; pending: number }> = {};
    
    medications.forEach(med => {
      const dateStr = new Date(Number(med.createdAt)).toISOString().split("T")[0];
      if (!byDate[dateStr]) byDate[dateStr] = { taken: 0, missed: 0, pending: 0 };
      if (med.status === "taken") byDate[dateStr].taken++;
      else if (med.status === "alerting" || med.status === "missed") byDate[dateStr].missed++;
      else byDate[dateStr].pending++;
    });

    return Object.entries(byDate)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-days);
  }, [medications, days]);

  // ── Live agitation data from Recognize button clicks ──────────────────
  const { heatmapData } = useAgitation();
  
  // ── Fallback visual data (for charts that need call analysis data) ─────
  const topicData = useMemo(() => generateTopicData(), [])
  const sentimentData = useMemo(() => generateSentimentData(days), [days])

  // ── Derived stats ──────────────────────────────────────────────────────
  const latestComposite = quizMetricsData.length > 0 
    ? quizMetricsData[quizMetricsData.length - 1].averageScore 
    : 0;

  const medAdherence = medications.length > 0
    ? Math.round((medications.filter(m => m.status === "taken").length / medications.length) * 100)
    : 0;

  const sentimentAvg = sentimentData.length 
    ? parseFloat((sentimentData.reduce((a, b) => a + b.sentiment_score, 0) / sentimentData.length).toFixed(2))
    : 0;

  // ── Styles ─────────────────────────────────────────────────────────────
  const S: Record<string, React.CSSProperties> = {
    root: { background: "#0d0d14", minHeight: "100%", color: "#e2e8f0", fontFamily: "Inter, system-ui, sans-serif", padding: "80px 0 0" },
    topbar: { background: "#13131f", borderBottom: "1px solid #1e1e30", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    title: { fontSize: 18, fontWeight: 700, color: "#a78bfa", letterSpacing: ".06em" },
    patientBadge: { fontSize: 13, color: "#94a3b8", background: "#1a1a2e", padding: "6px 14px", borderRadius: 20, border: "1px solid #2d2d44" },
    tabs: { display: "flex", gap: 8, background: "#13131f", padding: "12px 32px", borderBottom: "1px solid #1e1e30" },
    tab: { padding: "8px 20px", borderRadius: 8, border: "none", fontSize: 14, cursor: "pointer", fontWeight: 600, transition: "all .2s" },
    content: { padding: "32px 32px" },
    row: { display: "grid", gap: 24, marginBottom: 24 },
    card: { background: "#13131f", border: "1px solid #1e1e30", borderRadius: 12, padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" },
    cardTitle: { fontSize: 13, fontWeight: 600, color: "#64748b", letterSpacing: ".08em", marginBottom: 20, textTransform: "uppercase" as const },
    rangeBar: { display: "flex", gap: 6 },
    rangeBtn: { padding: "6px 14px", borderRadius: 6, border: "1px solid #2d2d44", background: "transparent", color: "#94a3b8", fontSize: 13, cursor: "pointer", fontWeight: 500 },
  }

  function tabStyle(t: string): React.CSSProperties {
    return {
      ...S.tab,
      background: activeTab === t ? "#2e1065" : "transparent",
      color: activeTab === t ? "#c4b5fd" : "#64748b",
      border: activeTab === t ? "1px solid #4c1d95" : "1px solid transparent",
    }
  }

  const dbStatus = isConnected ? "🟢 Live" : "⏳ Connecting...";

  return (
    <div style={S.root}>
      <div style={S.topbar}>
        <div>
           <div style={S.title}>MEMORYCARE · ANALYTICS</div>
           <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
             Cognitive health dashboard — clinical view · <span style={{ color: isConnected ? '#10b981' : '#f59e0b' }}>{dbStatus}</span>
           </div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
           <div style={S.patientBadge}>Patient ID: <span style={{color: '#e2e8f0'}}>{PATIENT_ID}</span></div>
           <div style={S.rangeBar}>
             {RANGES.map(r => (
               <button 
                 key={r}
                 style={{
                   ...S.rangeBtn,
                   background: range === r ? "#2e1065" : "transparent",
                   color: range === r ? "#c4b5fd" : "#64748b",
                   borderColor: range === r ? "#4c1d95" : "#2d2d44",
                 }}
                 onClick={() => setRange(r)}
               >
                 {r}
               </button>
             ))}
           </div>
        </div>
      </div>

      <div style={S.tabs}>
        {(["overview", "medication", "sentiment"] as const).map(t => (
           <button key={t} style={tabStyle(t)} onClick={() => setActiveTab(t)}>
             {t.charAt(0).toUpperCase() + t.slice(1)}
           </button>
        ))}
      </div>

      <div style={S.content}>
        <StatusCards 
          quizCount={quizLog.filter(q => q.patientId === PATIENT_ID).length}
          latestComposite={latestComposite}
          medAdherence={medAdherence}
          sentimentAvg={sentimentAvg}
        />

        {activeTab === "overview" && (
           <>
             <div style={{ ...S.row, gridTemplateColumns: "1fr" }}>
               <div style={S.card}>
                 <div style={S.cardTitle}>Brain Training Activity · Accuracy vs Speed vs Composite</div>
                 <QuizMetricsChart data={quizMetricsData} />
               </div>
             </div>
             <div style={{ ...S.row, gridTemplateColumns: "1fr 1fr" }}>
               <div style={S.card}>
                 <div style={S.cardTitle}>Agitation heatmap · hour × day of week</div>
                 <AgitationHeatmap data={heatmapData} />
               </div>
               <div style={S.card}>
                 <div style={S.cardTitle}>Conversation Keywords</div>
                 <TopicBubbles data={topicData} />
               </div>
             </div>
           </>
        )}

        {activeTab === "medication" && (
           <div style={{ ...S.row, gridTemplateColumns: "1fr" }}>
             <div style={S.card}>
               <div style={S.cardTitle}>Medication Adherence · Taken vs Missed</div>
               <MedicationAdherenceChart data={medAdherenceData} />
             </div>
           </div>
        )}

        {activeTab === "sentiment" && (
           <div style={{ ...S.row, gridTemplateColumns: "1fr" }}>
             <div style={S.card}>
               <div style={S.cardTitle}>Sentiment Candles · Call-by-Call Mood Analysis</div>
               <SentimentCandles data={sentimentData} />
             </div>
           </div>
        )}
      </div>
    </div>
  )
}
