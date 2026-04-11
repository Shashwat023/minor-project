// frontend/src/components/ui/FadeInSection.tsx
// Reveals children with a fade+slide animation when they enter the viewport.

import React from "react";
import { motion } from "framer-motion";

interface FadeInSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}

const directionMap = {
  up:    { y: 30, x: 0 },
  down:  { y: -30, x: 0 },
  left:  { y: 0, x: 30 },
  right: { y: 0, x: -30 },
};

const FadeInSection: React.FC<FadeInSectionProps> = ({
  children,
  className,
  delay = 0,
  direction = "up",
}) => {
  const offset = directionMap[direction];

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: offset.y, x: offset.x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
};

export default FadeInSection;
