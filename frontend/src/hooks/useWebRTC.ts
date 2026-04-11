// frontend/src/hooks/useWebRTC.ts
// WebRTC peer connection hook.
// Signaling uses socket.io, proxied through Vite at /socket.io → :4000.
// Works on localhost and via any tunnel (Cloudflare, ngrok, etc.) because
// socket.io connects to window.location.origin — same host as the page.

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

// ── ICE servers ────────────────────────────────────────────────────────────────
// STUN  — discovers public IP (works ~80% of cases)
// TURN  — media relay for symmetric NAT (cross-ISP, mobile data, VPN, etc.)
const ICE_SERVERS: RTCIceServer[] = [
  // Working STUN servers (verified from your test)
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  
  // Nextcloud STUN/TURN server (this worked in your tests)
  { urls: "stun:stun.nextcloud.com:443" },
];

export type CallStatus =
  | "idle"
  | "waiting"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface UseWebRTCResult {
  callStatus:   CallStatus;
  localStream:  MediaStream | null;
  remoteStream: MediaStream | null;
  isHost:       boolean;
  joinRoom:     (roomId: string) => Promise<void>;
  leaveCall:    () => void;
  toggleMic:    () => void;
  toggleCam:    () => void;
  isMicOn:      boolean;
  isCamOn:      boolean;
  error:        string | null;
}

export function useWebRTC(): UseWebRTCResult {
  const [callStatus,   setCallStatus]   = useState<CallStatus>("idle");
  const [localStream,  setLocalStream]  = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isHost,       setIsHost]       = useState(false);
  const [isMicOn,      setIsMicOn]      = useState(true);
  const [isCamOn,      setIsCamOn]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  const socketRef      = useRef<Socket | null>(null);
  const pcRef          = useRef<RTCPeerConnection | null>(null);
  const roomIdRef      = useRef<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    socketRef.current?.disconnect();
    socketRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus("idle");
    setIsHost(false);
    roomIdRef.current = null;
  }, []);

  // ── Create RTCPeerConnection ───────────────────────────────────────────────
  const createPC = useCallback((stream: MediaStream, roomId: string): RTCPeerConnection => {
    // Simple, reliable configuration with only working servers
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    console.log("[WebRTC] Created PC with", ICE_SERVERS.length, "working ICE servers");

    // Add local tracks so the remote peer gets our audio/video
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log("[WebRTC] ICE candidate:", e.candidate.type, e.candidate.protocol, e.candidate.address);
        if (socketRef.current) {
          socketRef.current.emit("ice-candidate", { roomId, candidate: e.candidate });
        }
      } else {
        console.log("[WebRTC] ICE gathering complete - no more candidates");
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log("[WebRTC] ICE gathering:", pc.iceGatheringState);
    };

    pc.ontrack = (e) => {
      if (e.streams[0]) setRemoteStream(e.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] pc state:", pc.connectionState);
      if (pc.connectionState === "connected")    setCallStatus("connected");
      if (pc.connectionState === "failed")       setCallStatus("error");
      if (pc.connectionState === "disconnected") setCallStatus("disconnected");
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[WebRTC] ICE state:", pc.iceConnectionState);
      if (pc.iceConnectionState === "checking") setCallStatus("connecting");
      if (pc.iceConnectionState === "connected") setCallStatus("connected");
      if (pc.iceConnectionState === "completed") setCallStatus("connected");
      if (pc.iceConnectionState === "failed") {
        console.warn("[WebRTC] ICE failed - this may work with peer-to-peer connections");
        console.warn("[WebRTC] Try connecting from a different network or location");
        setCallStatus("error");
        setError("Direct connection failed - may need different network");
      }
      if (pc.iceConnectionState === "disconnected") {
        console.warn("[WebRTC] ICE disconnected - peer may have left");
        setCallStatus("disconnected");
      }
    };

    return pc;
  }, []);

  // ── Join Room ──────────────────────────────────────────────────────────────
  const joinRoom = useCallback(async (roomId: string) => {
    setError(null);
    roomIdRef.current = roomId;

    // 1. Get camera + mic
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
    } catch {
      setError("Camera/mic access denied — please allow permissions.");
      setCallStatus("error");
      return;
    }

    // 2. Connect to signaling server via socket.io.
    //    Uses window.location.origin so it works on ANY host:
    //      localhost:5173               → Vite proxies /socket.io → :4000
    //      https://xxx.trycloudflare.com → Cloudflare proxies to Vite → :4000
    const socket = io(window.location.origin, {
      path: "/socket.io",
      // Prefer WebSocket, fall back to polling if the tunnel blocks WS upgrades
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    const peerId = `peer_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    // 3. Signaling handlers ────────────────────────────────────────────────────

    socket.on("room-joined", ({ isHost: host }: { isHost: boolean }) => {
      setIsHost(host);
      setCallStatus("waiting");
      console.log(`[WebRTC] room=${roomId}  role=${host ? "HOST" : "GUEST"}`);
    });

    socket.on("room-full", () => {
      setError("Room is full — only 2 participants per call.");
      setCallStatus("error");
      stream.getTracks().forEach((t) => t.stop());
      socket.disconnect();
    });

    // HOST: guest arrived → create and send offer
    socket.on("peer-joined", async () => {
      console.log("[WebRTC] peer joined → creating offer");
      setCallStatus("connecting");
      const pc = createPC(stream, roomId);
      pcRef.current = pc;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { roomId, offer });
    });

    // GUEST: received offer → create and send answer
    socket.on("offer", async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
      console.log("[WebRTC] received offer → creating answer");
      setCallStatus("connecting");
      const pc = createPC(stream, roomId);
      pcRef.current = pc;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { roomId, answer });
    });

    // HOST: received answer → complete negotiation
    socket.on("answer", async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      console.log("[WebRTC] received answer");
      await pcRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
    });

    // Both peers: exchange ICE candidates
    socket.on("ice-candidate", async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (!pcRef.current) return;
      try {
        console.log("[WebRTC] Received ICE candidate:", candidate.candidate?.split(" ")[0]);
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn("[WebRTC] ICE candidate add failed:", e);
        // Don't treat this as fatal - some candidates may fail but connection can still work
      }
    });

    socket.on("peer-left", () => {
      console.log("[WebRTC] peer left");
      setCallStatus("disconnected");
    });

    socket.on("connect_error", (err) => {
      console.error("[WebRTC] signaling error:", err.message);
      setError(`Signaling server unreachable: ${err.message}`);
      setCallStatus("error");
    });

    // 4. Join the room
    socket.emit("join-room", { roomId, peerId });
  }, [createPC]);

  const leaveCall  = useCallback(() => cleanup(), [cleanup]);
  const toggleMic  = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsMicOn((p) => !p);
  }, []);
  const toggleCam  = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsCamOn((p) => !p);
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  return {
    callStatus, localStream, remoteStream,
    isHost, joinRoom, leaveCall,
    toggleMic, toggleCam,
    isMicOn, isCamOn, error,
  };
}
