// frontend/src/components/GuestCall.tsx
// Minimal video call UI for the remote participant.
// Layout: header (fixed) + video (fills remaining height) + controls (fixed).
// Uses CSS height calculations instead of dvh to prevent mobile stretch.

import React, { useEffect, useRef, useState } from "react";
import { useWebRTC, CallStatus } from "../hooks/useWebRTC";

// ── Icons ──────────────────────────────────────────────────────────────────────
const Mic = ({ off }: { off?: boolean }) => off ? (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23"/>
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v4M8 23h8"/>
  </svg>
) : (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
  </svg>
);

const Cam = ({ off }: { off?: boolean }) => off ? (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34"/>
    <polygon points="23 7 16 12 23 17 23 7"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);

const PhoneOff = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.73 19.73 0 0 1 3.07 10.7a2 2 0 0 1 1.72-2.18h.28a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L5.89 16.4"/>
    <line x1="23" y1="1" x2="1" y2="23"/>
  </svg>
);

// Heights for layout calculation
const HEADER_H  = 56;   // px
const FOOTER_H  = 82;   // px

const STATUS: Record<CallStatus, { label: string; color: string; icon: string }> = {
  idle:         { label: "Joining…",          color: "var(--text-4)",  icon: "⏳" },
  waiting:      { label: "Waiting for host…",  color: "var(--warning)", icon: "⏳" },
  connecting:   { label: "Connecting…",         color: "var(--info)",    icon: "🔗" },
  connected:    { label: "Live",                color: "var(--success)", icon: ""   },
  disconnected: { label: "Call ended",          color: "var(--text-3)",  icon: "📵" },
  error:        { label: "Connection failed",   color: "var(--danger)",  icon: "⚠️" },
};

