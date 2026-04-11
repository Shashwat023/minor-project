// frontend/src/components/ui/ParallaxHero.tsx
// Hero section with scroll-linked parallax on background elements.

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ParallaxHeroProps {
  children: React.ReactNode;
  className?: string;
}

const ParallaxHero: React.FC<ParallaxHeroProps> = ({ children, className = "" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div ref={ref} className={`hero ${className}`}>
      <motion.div className="hero-bg" style={{ y: bgY }} />
      <motion.div className="hero-content" style={{ opacity }}>
        {children}
      </motion.div>
    </div>
  );
};

export default ParallaxHero;
