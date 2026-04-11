// frontend/src/components/ui/GradientBorderCard.tsx
// Card with animated conic-gradient border rotation.

import React from "react";
import { motion } from "framer-motion";

interface GradientBorderCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const GradientBorderCard: React.FC<GradientBorderCardProps> = ({
  children,
  className = "",
  delay = 0,
}) => (
  <motion.div
    className={`gradient-border-card ${className}`}
    initial={{ opacity: 0, scale: 0.96 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
  >
    {children}
  </motion.div>
);

export default GradientBorderCard;
