// frontend/src/components/Dashboard.tsx
// Full caregiver dashboard.
//
// STDB INTEGRATION:
//   - startMeeting reducer called when session begins
//   - updateCue reducer called whenever a new live summary arrives
//   - endMeeting + saveMeetingSummary reducers called on session end
//   - All reducers are no-ops when STDB is not yet connected (graceful degradation)
//
// MIDDLEWARE: audio recording + snapshots only START once the client
// (remote peer) has joined the call (callStatus === "connected").

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import VoiceRecorder from "./VoiceRecorder";
import LiveSummaryBlock from "./LiveSummaryBlock";
import VideoFeed from "./VideoFeed";
import SnapshotCapture from "./SnapshotCapture";
import FaceDisplay from "./FaceDisplay";
import { useLiveRedis } from "../hooks/useLiveRedis";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import { useWebRTC } from "../hooks/useWebRTC";
import { endSession, SessionEndResponse } from "../lib/api";
import { useSpacetime } from "./SpacetimeProvider";
import { useSpacetimeTables } from "../hooks/useSpacetimeTables";
import { useLiveDetection } from "../hooks/useLiveDetection";

const CLIENTS = [
  { id: "person_101", name: "Margaret Johnson", relationship: "Patient" },
  { id: "person_102", name: "Robert Smith", relationship: "Patient" },
  { id: "person_103", name: "Eleanor Davis", relationship: "Patient" },
];

// ── Icons ──────────────────────────────────────────────────────────────────────
const IconBrain = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
  </svg>
);
const IconPlay = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>;
const IconStop = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>;
const IconClose = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/** Call a SpacetimeDB reducer safely — logs on failure, never throws. */
function callReducer(fn: () => void, label: string) {
  try {
    fn();
    console.log(`✅ STDB reducer: ${label}`);
  } catch (err) {
    console.error(`🔴 STDB reducer failed (${label}):`, err);
  }
}

