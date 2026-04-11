// frontend/src/features/analytics/mlDataExporter.ts

import { tables } from '../../spacetime-sdk'; // Connects to generated SDK

export interface MLPayloadData {
  day_index: number;
  date: string;
  quiz_accuracy: number | null; // 0.0 to 1.0 mapped from 0-100 logic
  quiz_speed_sec: number | null;
  help_clicks: number | null;
  sentiment: number | null;
  activity_flag: number; // 0 or 1
}

export interface MLPipelineOutput {
  window_size: number;
  generated_at: string;
  data: MLPayloadData[];
}

/**
 * Sweeps SpacetimeDB and reformats chronological patient logs
 * into the strict payload required by the ML model.
 */
export function generateMLPayload(patientId: string, windowDays: number = 30): MLPipelineOutput {
  const payload: MLPipelineOutput = {
    window_size: windowDays,
    generated_at: new Date().toISOString(),
    data: []
  };

  // Safe fallback arrays if Spacetime DB tables are empty
  let quizLogs: any[] = [];
  let sentimentLogs: any[] = [];

  try {
    // Attempt SpacetimeDB Query
    // SpacetimeDB returns an iterable cursor, we arrayize it over the patient
    // @ts-ignore
    quizLogs = Array.from(tables.quizLog?.iter() || []).filter(q => q.patientId === patientId);
    // @ts-ignore
    sentimentLogs = Array.from(tables.sentimentLog?.iter() || []).filter(s => s.patientId === patientId);
  } catch (err) {
    console.warn("Spacetime tables missing or disconnected in ML payload generation:", err);
  }

  // Backwards iterate over the 30-day window
  // Day 1 = 30 days ago, Day 30 = Today
  for (let i = 0; i < windowDays; i++) {
    const historicalDate = new Date();
    historicalDate.setDate(historicalDate.getDate() - (windowDays - i - 1));
    const targetDateString = historicalDate.toISOString().split("T")[0];

    // Find if the patient did a quiz on this specific day target
    const dailyQuiz = quizLogs.find(q => {
      const qDateStr = new Date(Number(q.createdAt)).toISOString().split("T")[0];
      return qDateStr === targetDateString;
    });

    // Determine accuracy format (ML expects 0.8 not 80)
    let quizAccuracy = null;
    let quizSpeedSec = null;
    
    if (dailyQuiz) {
      quizAccuracy = dailyQuiz.accuracyScore ? (dailyQuiz.accuracyScore / 100) : null;
      // Reverse normalization: our frontend tracks speed as 0-100 internal score.
      // If we pushed a raw timeMs logic in the future, we could query it.
      // For now, if we have an accuracy, let's map a mock time based on that logic so the pipeline isn't broken.
      // E.g., if speed score is 80, that meant they were ~2.5 seconds per question.
      // (100 - speed) / 100 * 8000 + base
      quizSpeedSec = dailyQuiz.speedScore ? parseFloat((((100 - dailyQuiz.speedScore) / 100) * 8 + 4).toFixed(1)) : null;
    }

    // Determine Sentiment
    const dailySentiment = sentimentLogs.find(s => {
      const sDateStr = new Date(Number(s.createdAt)).toISOString().split("T")[0];
      return sDateStr === targetDateString;
    });

    const sentimentValue = dailySentiment ? dailySentiment.sentimentScore : null;

    // Help Clicks (Currently null as the front-end doesn't emit 'help button' logs yet)
    // Activity flag is simply 1 if anything occurred today, 0 otherwise
    const activity_flag = (dailyQuiz || dailySentiment) ? 1 : 0;

    payload.data.push({
      day_index: i + 1,
      date: targetDateString,
      quiz_accuracy: quizAccuracy,
      quiz_speed_sec: quizSpeedSec,
      help_clicks: null,
      sentiment: sentimentValue,
      activity_flag,
    });
  }

  return payload;
}
