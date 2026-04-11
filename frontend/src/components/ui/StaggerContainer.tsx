// frontend/src/components/ui/StaggerContainer.tsx
// Animates children in sequence with configurable stagger delay.

import React from "react";
import { motion } from "framer-motion";

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}

const containerVariants = (stagger: number, delay: number) => ({
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  },
});

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  },
};

const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className,
  stagger = 0.1,
  delay = 0,
}) => (
  <motion.div
    className={className}
    variants={containerVariants(stagger, delay)}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-40px" }}
  >
    {children}
  </motion.div>
);

export default StaggerContainer;
