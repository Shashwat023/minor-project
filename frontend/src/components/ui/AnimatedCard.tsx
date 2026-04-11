// frontend/src/components/ui/AnimatedCard.tsx
// Glass card with hover lift, glow, and optional whileInView entrance.

import React from "react";
import { motion } from "framer-motion";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hoverable?: boolean;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = "",
  delay = 0,
  hoverable = true,
}) => (
  <motion.div
    className={`feature-card ${className}`}
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
    whileHover={hoverable ? { y: -4, boxShadow: "0 12px 40px rgba(45,27,14,0.12)" } : undefined}
  >
    {children}
  </motion.div>
);

export default AnimatedCard;