const Dashboard: React.FC = () => {
  const [selectedClientId, setSelectedClientId] = useState(CLIENTS[0].id);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [finalSummary, setFinalSummary] = useState<SessionEndResponse | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { conn: stdbConn, isConnected: stdbConnected } = useSpacetime();
  const { knownPersons } = useSpacetimeTables();

  const { startRecording, stopRecording, isRecording, currentChunk, error: recorderError } =
    useVoiceRecorder(sessionId);

  const { summary, chunkNumber, timestamp, isPolling } =
    useLiveRedis(sessionId, isSessionActive);

  const {
    callStatus, localStream, remoteStream,
    isHost, joinRoom, leaveCall,
    toggleMic, toggleCam,
    isMicOn, isCamOn, error: webrtcError,
  } = useWebRTC();

  // Live detection UI overlay is now handled internally by VideoFeed -> FaceDisplay

  // ── Client gate ────────────────────────────────────────────────────────────
  const clientConnected = callStatus === "connected";
  const recordingStartedRef = useRef(false);
  const lastCueChunkRef = useRef<number | null>(null);

  // When the client connects → start recording
  useEffect(() => {
    if (isSessionActive && sessionId && clientConnected && !isRecording && !recordingStartedRef.current) {
      recordingStartedRef.current = true;
      startRecording();
    }
  }, [isSessionActive, sessionId, clientConnected, isRecording, startRecording]);

  // Reset recording gate on session end or call drop
  useEffect(() => {
    if (!isSessionActive || callStatus === "idle" || callStatus === "disconnected") {
      recordingStartedRef.current = false;
    }
  }, [isSessionActive, callStatus]);

  // ── STDB: push each new chunk summary as a cue ─────────────────────────────
  // Fires whenever useLiveRedis delivers a NEW chunk number.
  useEffect(() => {
    if (!stdbConn || !stdbConnected) return;
    if (!sessionId || !summary || chunkNumber === null) return;
    if (chunkNumber === lastCueChunkRef.current) return; // already sent this chunk

    lastCueChunkRef.current = chunkNumber;

    callReducer(
      () => stdbConn.reducers.updateCue({
        personId: selectedClientId,
        sessionId,
        newCue: summary,
      }),
      `updateCue chunk#${chunkNumber}`
    );
  }, [summary, chunkNumber, sessionId, selectedClientId, stdbConn, stdbConnected]);

  // ── WebRTC error toast ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!webrtcError) return;
    setErrorToast(webrtcError);
    const t = setTimeout(() => setErrorToast(null), 6000);
    return () => clearTimeout(t);
  }, [webrtcError]);

  const selectedClient = CLIENTS.find((c) => c.id === selectedClientId) ?? CLIENTS[0];

  // ── Start session ──────────────────────────────────────────────────────────
  const handleStartSession = useCallback(async () => {
    // Generate a unique session ID to prevent Redis cache leakage
    const id = `session_${Date.now()}`;

    setSessionId(id);
    setIsSessionActive(true);
    setFinalSummary(null);
    recordingStartedRef.current = false;
    lastCueChunkRef.current = null;

    // STDB: log meeting start
    if (stdbConn && stdbConnected) {
      callReducer(
        () => stdbConn.reducers.startMeeting({ sessionId: id, personId: selectedClientId }),
        "startMeeting"
      );
    }
  }, [selectedClientId, stdbConn, stdbConnected]);

  // ── Join video call ────────────────────────────────────────────────────────
  const handleJoinCall = useCallback(async () => {
    if (!sessionId) return;
    await joinRoom(sessionId);
  }, [sessionId, joinRoom]);

  // ── End session ────────────────────────────────────────────────────────────
  const handleEndSession = useCallback(async () => {
    stopRecording();
    leaveCall();
    setIsSessionActive(false);
    recordingStartedRef.current = false;

    if (!sessionId) return;

    // STDB: close the meeting log
    if (stdbConn && stdbConnected) {
      callReducer(
        () => stdbConn.reducers.endMeeting({ sessionId }),
        "endMeeting"
      );
    }

    // LLM: compile final summary
    const result = await endSession(sessionId);
    if (result) {
      setFinalSummary(result);

      // STDB: persist the compiled summary permanently
      if (stdbConn && stdbConnected && result.final_summary) {
        const meetingDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        callReducer(
          () => stdbConn.reducers.saveMeetingSummary({
            sessionId,
            personId: selectedClientId,
            summary: result.final_summary,
            meetingDate,
          }),
          "saveMeetingSummary"
        );
      }
    }
  }, [sessionId, selectedClientId, stopRecording, leaveCall, stdbConn, stdbConnected]);

  const handleDismissFinal = useCallback(() => {
    setFinalSummary(null);
    setSessionId(null);
  }, []);

  const waitingForClient = isSessionActive && callStatus !== "connected" && callStatus !== "idle";

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <nav className="navbar">
        <Link to="/" className="nav-brand">
          <div className="nav-logo"><IconBrain /></div>
          <div>
            <div className="nav-wordmark">MemoryCare</div>
            <div className="nav-subtitle">AI-Assisted Dementia Care</div>
          </div>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          {["Home:/", "Dashboard:/dashboard", "Sessions:/sessions", "Insights:/insights"].map((item) => {
            const [label, path] = item.split(":");
            return (
              <Link key={path} to={path} style={{
                padding: "0.5rem 0.75rem", fontSize: "0.875rem", fontWeight: 500,
                color: "var(--text-3)", textDecoration: "none", borderRadius: "var(--radius-sm)",
              }}>{label}</Link>
            );
          })}
        </div>

        <div className="navbar-right">
          {/* STDB connection indicator */}
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "0.375rem",
            fontSize: "0.6875rem", fontWeight: 600,
            color: stdbConnected ? "var(--success)" : "var(--text-4)",
          }}>
            <span className={`dot ${stdbConnected ? "dot-active" : "dot-idle"}`} style={{ width: 6, height: 6 }} />
            {stdbConnected ? "DB Live" : "DB Connecting"}
          </span>

          <span className={`call-badge ${callStatus}`}>
            {callStatus === "connected" && <><span className="dot dot-active" />Live</>}
            {callStatus === "waiting" && <><span className="dot dot-pending" />Waiting</>}
            {callStatus === "connecting" && <><span className="dot dot-pending" />Connecting</>}
            {callStatus === "idle" && "No call"}
            {callStatus === "disconnected" && <><span className="dot dot-idle" />Disconnected</>}
            {callStatus === "error" && "Error"}
          </span>

          <select
            className="select"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            disabled={isSessionActive}
          >
            {CLIENTS.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </nav>

      <main className="main-content">
        <div className="session-bar" style={{ marginBottom: "1.25rem" }}>
          {!isSessionActive ? (
            <button className="btn btn-primary" onClick={handleStartSession}>
              <IconPlay /> Start Session
            </button>
          ) : (
            <button className="btn btn-danger" onClick={handleEndSession}>
              <IconStop /> End Session
            </button>
          )}

          <VoiceRecorder isRecording={isRecording} currentChunk={currentChunk} error={recorderError} />

          {waitingForClient && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "0.45rem",
              padding: "0.3rem 0.875rem", borderRadius: "var(--radius-full)",
              background: "var(--warning-dim)", border: "1px solid rgba(251,191,36,0.2)",
              fontSize: "0.75rem", fontWeight: 600, color: "var(--warning)",
            }}>
              <span className="dot dot-pending" style={{ width: 6, height: 6 }} />
              Waiting for client — recording starts automatically on join
            </span>
          )}

          {clientConnected && isRecording && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "0.45rem",
              padding: "0.3rem 0.875rem", borderRadius: "var(--radius-full)",
              background: "var(--success-dim)", border: "1px solid rgba(74,222,128,0.2)",
              fontSize: "0.75rem", fontWeight: 600, color: "var(--success)",
            }}>
              <span className="dot dot-active" style={{ width: 6, height: 6 }} />
              Client connected — session active
            </span>
          )}

          {sessionId && (
            <span className="session-chip" title={sessionId} style={{ marginLeft: "auto" }}>
              {sessionId}
            </span>
          )}
        </div>

        <div className="bento-grid">
          <div className="bento-main">
            <VideoFeed
              localStream={localStream}
              remoteStream={remoteStream}
              callStatus={callStatus}
              isHost={isHost}
              isMicOn={isMicOn}
              isCamOn={isCamOn}
              onToggleMic={toggleMic}
              onToggleCam={toggleCam}
              onLeave={leaveCall}
              onJoin={handleJoinCall}
              patientName={selectedClient.name}
              relationship={selectedClient.relationship}
              roomId={sessionId}
              isSessionActive={isSessionActive}
            />
          </div>

          <div className="bento-side">
            {clientConnected && (
              <FaceDisplay sessionId={sessionId} />
            )}
            <LiveSummaryBlock
              summary={summary}
              chunkNumber={chunkNumber}
              timestamp={timestamp}
              isPolling={isPolling}
            />
          </div>
        </div>
      </main>

      <SnapshotCapture
        active={isSessionActive && clientConnected}
        sessionId={sessionId}
        videoElementId="video-remote"
      />

      {finalSummary && (
        <div className="overlay" onClick={handleDismissFinal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Session Complete</div>
            <div className="modal-sub">AI-generated clinical session note · saved to SpacetimeDB</div>
            <div className="modal-body">{finalSummary.final_summary}</div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleDismissFinal}>
                <IconClose /> Close
              </button>
            </div>
          </div>
        </div>
      )}



      {errorToast && (
        <div className="toast" onClick={() => setErrorToast(null)}>
          <span className="dot dot-live" />
          {errorToast}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
