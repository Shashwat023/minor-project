// frontend/src/components/ui/SkeletonLoader.tsx
// Shimmer skeleton loading states for various UI elements.

import React from "react";

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = "1rem",
  borderRadius,
  className = "",
}) => (
  <div
    className={`skeleton ${className}`}
    style={{ width, height, borderRadius }}
    aria-hidden="true"
  />
);

export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        width={i === lines - 1 ? "60%" : "100%"}
        height="0.875rem"
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC = () => (
  <div className="card" style={{ padding: "1.5rem" }}>
    <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
      <Skeleton width="40px" height="40px" borderRadius="50%" />
      <div style={{ flex: 1 }}>
        <Skeleton width="140px" height="0.875rem" />
        <Skeleton width="200px" height="0.75rem" />
      </div>
    </div>
    <SkeletonText lines={3} />
  </div>
);

export const SkeletonVideo: React.FC = () => (
  <div className="card" style={{ padding: 0, overflow: "hidden" }}>
    <Skeleton width="100%" height="0" borderRadius="var(--radius-lg)" />
    <div style={{ aspectRatio: "16/9", width: "100%" }}>
      <Skeleton width="100%" height="100%" borderRadius="0" />
    </div>
    <div style={{ padding: "1rem 1.25rem" }}>
      <Skeleton width="200px" height="2.5rem" borderRadius="var(--radius-full)" />
    </div>
  </div>
);

export default Skeleton;
