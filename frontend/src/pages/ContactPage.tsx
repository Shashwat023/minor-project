// frontend/src/pages/ContactPage.tsx
import React from "react";
import SectionWrapper from "../components/ui/SectionWrapper";
import FadeInSection from "../components/ui/FadeInSection";

const INFO = [
  { icon: "📧", title: "Email", text: "contact@memorycare.ai" },
  { icon: "📍", title: "Location", text: "Healthcare Innovation Hub\nSan Francisco, CA" },
  { icon: "🕐", title: "Response Time", text: "We typically respond within 24 hours" },
  { icon: "🔒", title: "Security", text: "For security concerns: security@memorycare.ai" },
];

const ContactPage: React.FC = () => (
  <div className="page-wrapper">
    <div className="page-content" style={{ paddingTop: "64px" }}>
      <SectionWrapper label="Contact" title="Get in touch"
        description="Have questions about MemoryCare? We'd love to hear from you.">
        <div className="contact-grid">
          <FadeInSection>
            <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label htmlFor="contact-name">Name</label>
                <input id="contact-name" type="text" placeholder="Your name" />
              </div>
              <div className="form-group">
                <label htmlFor="contact-email">Email</label>
                <input id="contact-email" type="email" placeholder="you@example.com" />
              </div>
              <div className="form-group">
                <label htmlFor="contact-subject">Subject</label>
                <input id="contact-subject" type="text" placeholder="How can we help?" />
              </div>
              <div className="form-group">
                <label htmlFor="contact-message">Message</label>
                <textarea id="contact-message" placeholder="Tell us more..." rows={5} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
                Send Message
              </button>
            </form>
          </FadeInSection>

          <FadeInSection delay={0.2}>
            <div className="contact-info-list">
              {INFO.map((item, i) => (
                <div key={i} className="contact-info-item">
                  <div className="contact-info-icon">{item.icon}</div>
                  <div>
                    <h4>{item.title}</h4>
                    <p style={{ whiteSpace: "pre-line" }}>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeInSection>
        </div>
      </SectionWrapper>
    </div>
  </div>
);

export default ContactPage;
