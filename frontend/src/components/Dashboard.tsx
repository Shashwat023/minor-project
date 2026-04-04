// frontend/src/components/Dashboard.tsx
// Full caregiver dashboard.
//
// MIDDLEWARE: audio recording + snapshots only START once the client
// (remote peer) has joined the call (callStatus === "connected").
// Before that, recording is queued and waits.

import React, { useState, useCallback, useRef, useEffect } from "react";
import VoiceRecorder      from "./VoiceRecorder";
import LiveSummaryBlock   from "./LiveSummaryBlock";
import VideoFeed          from "./VideoFeed";
import SnapshotCapture    from "./SnapshotCapture";
import { useLiveRedis }     from "../hooks/useLiveRedis";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import { useWebRTC }        from "../hooks/useWebRTC";
import { endSession, SessionEndResponse } from "../lib/api";

const CLIENTS = [
  { id: "person_101", name: "Margaret Johnson", relationship: "Patient" },
  { id: "person_102", name: "Robert Smith",     relationship: "Patient" },
  { id: "person_103", name: "Eleanor Davis",    relationship: "Patient" },
];

// ── Icons ──────────────────────────────────────────────────────────────────────
const IconBrain = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
);
const IconPlay  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const IconStop  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>;
const IconClose = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const Dashboard: React.FC = () => {
  const [selectedClientId, setSelectedClientId] = useState(CLIENTS[0].id);
  const [sessionId,        setSessionId]        = useState<string | null>(null);
  const [isSessionActive,  setIsSessionActive]  = useState(false);
  const [finalSummary,     setFinalSummary]     = useState<SessionEndResponse | null>(null);
  const [errorToast,       setErrorToast]       = useState<string | null>(null);

  // ── Hooks ──────────────────────────────────────────────────────────────────
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

  // ── MIDDLEWARE: client-joined gate ─────────────────────────────────────────
  const clientConnected = callStatus === "connected";
  
  // Debug logging
  console.log(`[Dashboard] sessionId=${sessionId}, isSessionActive=${isSessionActive}, clientConnected=${clientConnected}`);
  console.log(`[Dashboard] Live summary: chunk=${chunkNumber}, summary=${summary?.slice(0, 30)}..., isPolling=${isPolling}`);

  // Track whether we've started recording in this session
  const recordingStartedRef = useRef(false);

  // When the client connects → start recording (if session is active and not already recording)
  useEffect(() => {
    if (isSessionActive && sessionId && clientConnected && !isRecording && !recordingStartedRef.current) {
      recordingStartedRef.current = true;
      console.log("[Dashboard] Client connected — starting audio recording + snapshots");
      startRecording();
    }
  }, [isSessionActive, sessionId, clientConnected, isRecording, startRecording]);

  // Reset recording gate when session ends or call drops
  useEffect(() => {
    if (!isSessionActive || callStatus === "idle" || callStatus === "disconnected") {
      recordingStartedRef.current = false;
    }
  }, [isSessionActive, callStatus]);

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
    // ✓ FIX#9: Generate truly unique session ID using timestamp + random (prevents collisions)
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const id = `${selectedClientId}_session_${uniqueSuffix}`;
    setSessionId(id);
    setIsSessionActive(true);
    setFinalSummary(null);
    recordingStartedRef.current = false;
  }, [selectedClientId]);

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
    if (sessionId) {
      const result = await endSession(sessionId);
      if (result) setFinalSummary(result);
    }
  }, [sessionId, stopRecording, leaveCall]);

  const handleDismissFinal = useCallback(() => {
    setFinalSummary(null);
    setSessionId(null);
  }, []);

  // Waiting for client label
  const waitingForClient = isSessionActive && callStatus !== "connected" && callStatus !== "idle";

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="app">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-logo"><IconBrain /></div>
          <div>
            <div className="navbar-title">MemoryCare</div>
            <div className="navbar-subtitle">AI-Assisted Dementia Care</div>
          </div>
        </div>

        <div className="navbar-right">
          <span className={`call-badge ${callStatus}`}>
            {callStatus === "connected"    && <><span className="dot dot-active"  />Live</>}
            {callStatus === "waiting"      && <><span className="dot dot-pending" />Waiting for client</>}
            {callStatus === "connecting"   && <><span className="dot dot-pending" />Connecting</>}
            {callStatus === "idle"         && "No call"}
            {callStatus === "disconnected" && <><span className="dot dot-idle"    />Disconnected</>}
            {callStatus === "error"        && "Error"}
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

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="main-content">

        {/* Session controls bar */}
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

          <VoiceRecorder
            isRecording={isRecording}
            currentChunk={currentChunk}
            error={recorderError}
          />

          {/* Client gate status */}
          {waitingForClient && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "0.45rem",
              padding: "0.3rem 0.875rem",
              borderRadius: "var(--radius-full)",
              background: "var(--warning-dim)",
              border: "1px solid rgba(245,158,11,0.25)",
              fontSize: "0.75rem", fontWeight: 600,
              color: "var(--warning)",
            }}>
              <span className="dot dot-pending" style={{ width: 6, height: 6 }} />
              Waiting for client to join — recording will start automatically
            </span>
          )}

          {clientConnected && isRecording && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "0.45rem",
              padding: "0.3rem 0.875rem",
              borderRadius: "var(--radius-full)",
              background: "var(--success-dim)",
              border: "1px solid rgba(34,197,94,0.25)",
              fontSize: "0.75rem", fontWeight: 600,
              color: "var(--success)",
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

        {/* Bento grid */}
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
            <LiveSummaryBlock
              summary={summary}
              chunkNumber={chunkNumber}
              timestamp={timestamp}
              isPolling={isPolling}
            />
          </div>
        </div>
      </main>

      {/* Snapshot capture — gated: only runs when client is connected */}
      <SnapshotCapture
        active={isSessionActive && clientConnected}
        sessionId={sessionId}
        videoElementId="video-remote"
      />

      {/* Final summary modal */}
      {finalSummary && (
        <div className="overlay" onClick={handleDismissFinal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Session Complete</div>
            <div className="modal-sub">AI-generated clinical session note</div>
            <div className="modal-body">{finalSummary.final_summary}</div>
            {!finalSummary.summary_sent_to_dev2 && (
              <p style={{ fontSize: "0.75rem", color: "var(--warning)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="dot dot-pending" />
                Summary not yet forwarded to database (bridge pending).
              </p>
            )}
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleDismissFinal}>
                <IconClose /> Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error toast */}
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
