// frontend/src/components/ui/DashboardCard.tsx
// Wrapper card for dashboard sections with label + optional action.

import React from "react";
import { motion } from "framer-motion";

interface DashboardCardProps {
  children: React.ReactNode;
  label: string;
  action?: React.ReactNode;
  className?: string;
  delay?: number;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  children,
  label,
  action,
  className = "",
  delay = 0,
}) => (
  <motion.div
    className={`card ${className}`}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
  >
    <div className="card-header">
      <div className="card-label">
        <span className="dot dot-accent" />
        {label}
      </div>
      {action}
    </div>
    {children}
  </motion.div>
);

export default DashboardCard;
