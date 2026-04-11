// frontend/src/components/ui/AnimatedHeadline.tsx
// Character-by-character stagger reveal — Pretext-style animated headline.
// Uses framer-motion variants for per-character animation.

import React from "react";
import { motion } from "framer-motion";

interface AnimatedHeadlineProps {
  text: string;
  className?: string;
  gradient?: boolean;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "span";
}

const charVariants = {
  hidden: { opacity: 0, y: 20, rotateX: -40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

const AnimatedHeadline: React.FC<AnimatedHeadlineProps> = ({
  text,
  className = "",
  gradient = false,
  delay = 0,
  as: Tag = "h1",
}) => {
  const words = text.split(" ");
  let globalIndex = 0;

  return (
    <Tag className={`${className} ${gradient ? "gradient-text" : ""}`} style={{ perspective: 400 }}>
      <motion.span
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ delayChildren: delay }}
        style={{ display: "inline" }}
      >
        {words.map((word, wi) => (
          <span key={wi} style={{ display: "inline-block", whiteSpace: "pre" }}>
            {word.split("").map((char) => {
              const idx = globalIndex++;
              return (
                <motion.span
                  key={idx}
                  custom={idx}
                  variants={charVariants}
                  style={{ display: "inline-block" }}
                >
                  {char}
                </motion.span>
              );
            })}
            {wi < words.length - 1 && (
              <motion.span
                custom={globalIndex++}
                variants={charVariants}
                style={{ display: "inline-block" }}
              >
                {"\u00A0"}
              </motion.span>
            )}
          </span>
        ))}
      </motion.span>
    </Tag>
  );
};

export default AnimatedHeadline;
