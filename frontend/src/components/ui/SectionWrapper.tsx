// frontend/src/components/ui/SectionWrapper.tsx
// Consistent page section with max-width, padding, and optional header.

import React from "react";

interface SectionWrapperProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  small?: boolean;
  label?: string;
  title?: string;
  description?: string;
}

const SectionWrapper: React.FC<SectionWrapperProps> = ({
  children,
  className = "",
  id,
  small,
  label,
  title,
  description,
}) => (
  <section id={id} className={`section ${small ? "section-sm" : ""} ${className}`}>
    {(label || title || description) && (
      <div className="section-header">
        {label && <span className="section-label">{label}</span>}
        {title && <h2 className="section-title">{title}</h2>}
        {description && <p className="section-desc">{description}</p>}
      </div>
    )}
    {children}
  </section>
);

export default SectionWrapper;
