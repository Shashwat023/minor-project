import React, { useState } from "react";
import { useSpacetime } from "./SpacetimeProvider";
import { useLiveDetection } from "../hooks/useLiveDetection";
import { useSpacetimeTables } from "../hooks/useSpacetimeTables";

interface FaceDisplayProps {
  sessionId: string | null;
}

const FaceDisplay: React.FC<FaceDisplayProps> = ({ sessionId }) => {
  const { conn } = useSpacetime();
  const liveDetection = useLiveDetection(sessionId);
  const { knownPersons } = useSpacetimeTables();

  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("");

  if (!sessionId || !liveDetection || !liveDetection.personId) {
    return null;
  }

  const known = knownPersons.find(p => p.personId === liveDetection.personId);
  const isUnknown = !known || !known.name;

  if (isUnknown) {
    return (
      <div className="card" style={{
        background: "rgba(37, 99, 235, 0.9)",
        color: "white",
        display: "flex",
        flexDirection: "column",
      }}>
        <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.25rem" }}>🟦 New Face Detected!</div>
        <div style={{ fontSize: "0.85rem", marginBottom: "1rem", opacity: 0.9 }}>Please identify the person on camera</div>
        
        <input 
          style={{ 
            width: "100%", padding: "0.6rem", marginBottom: "0.5rem", 
            borderRadius: "0.25rem", border: "none", outline: "none",
            background: "rgba(255,255,255,0.9)", color: "black", fontWeight: 500
          }}
          placeholder="Name" 
          value={newName} 
          onChange={e => setNewName(e.target.value)} 
          autoFocus
        />
        <input 
          style={{ 
            width: "100%", padding: "0.6rem", marginBottom: "1rem", 
            borderRadius: "0.25rem", border: "none", outline: "none",
            background: "rgba(255,255,255,0.9)", color: "black", fontWeight: 500
          }}
          placeholder="Relationship (e.g., Son, Doctor)" 
          value={newRelation} 
          onChange={e => setNewRelation(e.target.value)}
        />
        
        <button 
          style={{ 
            width: "100%", padding: "0.6rem", background: "white", color: "#2563eb", 
            border: "none", borderRadius: "0.25rem", fontWeight: "bold", cursor: "pointer",
            transition: "all 0.2s"
          }}
          onClick={() => {
            if (conn) {
              try {
                conn.reducers.updatePersonDetails({ 
                  personId: liveDetection.personId, 
                  name: newName, 
                  relation: newRelation 
                });
                console.log("✅ Sent updatePersonDetails for", newName);
              } catch (e) {
                console.error("Failed to update person details", e);
              }
            }
          }}
        >
          Save Identity
        </button>
      </div>
    );
  }

  // Known face: Display ID card
  return (
    <div className="card">
      <div className="card-header" style={{ marginBottom: "0.5rem" }}>
        <div className="card-label">
          <span className="dot" style={{ background: "var(--success)", boxShadow: "0 0 6px var(--success)" }} />
          Detected Identity
        </div>
        {liveDetection.confidence > 0 && (
          <span className="summary-chunk-badge" style={{ backgroundColor: "var(--success-dim)", color: "var(--success)", borderColor: "rgba(34, 197, 94, 0.2)"}}>
            {Math.round(liveDetection.confidence * 100)}% Match
          </span>
        )}
      </div>
      
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text-1)", lineHeight: 1.2 }}>{known.name}</div>
        {known.relation && (
          <div style={{ fontSize: "0.875rem", color: "var(--text-4)", marginTop: "4px" }}>{known.relation}</div>
        )}
      </div>
    </div>
  );
};

export default FaceDisplay;
