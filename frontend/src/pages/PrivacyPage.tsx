// frontend/src/pages/PrivacyPage.tsx
import React from "react";
import SectionWrapper from "../components/ui/SectionWrapper";
import FadeInSection from "../components/ui/FadeInSection";

const PrivacyPage: React.FC = () => (
  <div className="page-wrapper">
    <div className="page-content" style={{ paddingTop: "64px" }}>
      <SectionWrapper label="Legal" title="Privacy Policy" description="Last updated: April 2026">
        <FadeInSection>
          <div className="legal-content">
            <h2>1. Information We Collect</h2>
            <p>MemoryCare collects the minimum data necessary to provide AI-assisted dementia care services:</p>
            <ul>
              <li>Audio recordings during active sessions (processed in real-time, not permanently stored in raw form)</li>
              <li>Video snapshots for visual assessment (stored securely with session context)</li>
              <li>AI-generated session summaries and clinical notes</li>
              <li>Session metadata (timestamps, duration, participant identifiers)</li>
            </ul>

            <h2>2. How We Use Your Data</h2>
            <p>All collected data is used exclusively for providing care services:</p>
            <ul>
              <li>Real-time speech-to-text transcription for AI summary generation</li>
              <li>Visual assessment through ML-powered snapshot analysis</li>
              <li>Longitudinal tracking of patient progress across sessions</li>
              <li>Generating clinical notes and care recommendations</li>
            </ul>

            <h2>3. Data Security</h2>
            <p>We implement multiple layers of security:</p>
            <ul>
              <li>WebRTC peer-to-peer encryption for all video calls</li>
              <li>TLS encryption for all API communications</li>
              <li>Access-controlled storage for session data</li>
              <li>No third-party data sharing or advertising use</li>
            </ul>

            <h2>4. Data Retention</h2>
            <p>Session summaries are retained for the duration of the care relationship. Raw audio is processed in real-time and not permanently stored after transcription. Patients or authorized caregivers may request data deletion at any time.</p>

            <h2>5. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. Contact our team to exercise these rights or for any privacy-related questions.</p>

            <h2>6. Contact</h2>
            <p>For privacy inquiries, reach us at privacy@memorycare.ai or through our contact page.</p>
          </div>
        </FadeInSection>
      </SectionWrapper>
    </div>
  </div>
);

export default PrivacyPage;
