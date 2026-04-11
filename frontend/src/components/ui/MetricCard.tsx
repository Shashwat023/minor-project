// frontend/src/components/ui/MetricCard.tsx
// Single metric display with label, value, and optional trend indicator.

import React from "react";
import { motion } from "framer-motion";

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  delay?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  trend = "neutral",
  delay = 0,
}) => (
  <motion.div
    className="metric-card"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
  >
    <div className="metric-card-label">{label}</div>
    <div className="metric-card-value">{value}</div>
    {change && (
      <div className={`metric-card-change ${trend}`}>
        {trend === "up" && "↑ "}
        {trend === "down" && "↓ "}
        {change}
      </div>
    )}
  </motion.div>
);

export default MetricCard;
