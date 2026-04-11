// frontend/src/components/ui/AnimatedAccordion.tsx
// Expand/collapse accordion with framer-motion AnimatePresence.

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AccordionItemData {
  id: string;
  title: string;
  content: string;
}

interface AnimatedAccordionProps {
  items: AccordionItemData[];
  className?: string;
}

const ChevronDown = () => (
  <svg className="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const AnimatedAccordion: React.FC<AnimatedAccordionProps> = ({ items, className = "" }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className={`accordion ${className}`}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id} className={`accordion-item ${isOpen ? "open" : ""}`}>
            <button
              className="accordion-trigger"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              aria-expanded={isOpen}
            >
              {item.title}
              <ChevronDown />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="accordion-body">{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default AnimatedAccordion;
