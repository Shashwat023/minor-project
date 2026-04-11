export type FixtureCallStatus = "idle" | "waiting" | "connecting" | "connected" | "disconnected" | "error";

export interface FixtureClientProfile {
  id: string;
  name: string;
  relationship: string;
}

export interface FixtureSummaryResponse {
  summary: string | null;
  chunk_number: number | null;
  timestamp: number | null;
}

export interface FixtureAudioChunkResponse {
  status: string;
  chunk_id: string;
}

export interface FixtureSessionEndResponse {
  final_summary: string;
  summary_sent_to_dev2: boolean;
}

export interface FixtureSnapshotResponse {
  status: string;
  filename: string;
  path: string;
}

export interface FixtureCallTimelineStep {
  afterMs: number;
  status: FixtureCallStatus;
  label: string;
}

export interface FixtureSessionPlan {
  sessionId: string;
  client: FixtureClientProfile;
  callTimeline: FixtureCallTimelineStep[];
  summaries: FixtureSummaryResponse[];
  audioChunks: FixtureAudioChunkResponse[];
  snapshotResponses: FixtureSnapshotResponse[];
  finalSummary: FixtureSessionEndResponse;
}

const DEFAULT_CLIENTS: FixtureClientProfile[] = [
  { id: "person_101", name: "Margaret Johnson", relationship: "Patient" },
  { id: "person_102", name: "Robert Smith", relationship: "Patient" },
  { id: "person_103", name: "Eleanor Davis", relationship: "Patient" },
];

const DEFAULT_CALL_TIMELINE: FixtureCallTimelineStep[] = [
  { afterMs: 0, status: "idle", label: "Session created" },
  { afterMs: 900, status: "waiting", label: "Waiting for peer" },
  { afterMs: 2_000, status: "connecting", label: "Negotiating media" },
  { afterMs: 3_500, status: "connected", label: "Live call active" },
  { afterMs: 42_000, status: "disconnected", label: "Call ended" },
];

const DEFAULT_SUMMARIES: FixtureSummaryResponse[] = [
  {
    summary: "Patient greeted the caregiver, discussed sleep quality, and reported mild morning confusion.",
    chunk_number: 1,
    timestamp: 1_744_000_000,
  },
  {
    summary: "Caregiver confirmed medication adherence, hydration, and meal intake; patient was calm and responsive.",
    chunk_number: 2,
    timestamp: 1_744_000_305,
  },
  {
    summary: "Session closed with a short reminder to monitor mood, appetite, and routine changes over the next day.",
    chunk_number: 3,
    timestamp: 1_744_000_610,
  },
];

const DEFAULT_AUDIO_CHUNKS: FixtureAudioChunkResponse[] = [
  { status: "saved", chunk_id: "chunk_1" },
  { status: "saved", chunk_id: "chunk_2" },
  { status: "saved", chunk_id: "chunk_3" },
];

const DEFAULT_SNAPSHOT_RESPONSES: FixtureSnapshotResponse[] = [
  { status: "saved", filename: "person_101_snap0001_1744000000.png", path: "/client_snaps/person_101_snap0001_1744000000.png" },
  { status: "saved", filename: "person_101_snap0002_1744000305.png", path: "/client_snaps/person_101_snap0002_1744000305.png" },
  { status: "saved", filename: "person_101_snap0003_1744000610.png", path: "/client_snaps/person_101_snap0003_1744000610.png" },
];

const DEFAULT_FINAL_SUMMARY: FixtureSessionEndResponse = {
  final_summary: "The session remained stable. The patient was oriented, cooperative, and tolerated the visit without distress.",
  summary_sent_to_dev2: false,
};

export function getDefaultFixtureClients(): FixtureClientProfile[] {
  return DEFAULT_CLIENTS.map((client) => ({ ...client }));
}

export function createFixtureSessionPlan(clientId: string, sessionSeed: string): FixtureSessionPlan {
  const client = DEFAULT_CLIENTS.find((entry) => entry.id === clientId) ?? DEFAULT_CLIENTS[0];
  const sessionId = `${client.id}_session_${sessionSeed}`;

  return {
    sessionId,
    client: { ...client },
    callTimeline: DEFAULT_CALL_TIMELINE.map((step) => ({ ...step })),
    summaries: DEFAULT_SUMMARIES.map((summary) => ({ ...summary })),
    audioChunks: DEFAULT_AUDIO_CHUNKS.map((chunk) => ({ ...chunk })),
    snapshotResponses: DEFAULT_SNAPSHOT_RESPONSES.map((snapshot) => ({ ...snapshot })),
    finalSummary: { ...DEFAULT_FINAL_SUMMARY },
  };
}

export function createDeterministicSessionSeed(clientId: string, timestamp = 1_744_000_000): string {
  return `${timestamp}_${clientId.replace(/[^a-z0-9]+/gi, "_")}`;
}

export function getFixtureSummaryByChunk(
  plan: FixtureSessionPlan,
  chunkNumber: number
): FixtureSummaryResponse | null {
  return plan.summaries.find((summary) => summary.chunk_number === chunkNumber) ?? null;
}

export function getFixtureAudioChunkByNumber(
  plan: FixtureSessionPlan,
  chunkNumber: number
): FixtureAudioChunkResponse | null {
  return plan.audioChunks[chunkNumber - 1] ?? null;
}

export function getFixtureSnapshotByNumber(
  plan: FixtureSessionPlan,
  snapshotNumber: number
): FixtureSnapshotResponse | null {
  return plan.snapshotResponses[snapshotNumber - 1] ?? null;
}

export function getFixtureCallStatusAt(plan: FixtureSessionPlan, elapsedMs: number): FixtureCallStatus {
  let currentStatus: FixtureCallStatus = "idle";

  for (const step of plan.callTimeline) {
    if (elapsedMs >= step.afterMs) {
      currentStatus = step.status;
    }
  }

  return currentStatus;
}

export function cloneFixtureSessionPlan(plan: FixtureSessionPlan): FixtureSessionPlan {
  return {
    sessionId: plan.sessionId,
    client: { ...plan.client },
    callTimeline: plan.callTimeline.map((step) => ({ ...step })),
    summaries: plan.summaries.map((summary) => ({ ...summary })),
    audioChunks: plan.audioChunks.map((chunk) => ({ ...chunk })),
    snapshotResponses: plan.snapshotResponses.map((snapshot) => ({ ...snapshot })),
    finalSummary: { ...plan.finalSummary },
  };
}