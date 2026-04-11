import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area
} from 'recharts';

export function StatusCards({ latestScore, scoreChange, criticalEvents, avgAdherence, avgSentiment, days }: any) {
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
      <Card title="Cognitive Score" value={latestScore} sub={`${scoreChange >= 0 ? '+' : ''}${Math.round(scoreChange)} over ${days}d`} color={latestScore > 70 ? "#10b981" : latestScore > 50 ? "#f59e0b" : "#ef4444"} />
      <Card title="Avg Sentiment" value={avgSentiment > 0 ? `+${avgSentiment}` : avgSentiment} sub={`Last ${days} days`} color={avgSentiment > 0.1 ? "#10b981" : avgSentiment > -0.1 ? "#f59e0b" : "#ef4444"} />
      <Card title="Critical Events" value={criticalEvents} sub={`In last ${days}d`} color={criticalEvents === 0 ? "#10b981" : criticalEvents < 3 ? "#f59e0b" : "#ef4444"} />
      <Card title="Med Adherence" value={`${avgAdherence}%`} sub={`Last ${days > 30 ? 30 : days} days`} color={avgAdherence > 85 ? "#10b981" : avgAdherence > 65 ? "#f59e0b" : "#ef4444"} />
    </div>
  );
}

export function CognitiveScoreChart({ data }: { data: any[] }) {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" vertical={false} />
          <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} tickMargin={10} minTickGap={30} />
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
          <RechartsTooltip 
            contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#2d2d44', color: '#e2e8f0' }}
            itemStyle={{ color: '#e2e8f0' }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
          <Line type="monotone" dataKey="score" name="Overall" stroke="#a78bfa" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="memory_score" name="Memory" stroke="#3b82f6" strokeWidth={2} dot={false} strokeOpacity={0.6} />
          <Line type="monotone" dataKey="engagement_score" name="Engagement" stroke="#10b981" strokeWidth={2} dot={false} strokeOpacity={0.6} />
          <Line type="monotone" dataKey="mood_score" name="Mood" stroke="#f43f5e" strokeWidth={2} dot={false} strokeOpacity={0.6} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AgitationHeatmap({ data }: { data: any[] }) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  // CSS Grid for pixel-perfect heatmaps instead of forcing a scatter chart
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
              {dayData.map((d, index) => {
                 let color = "#1e1e30"; // lowest
                 let hoverEffect = "";
                 if (d.value > 0.8) color = "#ef4444";
                 else if (d.value > 0.5) color = "#f59e0b";
                 else if (d.value > 0.2) color = "#10b981";
                 return (
                   <div 
                     key={d.hour} 
                     title={d.label + ` (Severity: ${d.value})`} 
                     style={{ flex: 1, height: 24, borderRadius: 4, background: color, transition: 'all 0.2s', cursor: 'crosshair' }}
                     onMouseOver={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                     onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; }}
                   ></div>
                 )
              })}
            </div>
          </div>
        )
      })}
    </div>
  );
}

export function TopicRadar({ data }: { data: any[] }) {
  return (
    <div style={{ width: '100%', height: 300 }}>
       <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#2d2d44" />
            <PolarAngleAxis dataKey="topic" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
            <Radar name="Mentions" dataKey="count" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.4} />
            <RechartsTooltip contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#2d2d44', color: '#e2e8f0' }} />
          </RadarChart>
       </ResponsiveContainer>
    </div>
  );
}

export function SentimentTimeline({ data }: { data: any[] }) {
   return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" vertical={false} />
          <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} tickMargin={10} minTickGap={30} />
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[-1, 1]} />
          <RechartsTooltip 
            cursor={{fill: '#1e1e30'}}
            contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#2d2d44', color: '#e2e8f0' }} 
          />
          <Bar dataKey="sentiment_score" radius={[4, 4, 4, 4]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.sentiment_score > 0 ? '#10b981' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
   )
}

export function BehaviourEventLog({ data }: { data: any[] }) {
  if (!data || data.length === 0) return <div style={{ color: '#64748b' }}>No events logged in this timeframe.</div>;

  return (
    <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 8 }}>
      {data.map((e, i) => (
         <div key={i} style={{ 
            padding: "16px", 
            background: "#1a1a2e", 
            borderRadius: 8, 
            marginBottom: 12,
            borderLeft: `4px solid ${e.severity === 'critical' ? '#ef4444' : e.severity === 'moderate' ? '#f59e0b' : '#3b82f6'}`
         }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
             <span style={{ fontWeight: 600, color: '#e2e8f0', textTransform: 'capitalize' }}>{e.event_type.replace(/_/g, ' ')}</span>
             <span style={{ color: '#94a3b8', fontSize: 13 }}>{e.date} at {e.hour}:00</span>
           </div>
           <div style={{ fontSize: 13, color: '#cbd5e1' }}>
             Severity: <strong style={{color: e.severity === 'critical' ? '#ef4444' : e.severity === 'moderate' ? '#f59e0b' : '#3b82f6', textTransform: 'capitalize'}}>{e.severity}</strong> • Duration: {e.duration_minutes} mins
           </div>
         </div>
      ))}
    </div>
  )
}

export function QuizMetricsChart({ data }: { data: any[] }) {
  return (
    <div style={{ width: '100%', height: 300 }}>
       <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" vertical={false} />
            <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} tickMargin={10} minTickGap={30} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
            <RechartsTooltip 
              contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#2d2d44', color: '#e2e8f0' }} 
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
            <Area type="monotone" dataKey="accuracyScore" name="Accuracy" stroke="#10b981" fillOpacity={1} fill="url(#colorAcc)" />
            <Line type="monotone" dataKey="speedScore" name="Speed" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="averageScore" name="Composite Score" stroke="#a78bfa" strokeWidth={2} strokeDasharray="5 5" dot={false} />
          </AreaChart>
       </ResponsiveContainer>
    </div>
  )
}

export function AdherenceChart({ data }: { data: any[] }) {
  return (
    <div style={{ width: '100%', height: 300 }}>
       <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" vertical={false} />
            <XAxis dataKey="week" stroke="#64748b" fontSize={12} tickLine={false} tickMargin={10} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <RechartsTooltip cursor={{fill: '#1e1e30'}} contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#2d2d44', color: '#e2e8f0' }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
            <Bar dataKey="taken" stackId="a" fill="#10b981" name="Taken" radius={[0, 0, 4, 4]} />
            <Bar dataKey="missed" stackId="a" fill="#ef4444" name="Missed" radius={[4, 4, 0, 0]} />
          </BarChart>
       </ResponsiveContainer>
    </div>
  )
}
