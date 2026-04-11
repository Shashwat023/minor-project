// frontend/src/components/ui/FeatureCarousel.tsx
// Draggable horizontal carousel using framer-motion drag constraints.

import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

interface FeatureCarouselProps {
  children: React.ReactNode;
  className?: string;
}

const FeatureCarousel: React.FC<FeatureCarouselProps> = ({ children, className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragConstraint, setDragConstraint] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const scrollW = el.scrollWidth;
      const viewW = el.clientWidth;
      setDragConstraint(Math.min(0, -(scrollW - viewW)));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [children]);

  return (
    <div ref={containerRef} className={`carousel-container ${className}`}>
      <motion.div
        className="carousel-track"
        drag="x"
        dragConstraints={{ left: dragConstraint, right: 0 }}
        dragElastic={0.1}
        dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default FeatureCarousel;
