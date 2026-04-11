// frontend/src/components/ui/TimelineStep.tsx
// Numbered timeline step with connector line, used in "How It Works".

import React from "react";
import { motion } from "framer-motion";

interface TimelineStepProps {
  number: number;
  title: string;
  description: string;
  isLast?: boolean;
  delay?: number;
}

const TimelineStep: React.FC<TimelineStepProps> = ({
  number,
  title,
  description,
  isLast = false,
  delay = 0,
}) => (
  <motion.div
    className="timeline-step"
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
  >
    <div className="timeline-marker">
      <div className="timeline-number">{number}</div>
      {!isLast && <div className="timeline-line" />}
    </div>
    <div className="timeline-content">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  </motion.div>
);

export default TimelineStep;
