// frontend/src/components/VideoFeed.tsx
// Full WebRTC video panel — remote feed, local PiP, waiting room, call controls.
//
// CRITICAL FIX — always keep <video> elements in the DOM, never conditionally
// render them. If the element unmounts between state updates, the ref becomes
// null exactly when srcObject needs to be set, and the stream never plays.
// We show/hide with CSS (visibility + opacity) instead.

import React, { useRef, useEffect, useState, useCallback } from "react";
import { CallStatus } from "../hooks/useWebRTC";

interface VideoFeedProps {
  localStream:     MediaStream | null;
  remoteStream:    MediaStream | null;
  callStatus:      CallStatus;
  isHost:          boolean;
  isMicOn:         boolean;
  isCamOn:         boolean;
  onToggleMic:     () => void;
  onToggleCam:     () => void;
  onLeave:         () => void;
  onJoin:          () => void;
  patientName:     string;
  relationship:    string;
  roomId:          string | null;
  isSessionActive: boolean;
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const MicOn    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></svg>;
const MicOff   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v4M8 23h8"/></svg>;
const CamOn    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>;
const CamOff   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34"/><polygon points="23 7 16 12 23 17 23 7"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const HangUp   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.73 19.73 0 0 1 3.07 10.7a2 2 0 0 1 1.72-2.18h.28a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L5.89 16.4"/><line x1="23" y1="1" x2="1" y2="23"/></svg>;
const VideoIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>;

// ── Overlay config ─────────────────────────────────────────────────────────────
const OVERLAY_CFG: Record<CallStatus, { icon: string; title: string; sub: string; wait: boolean } | null> = {
  idle:         { icon: "📹", title: "No active call",     sub: "Start a session then click Join Video Call",  wait: false },
  waiting:      { icon: "⏳", title: "Waiting for peer…",  sub: "Share the link below with your teammate",     wait: true  },
  connecting:   { icon: "🔗", title: "Connecting…",         sub: "Establishing peer-to-peer connection",        wait: true  },
  connected:    null,
  disconnected: { icon: "📵", title: "Peer disconnected",   sub: "The other participant has left",              wait: false },
  error:        { icon: "⚠️", title: "Connection error",    sub: "Could not reach signaling server",            wait: false },
};

// ── Component ──────────────────────────────────────────────────────────────────
const VideoFeed: React.FC<VideoFeedProps> = ({
  localStream, remoteStream, callStatus,
  isHost, isMicOn, isCamOn,
  onToggleMic, onToggleCam, onLeave, onJoin,
  patientName, relationship, roomId, isSessionActive,
}) => {
  const remoteRef = useRef<HTMLVideoElement>(null);
  const localRef  = useRef<HTMLVideoElement>(null);
  const [copied,  setCopied] = useState(false);

  // ── Wire remote stream ─────────────────────────────────────────────────────
  // Depend on BOTH remoteStream AND callStatus so that:
  //   • If remoteStream arrives before "connected" → effect re-fires when status flips
  //   • If "connected" arrives before remoteStream → effect re-fires when stream arrives
  // The video element is ALWAYS mounted (not conditional) so the ref is always valid.
  useEffect(() => {
    const el = remoteRef.current;
    if (!el) return;
    if (remoteStream) {
      if (el.srcObject !== remoteStream) {
        el.srcObject = remoteStream;
        el.play().catch(() => {/* autoplay policy — browser will play on user gesture */});
      }
    } else {
      el.srcObject = null;
    }
  }, [remoteStream, callStatus]);  // ← callStatus in deps is the key fix

  // ── Wire local stream ──────────────────────────────────────────────────────
  useEffect(() => {
    const el = localRef.current;
    if (!el) return;
    if (localStream) {
      if (el.srcObject !== localStream) {
        el.srcObject = localStream;
        el.play().catch(() => {});
      }
    } else {
      el.srcObject = null;
    }
  }, [localStream]);

  const isConnected = callStatus === "connected";
  const isInCall    = callStatus !== "idle";
  const overlayCfg  = OVERLAY_CFG[callStatus];

  const shareLink = roomId
    ? `${window.location.origin}/?room=${encodeURIComponent(roomId)}`
    : "";

  const handleCopy = useCallback(() => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [shareLink]);

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>

      {/* ── Video panel ────────────────────────────────────────────────── */}
      <div className="video-panel">

        {/* ── Remote video — ALWAYS in DOM, shown/hidden via CSS ─────── */}
        <video
          ref={remoteRef}
          id="video-remote"
          autoPlay
          playsInline
          className="video-remote"
          style={{
            // Show only when connected AND stream available
            opacity: isConnected && remoteStream ? 1 : 0,
            pointerEvents: isConnected && remoteStream ? "auto" : "none",
          }}
        />

        {/* ── Status overlay — shown when NOT connected ──────────────── */}
        {overlayCfg && (
          <div className="video-status-overlay">
            <div className="video-status-icon">{overlayCfg.icon}</div>
            <div>
              <p className="video-status-title">{overlayCfg.title}</p>
              <p className="video-status-sub">{overlayCfg.sub}</p>
            </div>
            {overlayCfg.wait && (
              <div className="waiting-dots">
                <span className="waiting-dot" />
                <span className="waiting-dot" />
                <span className="waiting-dot" />
              </div>
            )}
          </div>
        )}

        {/* ── Local PiP — ALWAYS in DOM ─────────────────────────────── */}
        <div
          className="video-local-pip"
          style={{
            opacity: localStream ? 1 : 0,
            pointerEvents: localStream ? "auto" : "none",
          }}
        >
          <video
            ref={localRef}
            id="video-feed"
            autoPlay
            muted
            playsInline
          />
        </div>

        {/* ── Call info bar — only when connected ───────────────────── */}
        {isConnected && (
          <div className="video-info-bar">
            <div>
              <div className="video-patient-name">{patientName}</div>
              <div className="video-patient-rel">{relationship}</div>
            </div>
            <div className="call-badge connected">
              <span className="dot dot-active" />
              Live
            </div>
          </div>
        )}
      </div>

      {/* ── Controls area ──────────────────────────────────────────────── */}
      <div style={{ padding: "1rem 1.25rem" }}>

        {/* Share link — host only, once in a call */}
        {isHost && roomId && isInCall && (
          <div style={{ marginBottom: "1rem" }}>
            <p style={{
              fontSize: "0.6875rem", color: "var(--text-4)", marginBottom: "0.5rem",
              textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700,
            }}>
              Share link — teammate opens this, call starts automatically
            </p>
            <div className="room-link-box">
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.8125rem" }}>
                {shareLink}
              </span>
              <button
                className={`room-link-copy ${copied ? "copied" : ""}`}
                onClick={handleCopy}
              >
                {copied ? "✓ Copied!" : "Copy link"}
              </button>
            </div>
          </div>
        )}

        {/* Mic / Cam / Hang-up */}
        {isInCall ? (
          <div className="call-controls">
            <button className={`control-btn ${!isMicOn ? "active" : ""}`} onClick={onToggleMic} title={isMicOn ? "Mute" : "Unmute"}>
              {isMicOn ? <MicOn /> : <MicOff />}
            </button>
            <button className={`control-btn ${!isCamOn ? "active" : ""}`} onClick={onToggleCam} title={isCamOn ? "Camera off" : "Camera on"}>
              {isCamOn ? <CamOn /> : <CamOff />}
            </button>
            <button className="control-btn danger" onClick={onLeave} title="Leave call" style={{ marginLeft: "auto" }}>
              <HangUp />
            </button>
          </div>
        ) : (
          isSessionActive && (
            <div className="call-controls" style={{ justifyContent: "center" }}>
              <button className="control-btn start-call" onClick={onJoin}>
                <VideoIcon />
                {callStatus === "disconnected" ? "Rejoin Call" : "Join Video Call"}
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default VideoFeed;
