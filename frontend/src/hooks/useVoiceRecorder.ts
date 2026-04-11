// frontend/src/hooks/useVoiceRecorder.ts
// Records 15s audio chunks and sends each to the backend.
// Uses a send queue so chunks never race each other over the tunnel.

import { useCallback, useRef, useState } from "react";
import { sendAudioChunk } from "../lib/api";

interface UseVoiceRecorderResult {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  isRecording: boolean;
  currentChunk: number;
  error: string | null;
}

const CHUNK_DURATION_MS = 20_000;

// Sequential send queue — ensures chunk N+1 waits for chunk N to finish
// so we never hammer the tunnel with concurrent large uploads.
class ChunkQueue {
  private queue: Array<() => Promise<void>> = [];
  private running = false;

  push(task: () => Promise<void>) {
    this.queue.push(task);
    if (!this.running) this.drain();
  }

  private async drain() {
    this.running = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      try { await task(); } catch { /* errors logged inside sendAudioChunk */ }
    }
    this.running = false;
  }
}

export function useVoiceRecorder(sessionId: string | null): UseVoiceRecorderResult {
  const [isRecording,  setIsRecording]  = useState(false);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [error,        setError]        = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef        = useRef<MediaStream | null>(null);
  const chunkCounterRef  = useRef(0);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const queueRef         = useRef(new ChunkQueue());

  const startChunkRecorder = useCallback((stream: MediaStream) => {
    if (!sessionId) return;

    chunkCounterRef.current += 1;
    const chunkNum = chunkCounterRef.current;
    setCurrentChunk(chunkNum);

    const chunks: Blob[] = [];
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    recorder.onstop = () => {
      // Preserve the actual mimeType from MediaRecorder, don't force webm
      const actualMimeType = mimeType || "audio/webm";
      const blob = new Blob(chunks, { type: actualMimeType });
      console.log(`[VoiceRecorder] chunk ${chunkNum} ready (${(blob.size / 1024).toFixed(1)} KB, type: ${actualMimeType}) → queued`);
      // Push into sequential queue — prevents concurrent tunnel uploads
      queueRef.current.push(async () => {
        console.log(`[VoiceRecorder] Sending chunk ${chunkNum} to backend...`);
        const result = await sendAudioChunk(sessionId, blob, chunkNum);
        console.log(`[VoiceRecorder] Chunk ${chunkNum} sent, result:`, result);
      });
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
  }, [sessionId]);

  const startRecording = useCallback(async () => {
    if (!sessionId) { setError("No session ID"); return; }
    setError(null);
    chunkCounterRef.current = 0;
    
    // ✓ FIX#6: Gracefully stop old recording before starting new session
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const oldRec = mediaRecorderRef.current;
    if (oldRec && oldRec.state === "recording") oldRec.stop();
    
    // Small delay to ensure old queue drains before starting new one
    await new Promise(r => setTimeout(r, 100));
    
    queueRef.current = new ChunkQueue(); // fresh queue per session

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsRecording(true);
      startChunkRecorder(stream);

      timerRef.current = setInterval(() => {
        const rec = mediaRecorderRef.current;
        if (rec && rec.state === "recording") rec.stop();
        startChunkRecorder(stream);
      }, CHUNK_DURATION_MS);
    } catch {
      setError("Microphone access denied");
      setIsRecording(false);
    }
  }, [sessionId, startChunkRecorder]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const rec = mediaRecorderRef.current;
    if (rec && rec.state === "recording") rec.stop();
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsRecording(false);
  }, []);

  return { startRecording, stopRecording, isRecording, currentChunk, error };
}
