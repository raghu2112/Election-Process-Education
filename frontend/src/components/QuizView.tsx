/**
 * components/QuizView.tsx — Election Knowledge Quiz
 * ==================================================
 * 8-question multiple-choice quiz with:
 *  - Instant per-answer feedback + explanations
 *  - Animated score ring on completion
 *  - Full answer review panel
 *  - WCAG 2.1 AA — aria-checked radio group, live regions
 *
 * @accessibility
 *  - role="radiogroup" on option list
 *  - aria-checked on each option button
 *  - role="status" on feedback block
 *  - role="region" + aria-label on results panel
 *  - Progress bar has aria-valuenow/min/max
 */

import React, { useState, useCallback } from "react";
import { trackEvent } from "../utils/analytics";
import type { Theme } from "../constants/theme";
import type { Translation } from "../i18n/translations";

// ── Types ────────────────────────────────────────────────────

interface QuizQuestion {
  /** The question text */
  q: string;
  /** Four answer options */
  opts: [string, string, string, string];
  /** Index of the correct option (0–3) */
  ans: number;
  /** Explanation shown after answering */
  exp: string;
}

interface AnswerRecord {
  correct: boolean;
  selected: number;
}

type QuizPhase = "start" | "playing" | "done";

interface QuizViewProps {
  theme: Theme;
  t: Translation;
}

// ── Data ─────────────────────────────────────────────────────

const QUIZ_DATA: QuizQuestion[] = [
  {
    q: "What is the minimum voting age in most democracies?",
    opts: ["16", "18", "21", "25"],
    ans: 1,
    exp: "Most democracies set the voting age at 18. Austria and Scotland allow 16-year-olds to vote in certain elections.",
  },
  {
    q: 'What does "first past the post" mean in an election?',
    opts: [
      "The fastest candidate wins",
      "The candidate with the most votes wins, regardless of majority",
      "Candidates must win 50%+ to qualify",
      "Only the top two candidates advance",
    ],
    ans: 1,
    exp: "First Past the Post (FPTP) means the candidate with the most votes wins — even without 50% of total votes cast.",
  },
  {
    q: 'What is a "constituency" or "district"?",',
    opts: [
      "A political party branch",
      "A geographic area that elects one representative",
      "A type of voting machine",
      "The national election commission",
    ],
    ans: 1,
    exp: "A constituency is a defined geographic area whose registered voters collectively elect one representative to a legislative body.",
  },
  {
    q: "What does the Electoral College do in US presidential elections?",
    opts: [
      "Counts the popular vote directly",
      "Formally elects the President through state-allocated electors",
      "Organises presidential debates",
      "Certifies voter registration rolls",
    ],
    ans: 1,
    exp: "The 538-member Electoral College formally elects the US President. A candidate needs 270 electoral votes. Each state's count equals its Congressional representation.",
  },
  {
    q: 'What is "voter suppression"?',
    opts: [
      "Low voter turnout due to weather",
      "Deliberate efforts to prevent eligible people from voting",
      "Campaigning near polling stations",
      "Delaying vote counting",
    ],
    ans: 1,
    exp: "Voter suppression refers to deliberate strategies — restrictive ID laws, reduced polling hours, roll purging — that make voting harder for eligible citizens.",
  },
  {
    q: 'What is a "spoiled ballot"?',
    opts: [
      "A ballot cast for a losing candidate",
      "A ballot submitted after polls close",
      "A ballot that cannot be counted due to incorrect marking",
      "An absentee ballot",
    ],
    ans: 2,
    exp: "A spoiled (invalid) ballot cannot be counted — usually because it is blank, has marks in multiple boxes, or reveals the voter's identity.",
  },
  {
    q: 'What is "proportional representation"?',
    opts: [
      "Each district elects one MP",
      "Seats are allocated in proportion to each party's vote share",
      "Only the top two parties win seats",
      "Voters rank candidates by preference",
    ],
    ans: 1,
    exp: "Under proportional representation (PR), if a party wins 30% of the vote it receives ~30% of seats, making parliament reflect actual voter preferences more closely.",
  },
  {
    q: 'What is the purpose of an "exit poll"?',
    opts: [
      "To count official votes after polls close",
      "To survey voters as they leave and predict results",
      "To identify candidates who violated campaign laws",
      "To verify voter identities",
    ],
    ans: 1,
    exp: "Exit polls survey voters immediately after they vote. Results let media predict winners before official counting completes — though accuracy varies.",
  },
];

