// frontend/src/features/cognitive-quiz/CognitiveQuizWidget.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logQuizSession } from '../../../spacetime-sdk';

// ----------------------------------------------------------------------
// DATA TYPES & CLINICAL DIAGNOSTIC BANKS
// ----------------------------------------------------------------------

interface QuestionDef {
  q: string;
  a: string;
  d: string[]; // distractors
  type: "episodic" | "personalized";
  difficulty: "L1" | "L2" | "L3" | "High-Precision";
  weight: number; 
}

const EPISODIC_QUESTIONS: QuestionDef[] = [
  { q: "Who did you speak to most recently?", a: "Rohit", d: ["Priya", "Dr. Sharma", "Amit"], type: "episodic", difficulty: "L1", weight: 3 },
  { q: "Did Priya visit you recently?", a: "Yes, this morning", d: ["No, last week", "She hasn't visited", "Yesterday evening"], type: "episodic", difficulty: "L2", weight: 3 },
  { q: "Did you have a meeting with Dr. Sharma?", a: "Yes, on Tuesday", d: ["No, not recently", "Yes, today", "Yes, yesterday"], type: "episodic", difficulty: "L1", weight: 3 },
  { q: "Who called you yesterday afternoon?", a: "Your brother", d: ["Nobody", "Your daughter", "The doctor"], type: "episodic", difficulty: "L2", weight: 3 },
  { q: "What was the last conversation you had about?", a: "Family dinner", d: ["Medication", "Watching TV", "Taking a walk"], type: "episodic", difficulty: "High-Precision", weight: 3 },
];

const PERSONALIZED_QUESTIONS: QuestionDef[] = [
  { q: "How is Rohit related to you?", a: "Son", d: ["Doctor", "Neighbor", "Brother"], type: "personalized", difficulty: "L1", weight: 4 },
  { q: "What were you and Rohit talking about?", a: "Your old house", d: ["Medication", "The weather", "Groceries"], type: "personalized", difficulty: "L2", weight: 4 },
  { q: "How is Priya related to you?", a: "Daughter", d: ["Sister", "Friend", "Nurse"], type: "personalized", difficulty: "L1", weight: 4 },
  { q: "What did you and Priya discuss?", a: "The upcoming family dinner", d: ["Buying a car", "Watching TV", "Doctor appointment"], type: "personalized", difficulty: "L2", weight: 4 },
  { q: "How do you know Dr. Sharma?", a: "He is my doctor", d: ["My son", "A store clerk", "My neighbor"], type: "personalized", difficulty: "L1", weight: 4 },
  { q: "What was the main topic when talking to Dr. Sharma?", a: "Your new medication schedule", d: ["Family history", "Dietary changes", "Exercise"], type: "personalized", difficulty: "L2", weight: 4 },
  { q: "Who usually visits you on Sunday evenings?", a: "Rohit", d: ["Anita", "Your neighbor", "Nobody"], type: "personalized", difficulty: "L3", weight: 4 },
];

const ALL_BANKS = [EPISODIC_QUESTIONS, PERSONALIZED_QUESTIONS];

function generateQuestion(usedQuestions: Set<string>) {
  const bankIndex = Math.floor(Math.random() * ALL_BANKS.length);
  const selectedBank = ALL_BANKS[bankIndex];

  let qDef = selectedBank[Math.floor(Math.random() * selectedBank.length)];
  let attempts = 0;
  while (usedQuestions.has(qDef.q) && attempts < 10) {
    qDef = selectedBank[Math.floor(Math.random() * selectedBank.length)];
    attempts++;
  }

  const options = [qDef.a, ...qDef.d].sort(() => 0.5 - Math.random());
  
  return { 
    questionText: qDef.q, 
    correctAnswer: qDef.a, 
    options, 
    meta: qDef 
  };
}

