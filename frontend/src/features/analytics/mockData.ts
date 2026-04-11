// frontend/src/features/analytics/mockData.ts

export const PATIENT_ID = "patient_001"

// 90 days of cognitive scores — shows gradual decline with good and bad weeks
export function generateCognitiveScores(days = 90) {
  const scores = []
  const start = new Date()
  start.setDate(start.getDate() - days)

  for (let i = 0; i < days; i++) {
    const date = new Date(start)
    date.setDate(date.getDate() + i)

    // Simulate gradual decline with weekly fluctuation
    const trend = 72 - (i * 0.15) // slow decline over 90 days
    const weekly = Math.sin(i / 7 * Math.PI) * 4 // weekly rhythm
    const noise = (Math.random() - 0.5) * 6 // daily variation
    
    const score = Math.max(20, Math.min(100, trend + weekly + noise))

    scores.push({
      date: date.toISOString().split("T")[0],
      score: Math.round(score),
      memory_score: Math.round(score * 0.9 + Math.random() * 8),
      engagement_score: Math.round(score * 1.1 - Math.random() * 6),
      mood_score: Math.round(40 + Math.random() * 50),
    })
  }
  return scores
}

// Sentiment trend over 30 days — shows emotional state during calls
export function generateSentimentData(days = 30) {
  const data = []
  const emotions = ["calm", "happy", "anxious", "confused", "sad"]
  const weights = [0.35, 0.25, 0.20, 0.15, 0.05] // realistic distribution

  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (days - i))

    // Anxiety peaks mid-afternoon (sundowning pattern)
    const hour = 14 + Math.floor(Math.random() * 6)
    const isEvening = hour >= 17
    
    const baseScore = isEvening ? -0.2 : 0.3
    const score = baseScore + (Math.random() - 0.5) * 0.4

    // Weighted random emotion pick
    const rand = Math.random()
    let cumulative = 0
    let emotion = "calm"
    for (let j = 0; j < emotions.length; j++) {
      cumulative += weights[j]
      if (rand < cumulative) {
        emotion = emotions[j];
        break
      }
    }

    data.push({
      date: date.toISOString().split("T")[0],
      sentiment_score: parseFloat(score.toFixed(2)),
      dominant_emotion: emotion,
      hour,
    })
  }
  return data
}

// Behaviour events — sundowning, wandering, agitation incidents
export function generateBehaviourEvents(days = 60) {
  const events = []
  const types = ["sundowning", "agitation", "wandering", "safe_zone_breach"]
  const severities = ["mild", "moderate", "critical"]

  for (let i = 0; i < days; i++) {
    // ~3 events per week on average
    if (Math.random() < 0.43) {
      const date = new Date()
      date.setDate(date.getDate() - (days - i))
      
      const hour = 16 + Math.floor(Math.random() * 6) // 4pm-10pm peak
      const type = types[Math.floor(Math.random() * types.length)]
      
      const sevIndex = Math.random() < 0.6 ? 0 : Math.random() < 0.7 ? 1 : 2
      events.push({
        id: `ev_${i}_${Date.now()}`,
        date: date.toISOString().split("T")[0],
        timestamp: date.setHours(hour),
        event_type: type,
        severity: severities[sevIndex],
        duration_minutes: 5 + Math.floor(Math.random() * 45),
        hour,
      })
    }
  }
  return events
}

// Medication adherence — weekly summary
export function generateAdherenceData(weeks = 12) {
  const data = []
  for (let i = 0; i < weeks; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (weeks - i) * 7)

    const scheduled = 21 // 3 per day, 7 days
    // Adherence worsens slightly over time
    const rate = Math.max(55, 95 - i * 1.8 + (Math.random() - 0.5) * 10)
    const taken = Math.round(scheduled * rate / 100)

    data.push({
      week: `W${i + 1}`,
      date: date.toISOString().split("T")[0],
      scheduled,
      taken,
      missed: scheduled - taken,
      adherence_rate: Math.round(rate),
    })
  }
  return data
}

// Heatmap: hour × day-of-week → agitation frequency
export function generateAgitationHeatmap() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const data = []
  
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      // Sundowning peaks 4pm-9pm, lower at night and morning
      const isEvening = h >= 16 && h <= 21
      const isNight = h >= 22 || h <= 5
      
      const base = isEvening ? 0.7 : isNight ? 0.15 : 0.1
      const value = base + Math.random() * 0.3
      data.push({
        day: days[d],
        hour: h,
        value: parseFloat(value.toFixed(2)),
        label: `${days[d]} ${h}:00`
      })
    }
  }
  return data
}

// Conversation topic frequency — what the patient talks about
export function generateTopicData() {
  return [
    { topic: "Family", count: 34, sentiment: 0.72 },
    { topic: "Past memories", count: 28, sentiment: 0.65 },
    { topic: "Health", count: 21, sentiment: 0.18 },
    { topic: "Food", count: 18, sentiment: 0.58 },
    { topic: "Current events", count: 9, sentiment: 0.12 },
    { topic: "Confusion", count: 7, sentiment: -0.42 },
    { topic: "Location", count: 6, sentiment: -0.18 },
  ]
}

// Cognitive Quiz Score Tracker over 30 days — tracks Accuracy vs Speed
export function generateQuizActivity(days = 30) {
  const data = []
  
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (days - i))

    // Base accuracy varies slightly but stays between 65% and 90%
    const baseAccuracy = 75 + Math.sin(i * 0.4) * 8 + (Math.random() - 0.5) * 10
    
    // Speed tends to improve slowly or fluctuate inversely with high accuracy
    const baseSpeed = 65 + (i * 0.3) + Math.cos(i * 0.3) * 5 + (Math.random() - 0.5) * 8

    const accuracy = Math.max(0, Math.min(100, Math.round(baseAccuracy)))
    const speed = Math.max(0, Math.min(100, Math.round(baseSpeed)))
    
    data.push({
      date: date.toISOString().split("T")[0],
      accuracyScore: accuracy,
      speedScore: speed,
      averageScore: Math.round((accuracy + speed) / 2)
    })
  }
  return data
}
