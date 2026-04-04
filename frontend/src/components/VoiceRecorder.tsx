// frontend/src/components/VoiceRecorder.tsx
// Recording status pill — redesigned.

import React from "react";

interface VoiceRecorderProps {
  isRecording:  boolean;
  currentChunk: number;
  error:        string | null;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  isRecording,
  currentChunk,
  error,
}) => {
  if (error) {
    return (
      <div className="rec-pill error">
        <span className="dot" style={{ background: "var(--warning)", width: 7, height: 7 }} />
        {error}
      </div>
    );
  }

  if (!isRecording) return null;

  return (
    <div className="rec-pill">
      <span className="dot dot-live" style={{ width: 7, height: 7 }} />
      Recording — chunk {currentChunk}
    </div>
  );
};

export default VoiceRecorder;