export default function CognitiveQuizWidget() {
  const TOTAL_QUESTIONS = 5;
  const PATIENT_ID = "patient_001"; // Pulled from global context usually

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [usedQuestions, setUsedQuestions] = useState<Set<string>>(new Set());
  const [quizData, setQuizData] = useState(() => generateQuestion(new Set()));
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Real-time Timer states
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [liveTimerMs, setLiveTimerMs] = useState(0);
  const [answersLog, setAnswersLog] = useState<{correct: boolean, timeMs: number, meta: QuestionDef}[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [hasLoggedToDB, setHasLoggedToDB] = useState(false);

  // Live Timer Effect
  useEffect(() => {
    let timerId: ReturnType<typeof setInterval>;
    if (!selectedOption && !isFinished) {
      setQuestionStartTime(Date.now());
      timerId = setInterval(() => {
        setLiveTimerMs(Date.now() - questionStartTime);
      }, 50);
    }
    return () => clearInterval(timerId);
  }, [quizData, selectedOption, isFinished]); // Restart tracking per question

  const { questionText, correctAnswer, options, meta } = quizData;

  const handleSelect = (option: string) => {
    if (selectedOption) return; 
    
    const timeTaken = Date.now() - questionStartTime;
    const isCorrect = option === correctAnswer;
    
    setSelectedOption(option);
    
    setTimeout(() => {
      setAnswersLog(prev => [...prev, { correct: isCorrect, timeMs: timeTaken, meta }]);
      
      const newUsed = new Set(usedQuestions);
      newUsed.add(questionText);
      setUsedQuestions(newUsed);

      if (currentQIndex + 1 >= TOTAL_QUESTIONS) {
        setIsFinished(true);
      } else {
        setCurrentQIndex(prev => prev + 1);
        setSelectedOption(null);
        setQuizData(generateQuestion(newUsed));
      }
    }, 1500); 
  };

  // ----------------------------------------------------------------------
  // SPACETIMEDB PUSH MECHANISM
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (isFinished && !hasLoggedToDB) {
      // 1. Calculate Outputs exactly as we did in the UI
      let totalWeight = 0; let earnedWeight = 0;
      answersLog.forEach(ans => { totalWeight += ans.meta.weight; if (ans.correct) earnedWeight += ans.meta.weight; });
      const weightedAccuracy = Math.round((earnedWeight / totalWeight) * 100) || 0;

      let totalSpeedScore = 0;
      answersLog.forEach(ans => {
        let baseMs = 4000; 
        if (ans.meta.difficulty === "L3") baseMs = 6000;
        if (ans.meta.difficulty === "High-Precision") baseMs = 8000;
        let speedPct = 100 - ((ans.timeMs - baseMs) / baseMs) * 50;
        totalSpeedScore += Math.max(0, Math.min(100, speedPct));
      });
      const speed = Math.round(totalSpeedScore / TOTAL_QUESTIONS);
      const composite = Math.round((weightedAccuracy * 0.7) + (speed * 0.3));

      // 2. Perform push to SpacetimeDB
      console.log(`[SPACETIMEDB PIPELINE] Sending Diagnostic Record for ${PATIENT_ID}...`, {
        patientId: PATIENT_ID,
        accuracyScore: weightedAccuracy,
        speedScore: speed,
        averageScore: composite,
        questionsTaken: TOTAL_QUESTIONS
      });

      try {
        logQuizSession(PATIENT_ID, weightedAccuracy, speed, composite, TOTAL_QUESTIONS);
      } catch (err) {
        console.warn("SpacetimeDB context missing or disconnected:", err);
      }

      setHasLoggedToDB(true);
    }
  }, [isFinished, answersLog]);

  const S: Record<string, React.CSSProperties> = {
    card: { background: "#13131f", border: "1px solid #1e1e30", borderRadius: 24, padding: "40px", maxWidth: 600, width: "100%", margin: "40px auto", fontFamily: "Inter, system-ui, sans-serif", color: "#e2e8f0", boxShadow: "0 20px 50px rgba(0,0,0,0.8)", textAlign: "center" as const },
    header: { fontSize: 16, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase" as const, letterSpacing: ".1em", marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    tag: { fontSize: 12, padding: "6px 14px", borderRadius: 20, background: "#2e1065", color: "#c4b5fd", border: "1px solid #4c1d95", fontWeight: 600 },
    question: { fontSize: 28, fontWeight: 700, lineHeight: 1.4, marginBottom: 32 },
    optionsContainer: { display: "flex", flexDirection: "column" as const, gap: 14, marginBottom: 24 },
    button: { width: "100%", padding: "20px", borderRadius: 16, border: "2px solid #2d2d44", background: "#1a1a2e", color: "#e2e8f0", fontSize: 20, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" },
    feedbackBox: { padding: "24px", borderRadius: 16, marginTop: 20, fontSize: 18, fontWeight: 500, animation: "fadeIn 0.5s ease-in-out" },
    resultBox: { display: "flex", justifyContent: "space-between", background: "#1a1a2e", padding: 24, borderRadius: 16, marginBottom: 16, alignItems: 'center', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' },
    metricLabel: { color: "#94a3b8", fontSize: 13, textTransform: "uppercase" as const, marginBottom: 6, fontWeight: 700, letterSpacing: '.05em' },
    metricValue: { fontSize: 40, fontWeight: 800 },
    timerPill: { background: "#1a1a2e", border: "1px solid #2d2d44", color: "#94a3b8", padding: "6px 14px", borderRadius: 20, fontSize: 14, fontWeight: 600, fontFamily: "monospace" }
  };

  function getButtonStyle(option: string): React.CSSProperties {
    if (!selectedOption) return S.button;
    if (option === correctAnswer) return { ...S.button, background: "#059669", borderColor: "#10b981", color: "#fff" };
    if (option === selectedOption && option !== correctAnswer) return { ...S.button, background: "#991b1b", borderColor: "#ef4444", color: "#fff" };
    return { ...S.button, opacity: 0.5, cursor: "not-allowed" };
  }

  function getTagColor(type: string) {
    if (type === 'personalized') return { bg: '#4c1d95', text: '#ddd6fe' }; 
    return { bg: '#064e3b', text: '#a7f3d0' }; 
  }

  // ----------------------------------------------------------------------
  // FINISHED DIAGNOSTIC SCORECARD
  // ----------------------------------------------------------------------
  if (isFinished) {
    let totalWeight = 0; let earnedWeight = 0;
    answersLog.forEach(ans => { totalWeight += ans.meta.weight; if (ans.correct) earnedWeight += ans.meta.weight; });
    const weightedAccuracy = Math.round((earnedWeight / totalWeight) * 100) || 0;

    let totalSpeedScore = 0;
    answersLog.forEach(ans => {
      let baseMs = 4000; 
      if (ans.meta.difficulty === "L3") baseMs = 6000;
      if (ans.meta.difficulty === "High-Precision") baseMs = 8000;
      let speedPercentage = 100 - ((ans.timeMs - baseMs) / baseMs) * 50;
      totalSpeedScore += Math.max(0, Math.min(100, speedPercentage));
    });
    const speed = Math.round(totalSpeedScore / TOTAL_QUESTIONS);
    const composite = Math.round((weightedAccuracy * 0.7) + (speed * 0.3));

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={S.card}
      >
        <div style={{...S.header, justifyContent: 'center'}}>🧠 Diagnostic Complete</div>
        <div style={{ ...S.question, fontSize: 24, marginBottom: 40, color: '#f8fafc'}}>Great work today! Your neural data is logged.</div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          <div style={S.resultBox}>
            <div style={{textAlign: 'left'}}>
              <div style={S.metricLabel}>Weighted Accuracy</div>
              <div style={{...S.metricValue, color: weightedAccuracy > 70 ? '#10b981' : '#f59e0b'}}>{weightedAccuracy}%</div>
              <div style={{fontSize: 12, color: '#64748b', marginTop: 8}}>Based on Clinical Anchors</div>
            </div>
            <div style={{textAlign: 'right'}}>
              <div style={S.metricLabel}>Cognitive Speed</div>
              <div style={{...S.metricValue, color: speed > 60 ? '#3b82f6' : '#f59e0b'}}>{speed}</div>
              <div style={{fontSize: 12, color: '#64748b', marginTop: 8}}>Normalized to Difficulty</div>
            </div>
          </div>
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ delay: 0.3, type: "spring" }}
            style={{ ...S.resultBox, background: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 100%)', border: '1px solid #7c3aed', flexDirection: 'column', alignItems: 'center', padding: 40, boxShadow: '0 10px 30px rgba(76, 29, 149, 0.4)' }}
          >
            <div style={{...S.metricLabel, color: '#ddd6fe'}}>Overall Health Composite</div>
            <div style={{...S.metricValue, color: '#fff', fontSize: 72}}>{composite}</div>
          </motion.div>
        </div>

        <button style={{ ...S.button, marginTop: 40, background: '#a78bfa', color: '#13131f', borderColor: '#a78bfa' }} onClick={() => window.location.reload()}>
          Complete Session
        </button>
      </motion.div>
    )
  }

  const activeTagColors = getTagColor(meta.type);

  // ----------------------------------------------------------------------
  // QUIZ VIEW
  // ----------------------------------------------------------------------
  return (
    <motion.div 
      key={currentQIndex} // Trigger re-animation per question
      initial={{ x: 30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -30, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={S.card}
    >
      <style>
        {`
          button:hover:not(:disabled) { border-color: #a78bfa !important; background: #2e1065 !important; transform: translateY(-2px); }
        `}
      </style>
      
      <div style={S.header}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <span style={S.timerPill}>⏱️ {(liveTimerMs / 1000).toFixed(1)}s</span>
        </div>
        <div style={{ color: '#64748b', fontSize: 13 }}>{currentQIndex + 1} / {TOTAL_QUESTIONS}</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
        <span style={{...S.tag, background: activeTagColors.bg, color: activeTagColors.text, border: 'none'}}>
          {meta.type.toUpperCase()} MEMORY
        </span>
        <span style={{...S.tag, background: '#1e1e30', color: '#94a3b8', border: 'none'}}>
          {meta.difficulty.toUpperCase()}
        </span>
      </div>
      
      <div style={S.question}>{questionText}</div>
      
      <div style={S.optionsContainer}>
        <AnimatePresence>
          {options.map((opt, idx) => (
            <motion.button 
              whileTap={{ scale: selectedOption ? 1 : 0.98 }}
              key={idx} 
              style={getButtonStyle(opt)} 
              onClick={() => handleSelect(opt)}
              disabled={selectedOption !== null}
            >
              {opt}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {selectedOption && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{
            ...S.feedbackBox,
            background: selectedOption === correctAnswer ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
            color: selectedOption === correctAnswer ? "#34d399" : "#f87171",
            border: `1px solid ${selectedOption === correctAnswer ? "#10b981" : "#ef4444"}`
          }}
        >
          {selectedOption === correctAnswer 
            ? "Excellent! Spot on." 
            : `Not quite! The correct answer is "${correctAnswer}". Good try!`}
        </motion.div>
      )}
    </motion.div>
  );
}
