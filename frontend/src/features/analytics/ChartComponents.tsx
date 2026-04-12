import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell,
  AreaChart, Area
} from 'recharts';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// STATUS CARDS
// ─────────────────────────────────────────────────────────────────────────────
export function StatusCards({ quizCount, latestComposite, medAdherence, sentimentAvg }: {
  quizCount: number; latestComposite: number; medAdherence: number; sentimentAvg: number;
}) {
  const Card = ({ title, value, sub, color }: any) => (
    <div style={{
      background: "#13131f",
      border: "1px solid #1e1e30",
      borderLeft: `3px solid ${color}`,
      borderRadius: 8,
      padding: "20px 22px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#e2e8f0" }}>{value}</div>
      <div style={{ fontSize: 12, color: "#94a3b8" }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
      <Card title="Quiz Sessions" value={quizCount} sub="Total attempts logged" color={quizCount > 10 ? "#10b981" : "#f59e0b"} />
      <Card title="Last Composite" value={latestComposite > 0 ? latestComposite : "—"} sub="Latest score (0-100)" color={latestComposite > 70 ? "#10b981" : latestComposite > 50 ? "#f59e0b" : "#ef4444"} />
      <Card title="Med Adherence" value={medAdherence > 0 ? `${medAdherence}%` : "—"} sub="Taken vs missed" color={medAdherence > 85 ? "#10b981" : medAdherence > 65 ? "#f59e0b" : "#ef4444"} />
      <Card title="Sentiment Avg" value={sentimentAvg !== 0 ? (sentimentAvg > 0 ? `+${sentimentAvg}` : sentimentAvg) : "—"} sub="Call mood analysis" color={sentimentAvg > 0.1 ? "#10b981" : sentimentAvg > -0.1 ? "#f59e0b" : "#ef4444"} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AGITATION HEATMAP (kept as-is — excellent clinical visual)
// ─────────────────────────────────────────────────────────────────────────────
export function AgitationHeatmap({ data }: { data: { day: string; hour: number; count: number; label: string }[] }) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  // Find max count for normalization
  const maxCount = Math.max(...data.map(d => d.count), 1); // avoid division by zero
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', overflowX: 'auto' }}>
      <div style={{ display: 'flex', marginLeft: 40 }}>
        {Array.from({length: 24}).map((_, i) => (
           <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#64748b' }}>{i}</div>
        ))}
      </div>
      {days.map(day => {
        const dayData = data.filter(d => d.day === day).sort((a,b) => a.hour - b.hour);
        return (
          <div key={day} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 40, fontSize: 12, color: '#94a3b8' }}>{day}</div>
            <div style={{ display: 'flex', flex: 1, gap: 2 }}>
              {dayData.map((d) => {
                 // Color based on fixed count ranges
                 let color = "#1e1e30"; // empty/default
                 let textColor = "transparent";
                 if (d.count === 0) {
                   color = "#1e1e30";
                 } else if (d.count >= 1 && d.count <= 2) {
                   color = "#6ee7b7"; // light green
                   textColor = "#064e3b";
                 } else if (d.count >= 3 && d.count <= 5) {
                   color = "#059669"; // dark green
                   textColor = "#fff";
                 } else if (d.count >= 6) {
                   color = "#ef4444"; // red
                   textColor = "#fff";
                 }
                 
                 return (
                   <div 
                     key={d.hour} 
                     title={d.label + ` (Count: ${d.count})`} 
                     style={{ 
                       flex: 1, 
                       height: 24, 
                       borderRadius: 4, 
                       background: color, 
                       transition: 'all 0.2s', 
                       cursor: 'crosshair',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       fontSize: 9,
                       color: textColor,
                       fontWeight: 600
                     }}
                     onMouseOver={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                     onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; }}
                   >
                     {d.count > 0 ? d.count : ''}
                   </div>
                 )
              })}
            </div>
          </div>
        )
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC BUBBLES — animated keyword circles (replaces radar chart)
// ─────────────────────────────────────────────────────────────────────────────
export function TopicBubbles({ data }: { data: { topic: string; count: number; sentiment: number }[] }) {
  if (!data || data.length === 0) return <div style={{ color: '#64748b' }}>No conversation topics yet.</div>;
  
  const maxCount = Math.max(...data.map(d => d.count));
  
  const sentimentColor = (s: number) => {
    if (s > 0.4) return { bg: 'rgba(16,185,129,0.25)', border: '#10b981', glow: '0 0 20px rgba(16,185,129,0.4)' };
    if (s > 0) return { bg: 'rgba(59,130,246,0.2)', border: '#3b82f6', glow: '0 0 20px rgba(59,130,246,0.3)' };
    if (s > -0.2) return { bg: 'rgba(245,158,11,0.2)', border: '#f59e0b', glow: '0 0 20px rgba(245,158,11,0.3)' };
    return { bg: 'rgba(239,68,68,0.2)', border: '#ef4444', glow: '0 0 20px rgba(239,68,68,0.4)' };
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', padding: '20px 0', minHeight: 220, alignItems: 'center' }}>
      {data.map((d, i) => {
        const size = 60 + (d.count / maxCount) * 80;
        const colors = sentimentColor(d.sentiment);
        return (
          <motion.div
            key={d.topic}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 15 }}
            whileHover={{ scale: 1.15, y: -5 }}
            style={{
              width: size, height: size,
              borderRadius: '50%',
              background: colors.bg,
              border: `2px solid ${colors.border}`,
              boxShadow: colors.glow,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              transition: 'box-shadow 0.3s',
            }}
            title={`${d.topic}: ${d.count} mentions, sentiment: ${d.sentiment}`}
          >
            <div style={{ fontSize: Math.max(10, size / 8), fontWeight: 700, color: '#e2e8f0', textAlign: 'center', lineHeight: 1.2 }}>
              {d.topic}
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{d.count}</div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SENTIMENT CANDLES — neon glow bar chart (replaces plain bars)
// ─────────────────────────────────────────────────────────────────────────────
export function SentimentCandles({ data }: { data: any[] }) {
  if (!data || data.length === 0) return <div style={{ color: '#64748b' }}>No sentiment data yet.</div>;
  
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <defs>
            <filter id="glowGreen" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor="#10b981" floodOpacity="0.6" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="shadow" />
              <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glowRed" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor="#ef4444" floodOpacity="0.6" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="shadow" />
              <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
              <stop offset="100%" stopColor="#064e3b" stopOpacity={0.6}/>
            </linearGradient>
            <linearGradient id="gradRed" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9}/>
              <stop offset="100%" stopColor="#7f1d1d" stopOpacity={0.6}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" vertical={false} />
          <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} tickMargin={10} minTickGap={30} />
          <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} domain={[-1, 1]} />
          <RechartsTooltip 
            cursor={{fill: 'rgba(30,30,48,0.5)'}}
            contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#2d2d44', color: '#e2e8f0', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} 
            formatter={(value: any) => [
              `${value > 0 ? '+' : ''}${value}`,
              'Mood Score'
            ]}
            labelFormatter={(label: any) => `📅 ${label}`}
          />
          <Bar dataKey="sentiment_score" radius={[6, 6, 6, 6]}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.sentiment_score > 0 ? 'url(#gradGreen)' : 'url(#gradRed)'} 
                style={{ filter: entry.sentiment_score > 0 ? 'url(#glowGreen)' : 'url(#glowRed)' }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUIZ METRICS CHART — Accuracy vs Speed area chart (kept — already great)
// ─────────────────────────────────────────────────────────────────────────────
export function QuizMetricsChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 14 }}>
        No quiz sessions logged yet. Take a quiz to see data here!
      </div>
    );
  }
  return (
    <div style={{ width: '100%', height: 300 }}>
       <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" vertical={false} />
            <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} tickMargin={10} minTickGap={30} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
            <RechartsTooltip 
              contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#2d2d44', color: '#e2e8f0', borderRadius: 8 }} 
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
            <Area type="monotone" dataKey="accuracyScore" name="Accuracy" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorAcc)" />
            <Area type="monotone" dataKey="speedScore" name="Speed" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSpeed)" />
            <Line type="monotone" dataKey="averageScore" name="Composite" stroke="#a78bfa" strokeWidth={2} strokeDasharray="5 5" dot={false} />
          </AreaChart>
       </ResponsiveContainer>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MEDICATION ADHERENCE CHART — stacked bars driven by real data
// ─────────────────────────────────────────────────────────────────────────────
export function MedicationAdherenceChart({ data }: { data: { date: string; taken: number; missed: number; pending: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 14 }}>
        No medication data yet. Add medications to see tracking here.
      </div>
    );
  }
  return (
    <div style={{ width: '100%', height: 300 }}>
       <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" vertical={false} />
            <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} tickMargin={10} minTickGap={20} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <RechartsTooltip cursor={{fill: '#1e1e30'}} contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#2d2d44', color: '#e2e8f0', borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
            <Bar dataKey="taken" stackId="a" fill="#10b981" name="Taken" radius={[0, 0, 4, 4]} />
            <Bar dataKey="missed" stackId="a" fill="#ef4444" name="Missed" radius={[0, 0, 0, 0]} />
            <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" radius={[4, 4, 0, 0]} />
          </BarChart>
       </ResponsiveContainer>
    </div>
  )
}
