// frontend/src/components/Dashboard.tsx
import React, { useState, useCallback, useEffect } from "react";
import LiveSummaryBlock   from "./LiveSummaryBlock";
import VideoFeed          from "./VideoFeed";
import { useWebRTC }        from "../hooks/useWebRTC";
import { getDefaultFixtureClients } from "../fixtures/sessionFixtures";

const CLIENTS = getDefaultFixtureClients();
const DUMMY_SUMMARY = {
  summary: "Dummy summary placeholder. Redis wiring will feed this panel later.",
  chunkNumber: 1,
  timestamp: 1744000000,
  isPolling: false,
};

// ── Icons ──────────────────────────────────────────────────────────────────────
const IconBrain = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
);
const IconPlay  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const IconStop  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>;
const Dashboard: React.FC = () => {
  const [selectedClientId, setSelectedClientId] = useState(CLIENTS[0].id);
  const [errorToast,       setErrorToast]       = useState<string | null>(null);
  const [roomId,           setRoomId]           = useState<string | null>(null);
  const [roomActive,       setRoomActive]       = useState(false);

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const {
    callStatus, localStream, remoteStream,
    isHost, joinRoom, leaveCall,
    toggleMic, toggleCam,
    isMicOn, isCamOn, error: webrtcError,
  } = useWebRTC();

  const clientConnected = callStatus === "connected";

  // ── WebRTC error toast ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!webrtcError) return;
    setErrorToast(webrtcError);
    const t = setTimeout(() => setErrorToast(null), 6000);
    return () => clearTimeout(t);
  }, [webrtcError]);

  const selectedClient = CLIENTS.find((c) => c.id === selectedClientId) ?? CLIENTS[0];

  // ── Room lifecycle ─────────────────────────────────────────────────────────
  const handleStartSession = useCallback(async () => {
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const id = `${selectedClientId}_room_${uniqueSuffix}`;
    setRoomId(id);
    setRoomActive(true);
  }, [selectedClientId]);

  // ── Join video call ────────────────────────────────────────────────────────
  const handleJoinCall = useCallback(async () => {
    if (!roomId) return;
    await joinRoom(roomId);
  }, [roomId, joinRoom]);

  const handleLeaveRoom = useCallback(() => {
    leaveCall();
    setRoomActive(false);
    setRoomId(null);
  }, [leaveCall]);

  const waitingForClient = roomActive && callStatus !== "connected" && callStatus !== "idle";

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
            disabled={roomActive}
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
          {!roomActive ? (
            <button className="btn btn-primary" onClick={handleStartSession}>
              <IconPlay /> Create Room
            </button>
          ) : (
            <button className="btn btn-danger" onClick={handleLeaveRoom}>
              <IconStop /> Leave Room
            </button>
          )}

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
              Waiting for client to join
            </span>
          )}

          {clientConnected && (
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
              Client connected — videochat live
            </span>
          )}

          {roomId && (
            <span className="session-chip" title={roomId} style={{ marginLeft: "auto" }}>
              {roomId}
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
              roomId={roomId}
              isSessionActive={roomActive}
            />
          </div>

          <div className="bento-side">
            <LiveSummaryBlock
              summary={DUMMY_SUMMARY.summary}
              chunkNumber={DUMMY_SUMMARY.chunkNumber}
              timestamp={DUMMY_SUMMARY.timestamp}
              isPolling={DUMMY_SUMMARY.isPolling}
            />
          </div>
        </div>
      </main>

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