const GuestCall: React.FC<{ roomId: string }> = ({ roomId }) => {
  const {
    callStatus, localStream, remoteStream,
    joinRoom, leaveCall, toggleMic, toggleCam,
    isMicOn, isCamOn, error,
  } = useWebRTC();

  const remoteRef = useRef<HTMLVideoElement>(null);
  const localRef  = useRef<HTMLVideoElement>(null);
  const [ended, setEnded] = useState(false);
  const joined  = useRef(false);

  useEffect(() => {
    if (joined.current) return;
    joined.current = true;
    joinRoom(roomId);
  }, [roomId, joinRoom]);

  useEffect(() => {
    const el = remoteRef.current;
    if (!el) return;
    if (remoteStream) {
      if (el.srcObject !== remoteStream) { el.srcObject = remoteStream; el.play().catch(() => {}); }
    } else { el.srcObject = null; }
  }, [remoteStream, callStatus]);

  useEffect(() => {
    const el = localRef.current;
    if (!el) return;
    if (localStream) {
      if (el.srcObject !== localStream) { el.srcObject = localStream; el.play().catch(() => {}); }
    } else { el.srcObject = null; }
  }, [localStream]);

  useEffect(() => { if (callStatus === "disconnected") setEnded(true); }, [callStatus]);

  const handleLeave = () => { leaveCall(); setEnded(true); };
  const isConnected = callStatus === "connected";
  const s = STATUS[callStatus];

  // ── Ended ──────────────────────────────────────────────────────────────────
  if (ended) {
    return (
      <div style={{
        position: "fixed", inset: 0,
        background: "var(--bg-base)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: "1rem", padding: "2rem", textAlign: "center",
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "var(--glass-2)", border: "1px solid var(--glass-border)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.25rem",
        }}>📵</div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-1)" }}>Call ended</h2>
        <p style={{ color: "var(--text-4)", fontSize: "0.9375rem", maxWidth: 300, lineHeight: 1.6 }}>
          The session has finished. You can safely close this tab.
        </p>
      </div>
    );
  }

  // ── Main call layout ───────────────────────────────────────────────────────
  // position:fixed + inset:0 ensures it fills the exact browser viewport
  // without any overflow or scroll — works on mobile Safari too.
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "var(--bg-base)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>

      {/* ── Header (fixed height) ─────────────────────────────────────── */}
      <div style={{
        height: HEADER_H,
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 1.25rem",
        borderBottom: "1px solid var(--glass-border)",
        background: "rgba(254,250,224,0.95)",
        backdropFilter: "blur(16px)",
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
            boxShadow: "0 0 10px var(--accent-glow)",
          }}>🧠</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-1)", lineHeight: 1.2 }}>
              MemoryCare
            </div>
            <div style={{ fontSize: "0.625rem", color: "var(--text-4)", lineHeight: 1 }}>
              Secure Video Session
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.4rem",
          padding: "0.25rem 0.75rem", borderRadius: 9999,
          background: isConnected ? "var(--success-dim)" : "var(--glass-2)",
          border: `1px solid ${isConnected ? "rgba(90,138,60,0.3)" : "var(--glass-border)"}`,
          fontSize: "0.6875rem", fontWeight: 700,
          letterSpacing: "0.06em", textTransform: "uppercase",
          color: s.color,
        }}>
          {isConnected && (
            <span style={{
              width: 6, height: 6, borderRadius: "50%", display: "inline-block",
              background: "var(--success)", boxShadow: "0 0 5px var(--success)",
              animation: "pulse 2s ease-in-out infinite",
            }} />
          )}
          {s.label}
        </div>
      </div>

      {/* ── Video area (fills all remaining space between header and footer) */}
      <div style={{
        flex: 1,
        position: "relative",
        background: "#000",
        overflow: "hidden",
        // Explicit height fallback for browsers that don't respect flex properly
        minHeight: 0,
      }}>

        {/* Remote video — always in DOM, opacity-toggled */}
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",   // "contain" not "cover" — no stretching on any aspect ratio
            display: "block",
            background: "#000",
            opacity: isConnected && remoteStream ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
        />

        {/* Waiting overlay */}
        {!isConnected && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 2,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "1.25rem",
            background: "radial-gradient(ellipse at 50% 55%, rgba(188,108,37,0.07) 0%, transparent 70%), var(--bg-base)",
            padding: "1.5rem",
          }}>
            <div style={{
              width: 76, height: 76, borderRadius: "50%",
              background: "var(--glass-2)", border: "1px solid var(--glass-border)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem",
            }}>
              {callStatus === "error" ? "⚠️" : s.icon}
            </div>
            <div style={{ textAlign: "center", maxWidth: 300 }}>
              <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-1)", marginBottom: "0.375rem" }}>
                {callStatus === "error" ? "Could not connect" : "Waiting for the caregiver…"}
              </p>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-4)", lineHeight: 1.6 }}>
                {error ?? (callStatus === "error"
                  ? "Please check your link and try again."
                  : "Your camera is ready. Call will start automatically when the host joins.")}
              </p>
            </div>
            {callStatus !== "error" && (
              <div style={{ display: "flex", gap: 6 }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: "var(--accent)", display: "inline-block",
                    animation: `waitBounce 1.4s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Local PiP — always in DOM */}
        <div style={{
          position: "absolute", bottom: "0.875rem", right: "0.875rem",
          width: "clamp(100px, 22%, 160px)",  // responsive PiP size
          aspectRatio: "16/9",
          borderRadius: 10, overflow: "hidden",
          border: "2px solid rgba(255,255,255,0.18)",
          boxShadow: "0 4px 24px rgba(45,27,14,0.25)",
          background: "#1a1308", zIndex: 10,
          opacity: localStream ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}>
          <video
            ref={localRef}
            autoPlay muted playsInline
            style={{
              width: "100%", height: "100%",
              objectFit: "cover",
              transform: "scaleX(-1)",
              display: "block",
              opacity: isCamOn ? 1 : 0,
            }}
          />
          {!isCamOn && (
            <div style={{
              position: "absolute", inset: 0,
              background: "var(--bg-secondary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-4)", fontSize: 18,
            }}>📷</div>
          )}
        </div>
      </div>

      {/* ── Controls (fixed height) ───────────────────────────────────── */}
      <div style={{
        height: FOOTER_H,
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: "0.875rem",
        padding: "0 1.5rem",
        background: "rgba(254,250,224,0.97)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid var(--glass-border)",
        zIndex: 10,
      }}>
        {/* Mic */}
        <button
          onClick={toggleMic}
          title={isMicOn ? "Mute" : "Unmute"}
          style={{
            width: 50, height: 50, borderRadius: "50%", flexShrink: 0,
            border: isMicOn ? "1px solid var(--glass-border)" : "1px solid var(--accent)",
            background: isMicOn ? "var(--glass-2)" : "var(--accent-dim)",
            color: isMicOn ? "var(--text-1)" : "var(--accent-light)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s ease",
          }}
        >
          <Mic off={!isMicOn} />
        </button>

        {/* Cam */}
        <button
          onClick={toggleCam}
          title={isCamOn ? "Camera off" : "Camera on"}
          style={{
            width: 50, height: 50, borderRadius: "50%", flexShrink: 0,
            border: isCamOn ? "1px solid var(--glass-border)" : "1px solid var(--accent)",
            background: isCamOn ? "var(--glass-2)" : "var(--accent-dim)",
            color: isCamOn ? "var(--text-1)" : "var(--accent-light)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s ease",
          }}
        >
          <Cam off={!isCamOn} />
        </button>

        {/* End call */}
        <button
          onClick={handleLeave}
          title="Leave call"
          style={{
            width: 50, height: 50, borderRadius: "50%", flexShrink: 0,
            border: "1px solid rgba(244,63,94,0.4)",
            background: "var(--danger-dim)",
            color: "var(--danger)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--danger)";
            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--danger-dim)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--danger)";
          }}
        >
          <PhoneOff />
        </button>
      </div>
    </div>
  );
};

export default GuestCall;
