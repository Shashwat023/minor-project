// frontend/src/components/LiveSummaryBlock.tsx
// Live summary panel — redesigned with UI/UX pro-max dark theme.

import React from "react";

interface LiveSummaryBlockProps {
  summary:     string | null;
  chunkNumber: number | null;
  timestamp:   number | null;
  isPolling:   boolean;
}

const LiveSummaryBlock: React.FC<LiveSummaryBlockProps> = ({
  summary,
  chunkNumber,
  timestamp,
  isPolling,
}) => {
  const formattedTime = timestamp
    ? new Date(timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <div className="card summary-card">
      <div className="card-header">
        <div className="card-label">
          <span className={`dot ${isPolling ? "dot-accent" : "dot-idle"}`} />
          Live Summary
        </div>
        {chunkNumber != null && (
          <span className="summary-chunk-badge">
            Chunk #{chunkNumber}
          </span>
        )}
      </div>

      <div className="summary-body">
        {summary ? (
          <p className="summary-text">{summary}</p>
        ) : (
          <p className="summary-empty">
            {isPolling
              ? "Listening… summary will appear after the first chunk is processed."
              : "Start a session to see live summaries here."}
          </p>
        )}
      </div>

      {(formattedTime || isPolling) && (
        <div className="summary-meta">
          {formattedTime && <span>{formattedTime}</span>}
          {isPolling && (
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <span className="dot dot-pending" style={{ width: 6, height: 6 }} />
              Polling
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveSummaryBlock;
