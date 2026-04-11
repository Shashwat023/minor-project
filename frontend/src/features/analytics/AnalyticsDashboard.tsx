// frontend/src/features/analytics/AnalyticsDashboard.tsx

import React, { useState, useMemo } from "react"
import { 
  StatusCards, 
  CognitiveScoreChart, 
  AgitationHeatmap, 
  TopicRadar, 
  SentimentTimeline, 
  BehaviourEventLog, 
  AdherenceChart,
  QuizMetricsChart
} from "./ChartComponents"
import { 
  generateCognitiveScores, 
  generateSentimentData, 
  generateBehaviourEvents, 
  generateAdherenceData, 
  generateAgitationHeatmap, 
  generateTopicData,
  generateQuizActivity,
  PATIENT_ID
} from "./mockData"

const RANGES = ["7d", "30d", "90d"] as const
type Range = typeof RANGES[number]

export default function AnalyticsDashboard() {
  const [range, setRange] = useState<Range>("30d")
  const [activeTab, setActiveTab] = useState<"overview" | "behaviour" | "sentiment" | "medication">("overview")

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90

  // Regenerate mock data when range changes
  const cognitiveData = useMemo(() => generateCognitiveScores(days), [days])
  const sentimentData = useMemo(() => generateSentimentData(days), [days])
  const behaviourData = useMemo(() => generateBehaviourEvents(days), [days])
  const adherenceData = useMemo(() => generateAdherenceData(Math.ceil(days / 7)), [days])
  const heatmapData = useMemo(() => generateAgitationHeatmap(), [])
  const topicData = useMemo(() => generateTopicData(), [])
  const quizMetricsData = useMemo(() => generateQuizActivity(days), [days])

  // Derive top-level summary stats
  const latestScore = cognitiveData[cognitiveData.length - 1]?.score ?? 0
  const scoreChange = latestScore - (cognitiveData[0]?.score ?? latestScore)
  const criticalEvents = behaviourData.filter(e => e.severity === "critical").length
  const avgAdherence = adherenceData.length ? Math.round(
    adherenceData.reduce((a, b) => a + b.adherence_rate, 0) / adherenceData.length
  ) : 0
  const avgSentiment = sentimentData.length ? parseFloat(
    (sentimentData.reduce((a, b) => a + b.sentiment_score, 0) / sentimentData.length).toFixed(2)
  ) : 0

  const S: Record<string, React.CSSProperties> = {
    root: { background: "#0d0d14", minHeight: "100%", color: "#e2e8f0", fontFamily: "Inter, system-ui, sans-serif", padding: "0" },
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

  return (
    <div style={S.root}>
      <div style={S.topbar}>
        <div>
           <div style={S.title}>MEMORYCARE · ANALYTICS</div>
           <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>Cognitive health dashboard — clinical view</div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
           <div style={S.patientBadge}>Patient ID: <span style={{color: '#e2e8f0'}}>{PATIENT_ID}</span></div>
           <div style={S.rangeBar}>
             {RANGES.map(r => (
                <button key={r} onClick={() => setRange(r)} style={{
                  ...S.rangeBtn,
                  background: range === r ? "#2e1065" : "transparent",
                  color: range === r ? "#c4b5fd" : "#64748b",
                  borderColor: range === r ? "#4c1d95" : "#2d2d44",
                }}>
                  {r}
                </button>
             ))}
           </div>
        </div>
      </div>
      <div style={S.tabs}>
        {(["overview", "behaviour", "sentiment", "medication"] as const).map(t => (
           <button key={t} style={tabStyle(t)} onClick={() => setActiveTab(t)}>
             {t.charAt(0).toUpperCase() + t.slice(1)}
           </button>
        ))}
      </div>
      <div style={S.content}>
        <StatusCards 
          latestScore={latestScore} 
          scoreChange={scoreChange} 
          criticalEvents={criticalEvents} 
          avgAdherence={avgAdherence} 
          avgSentiment={avgSentiment} 
          days={days} 
        />

        {activeTab === "overview" && (
           <>
             <div style={{ ...S.row, gridTemplateColumns: "1fr" }}>
               <div style={S.card}>
                 <div style={S.cardTitle}>Cognitive health score · {days}-day trend</div>
                 <CognitiveScoreChart data={cognitiveData} />
               </div>
               
               <div style={S.card}>
                 <div style={S.cardTitle}>Brain Training Activity · Accuracy vs Speed</div>
                 <QuizMetricsChart data={quizMetricsData} />
               </div>
             </div>
             <div style={{ ...S.row, gridTemplateColumns: "1fr 1fr" }}>
               <div style={S.card}>
                 <div style={S.cardTitle}>Agitation heatmap · hour × day of week</div>
                 <AgitationHeatmap data={heatmapData} />
               </div>
               <div style={S.card}>
                 <div style={S.cardTitle}>Conversation topic map</div>
                 <TopicRadar data={topicData} />
               </div>
             </div>
           </>
        )}

        {activeTab === "behaviour" && (
           <div style={{ ...S.row, gridTemplateColumns: "1fr" }}>
             <div style={S.card}>
               <div style={S.cardTitle}>Behaviour events · {days} days</div>
               <BehaviourEventLog data={behaviourData} />
             </div>
           </div>
        )}

        {activeTab === "sentiment" && (
           <div style={{ ...S.row, gridTemplateColumns: "1fr" }}>
             <div style={S.card}>
               <div style={S.cardTitle}>Sentiment timeline · call-by-call</div>
               <SentimentTimeline data={sentimentData} />
             </div>
           </div>
        )}

        {activeTab === "medication" && (
           <div style={{ ...S.row, gridTemplateColumns: "1fr" }}>
             <div style={S.card}>
               <div style={S.cardTitle}>Medication adherence · weekly stacked</div>
               <AdherenceChart data={adherenceData} />
             </div>
           </div>
        )}
      </div>
    </div>
  )
}