// ── Helpers ──────────────────────────────────────────────────

/**
 * Return a grade label based on percentage score.
 * @param pct - Score as 0–100 integer
 */
function gradeLabel(pct: number): string {
  if (pct >= 90) return "🏆 Outstanding";
  if (pct >= 75) return "🥇 Excellent";
  if (pct >= 60) return "👍 Good";
  if (pct >= 40) return "📚 Keep Learning";
  return "🔄 Try Again";
}

// ── Component ────────────────────────────────────────────────

/**
 * QuizView — renders the full quiz experience.
 * Three internal phases: start → playing → done.
 *
 * Performance: no prop drilling beyond theme + translations;
 * all quiz state is local — no global re-renders.
 */
const QuizView: React.FC<QuizViewProps> = ({ theme: th, t }) => {
  const [phase,    setPhase]    = useState<QuizPhase>("start");
  const [cur,      setCur]      = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score,    setScore]    = useState(0);
  const [answers,  setAnswers]  = useState<AnswerRecord[]>([]);

  const question = QUIZ_DATA[cur];

  /** Handle option selection — reveals answer, updates score */
  const handleSelect = useCallback((idx: number) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    const correct = idx === question.ans;
    if (correct) setScore((s) => s + 1);
    setAnswers((a) => [...a, { correct, selected: idx }]);
    trackEvent("quiz_answer", { question: cur, correct: String(correct) });
  }, [revealed, question, cur]);

  /** Advance to next question or show results */
  const handleNext = useCallback(() => {
    if (cur < QUIZ_DATA.length - 1) {
      setCur((c) => c + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      setPhase("done");
      trackEvent("quiz_complete", { score: String(score + (selected === question.ans ? 1 : 0)) });
    }
  }, [cur, score, selected, question]);

  /** Full reset */
  const handleRestart = useCallback(() => {
    setPhase("start");
    setCur(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setAnswers([]);
    trackEvent("quiz_restart");
  }, []);

  const pct = Math.round((score / QUIZ_DATA.length) * 100);
  const circumference = 2 * Math.PI * 15.9; // SVG circle circumference

  // ── Start screen ──
  if (phase === "start") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, gap: 20, textAlign: "center" }}>
        <div aria-hidden="true" style={{ fontSize: 64 }}>🧠</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: th.text }}>{t.quizTitle}</h1>
        <p style={{ color: th.textMuted, fontSize: 14, maxWidth: 340, lineHeight: 1.65 }}>{t.quizSub}</p>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { icon: "❓", label: `${QUIZ_DATA.length} Questions` },
            { icon: "✅", label: "Instant feedback" },
            { icon: "📊", label: "Score report" },
            { icon: "🔄", label: "Retryable" },
          ].map(({ icon, label }) => (
            <div key={label} style={{ padding: "8px 14px", borderRadius: 10, background: th.inputBg, border: `1px solid ${th.border}`, fontSize: 12, color: th.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
              <span aria-hidden="true">{icon}</span>{label}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => { setPhase("playing"); trackEvent("quiz_start"); }}
          aria-label="Start the election knowledge quiz"
          style={{ marginTop: 8, padding: "12px 36px", background: th.accent, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          {t.start} →
        </button>
      </div>
    );
  }

  // ── Results screen ──
  if (phase === "done") {
    const dashOffset = circumference - (pct / 100) * circumference;
    return (
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }} role="region" aria-label="Quiz results">
        <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
          <div aria-hidden="true" style={{ fontSize: 56, marginBottom: 10 }}>📊</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: th.text }}>{t.score}</h2>
          <div style={{ fontSize: 44, fontWeight: 800, color: th.accent, margin: "6px 0" }}>
            {score}/{QUIZ_DATA.length}
          </div>
          <div style={{ fontSize: 20, marginBottom: 16 }}>{gradeLabel(pct)}</div>

          {/* SVG score ring */}
          <div
            style={{ position: "relative", width: 110, height: 110, margin: "0 auto 20px" }}
            role="img"
            aria-label={`Score: ${pct} percent`}
          >
            <svg viewBox="0 0 36 36" style={{ width: 110, height: 110, transform: "rotate(-90deg)" }}>
              <circle cx={18} cy={18} r={15.9} fill="none" stroke={th.border} strokeWidth={2.5} />
              <circle
                cx={18} cy={18} r={15.9} fill="none"
                stroke={th.accent} strokeWidth={2.5}
                strokeDasharray={`${circumference}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: th.accent }}>
              {pct}%
            </div>
          </div>

          {/* Answer review */}
          <div style={{ textAlign: "left", marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: th.text, marginBottom: 10 }}>Answer Review</h3>
            {QUIZ_DATA.map((q, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 14px", marginBottom: 8, borderRadius: 10,
                  background: answers[i]?.correct ? th.greenBg : th.redBg,
                  border: `1px solid ${answers[i]?.correct ? th.greenBorder : th.redBorder}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                  <span aria-hidden="true">{answers[i]?.correct ? "✅" : "❌"}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: th.text, lineHeight: 1.4 }}>
                    Q{i + 1}: {q.q}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: th.textMuted, lineHeight: 1.55, paddingLeft: 24 }}>
                  <strong>Correct answer:</strong> {q.opts[q.ans]}<br />
                  {q.exp}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRestart}
            style={{ padding: "11px 28px", background: th.accent, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            {t.restart}
          </button>
        </div>
      </div>
    );
  }

  // ── Playing screen ──
  const progress = (cur / QUIZ_DATA.length) * 100;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }} role="main" aria-label={`Question ${cur + 1} of ${QUIZ_DATA.length}`}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>

        {/* Progress bar */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11, color: th.textMuted }}>
            <span>Question {cur + 1} of {QUIZ_DATA.length}</span>
            <span>Score: {score}</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={cur}
            aria-valuemin={0}
            aria-valuemax={QUIZ_DATA.length}
            aria-label={`Question ${cur + 1} of ${QUIZ_DATA.length}`}
            style={{ height: 5, borderRadius: 3, background: th.border }}
          >
            <div style={{ height: 5, borderRadius: 3, background: th.accent, width: `${progress}%`, transition: "width .4s ease" }} />
          </div>
        </div>

        {/* Question card */}
        <section aria-label={`Question ${cur + 1}`} style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 14, padding: "20px", marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: th.accent, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>
            Question {cur + 1}
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: th.text, lineHeight: 1.55, margin: 0 }}>
            {question.q}
          </h2>
        </section>

        {/* Options */}
        <div role="radiogroup" aria-label="Answer options" style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {question.opts.map((opt, i) => {
            // Determine visual state
            let bg     = th.inputBg;
            let border = th.inputBorder;
            let color  = th.text;
            if (revealed) {
              if (i === question.ans)              { bg = th.greenBg;  border = th.greenBorder; color = "#10B981"; }
              else if (i === selected)             { bg = th.redBg;    border = th.redBorder;   color = "#EF4444"; }
            } else if (selected === i) {
              bg = th.accent + "18"; border = th.accent; color = th.accent;
            }

            return (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={selected === i}
                onClick={() => handleSelect(i)}
                disabled={revealed}
                style={{
                  padding: "11px 14px", borderRadius: 10,
                  border: `1.5px solid ${border}`,
                  background: bg, color,
                  textAlign: "left", fontSize: 13, fontWeight: 500,
                  cursor: revealed ? "default" : "pointer",
                  transition: "all .15s",
                  display: "flex", alignItems: "center", gap: 10,
                }}
              >
                {/* Option badge */}
                <span style={{
                  width: 24, height: 24, borderRadius: "50%",
                  border: `1.5px solid ${border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, flexShrink: 0, color,
                }}>
                  {revealed && i === question.ans ? "✓"
                   : revealed && i === selected && i !== question.ans ? "✗"
                   : String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Explanation panel */}
        {revealed && (
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: "12px 14px", borderRadius: 10, marginBottom: 14,
              background: selected === question.ans ? th.greenBg : th.redBg,
              border: `1px solid ${selected === question.ans ? th.greenBorder : th.redBorder}`,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 5, color: selected === question.ans ? "#10B981" : "#EF4444" }}>
              {selected === question.ans ? `✅ ${t.correct}` : `❌ ${t.wrong}`}
            </div>
            <div style={{ fontSize: 12, color: th.textMuted, lineHeight: 1.6 }}>{question.exp}</div>
          </div>
        )}

        {/* Next button */}
        {revealed && (
          <button
            type="button"
            onClick={handleNext}
            style={{ width: "100%", padding: "12px", background: th.accent, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            {cur < QUIZ_DATA.length - 1 ? `${t.next} →` : t.finish}
          </button>
        )}

      </div>
    </div>
  );
};

export default QuizView;
