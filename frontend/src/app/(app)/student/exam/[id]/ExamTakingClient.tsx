"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, ChevronLeft, ChevronRight, BookOpen, AlertTriangle } from "lucide-react";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";

interface Question {
  id: string;
  order: number;
  text: string;
  type: string;
  options: string[] | null;
  marks: number;
}

interface Props {
  exam: {
    id: string;
    title: string;
    subjectName: string;
    className: string;
    duration: number | null;
    maxScore: number;
    questions: Question[];
  };
  attemptId: string | null;
  alreadySubmitted: boolean;
  submittedScore: number | null;
  existingAnswers: Record<string, string>;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function ExamTakingClient({ exam, attemptId: initialAttemptId, alreadySubmitted, submittedScore, existingAnswers }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const [answers, setAnswers] = useState<Record<string, string>>(existingAnswers);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [attemptId, setAttemptId] = useState<string | null>(initialAttemptId);
  const [started, setStarted] = useState(!!initialAttemptId);
  const [submitted, setSubmitted] = useState(alreadySubmitted);
  const [score, setScore] = useState<number | null>(submittedScore);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    exam.duration ? exam.duration * 60 : null
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSubmit = useCallback(async (auto = false) => {
    if (submitting || !attemptId) return;
    if (!auto && !(await confirm({ message: "Submit exam? You cannot change your answers after submitting.", confirmLabel: "Submit" }))) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/exams/${exam.id}/attempts/${attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setScore(data.score);
        setSubmitted(true);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    } finally {
      setSubmitting(false);
    }
  }, [submitting, attemptId, exam.id, answers]);

  useEffect(() => {
    if (!started || submitted || timeLeft === null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t === null || t <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started, submitted, timeLeft, handleSubmit]);

  async function startExam() {
    if (attemptId) { setStarted(true); return; }
    const res = await fetch(`/api/exams/${exam.id}/attempts`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setAttemptId(data.id);
      setStarted(true);
      if (exam.duration) setTimeLeft(exam.duration * 60);
    }
  }

  const q = exam.questions[currentIdx];
  const answered = Object.keys(answers).length;
  const total = exam.questions.length;
  const totalMarks = exam.questions.reduce((s, q) => s + q.marks, 0);

  if (submitted) {
    const hasMcq = exam.questions.some((q) => q.type === "mcq");
    return (
      <div style={{ maxWidth: 560, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <CheckCircle2 size={36} color="#10b981" />
        </div>
        <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, marginBottom: 8 }}>Exam Submitted!</h1>
        <p style={{ color: "#71787b", marginBottom: 24 }}>{exam.title}</p>
        {hasMcq && score !== null ? (
          <div style={{ background: "#f8f9fa", borderRadius: 16, padding: "24px 32px", marginBottom: 24 }}>
            <div style={{ fontSize: "var(--text-sm)", color: "#71787b", marginBottom: 4 }}>Your Score</div>
            <div style={{ fontSize: 48, fontWeight: 800, color: "#1a2332" }}>{score}</div>
            <div style={{ fontSize: "var(--text-sm)", color: "#71787b" }}>out of {totalMarks}</div>
            <div style={{ marginTop: 12, fontSize: "var(--text-xs)", color: "#10b981", fontWeight: 600 }}>
              {Math.round((score / totalMarks) * 100)}%
            </div>
          </div>
        ) : (
          <div style={{ background: "#fffbeb", borderRadius: 16, padding: "16px 24px", marginBottom: 24, color: "#92400e", fontSize: "var(--text-sm)" }}>
            Your answers have been recorded. Your teacher will mark this exam and the score will be available soon.
          </div>
        )}
        <button
          onClick={() => router.push("/student/exams")}
          style={{ background: "#1a2332", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer" }}
        >
          Back to Portal
        </button>
      </div>
    );
  }

  if (!started) {
    return (
      <div style={{ maxWidth: 560, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <BookOpen size={28} color="#4f46e5" />
        </div>
        <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, marginBottom: 8 }}>{exam.title}</h1>
        <p style={{ color: "#71787b", marginBottom: 20 }}>{exam.subjectName} · {exam.className}</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 32 }}>
          <InfoChip label="Questions" value={String(total)} />
          <InfoChip label="Total Marks" value={String(totalMarks)} />
          {exam.duration && <InfoChip label="Time Limit" value={`${exam.duration} min`} />}
        </div>
        <div style={{ background: "#fffbeb", borderRadius: 12, padding: "14px 20px", marginBottom: 28, fontSize: "var(--text-xs)", color: "#92400e" }}>
          <AlertTriangle size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
          Once you start, the timer will begin. Submit before time runs out.
        </div>
        <button
          onClick={startExam}
          style={{ background: "#1a2332", color: "#fff", border: "none", borderRadius: 10, padding: "14px 40px", fontSize: "var(--text-base)", fontWeight: 700, cursor: "pointer" }}
        >
          Start Exam
        </button>
      </div>
    );
  }

  if (!q) {
    return <div style={{ textAlign: "center", padding: 80, color: "#71787b" }}>No questions found for this exam.</div>;
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px 80px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 12 }}>
        <div>
          <div style={{ fontSize: "var(--text-xs)", color: "#71787b" }}>{exam.subjectName} · {exam.className}</div>
          <div style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "#1a2332" }}>{exam.title}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          {timeLeft !== null && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
              background: timeLeft < 300 ? "#fef2f2" : "#f0fdf4",
              color: timeLeft < 300 ? "#ef4444" : "#16a34a",
              borderRadius: 8, fontSize: "var(--text-sm)", fontWeight: 700
            }}>
              <Clock size={14} />
              {formatTime(timeLeft)}
            </div>
          )}
          <div style={{ fontSize: "var(--text-xs)", color: "#71787b" }}>{answered}/{total} answered</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: "#e2e8f0", borderRadius: 99, marginBottom: 28, overflow: "hidden" }}>
        <div style={{ height: "100%", background: "#4f46e5", width: `${(currentIdx / total) * 100}%`, transition: "width 0.3s" }} />
      </div>

      {/* Question navigator */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
        {exam.questions.map((q2, i) => (
          <button
            key={q2.id}
            onClick={() => setCurrentIdx(i)}
            style={{
              width: 36, height: 36, borderRadius: 8, border: "none", cursor: "pointer", fontSize: "var(--text-xs)", fontWeight: 600,
              background: i === currentIdx ? "#1a2332" : answers[q2.id] ? "#ecfdf5" : "#f1f5f9",
              color: i === currentIdx ? "#fff" : answers[q2.id] ? "#16a34a" : "#64748b",
              outline: i === currentIdx ? "2px solid #4f46e5" : "none", outlineOffset: 2,
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question card */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "28px 32px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "#71787b", textTransform: "uppercase", letterSpacing: 1 }}>
            Question {currentIdx + 1} of {total}
          </span>
          <span style={{ fontSize: "var(--text-xs)", color: "#71787b" }}>{q.marks} mark{q.marks !== 1 ? "s" : ""}</span>
        </div>
        <p style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "#1a2332", marginBottom: 24, lineHeight: 1.6 }}>{q.text}</p>

        {q.type === "mcq" && q.options ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {q.options.map((opt, i) => {
              const letter = ["A", "B", "C", "D"][i];
              const selected = answers[q.id] === letter;
              return (
                <button
                  key={i}
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: letter }))}
                  style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
                    borderRadius: 12, border: `2px solid ${selected ? "#4f46e5" : "#e2e8f0"}`,
                    background: selected ? "#eef2ff" : "#fff",
                    cursor: "pointer", textAlign: "left", fontSize: "var(--text-base)", color: "#1a2332",
                    fontWeight: selected ? 600 : 400, transition: "all 0.15s",
                  }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: selected ? "#4f46e5" : "#f1f5f9",
                    color: selected ? "#fff" : "#64748b",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "var(--text-xs)", fontWeight: 700,
                  }}>{letter}</span>
                  {opt}
                </button>
              );
            })}
          </div>
        ) : (
          <textarea
            value={answers[q.id] ?? ""}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
            placeholder="Write your answer here…"
            rows={5}
            style={{
              width: "100%", borderRadius: 10, border: "2px solid #e2e8f0", padding: "12px 16px",
              fontSize: "var(--text-base)", resize: "vertical", fontFamily: "inherit", outline: "none",
              boxSizing: "border-box",
            }}
          />
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "10px 18px",
            border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff", cursor: "pointer",
            fontSize: "var(--text-sm)", fontWeight: 500, color: "#1a2332", opacity: currentIdx === 0 ? 0.4 : 1,
          }}
        >
          <ChevronLeft size={16} /> Previous
        </button>

        {currentIdx < total - 1 ? (
          <button
            onClick={() => setCurrentIdx((i) => Math.min(total - 1, i + 1))}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 18px",
              border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff", cursor: "pointer",
              fontSize: "var(--text-sm)", fontWeight: 500, color: "#1a2332",
            }}
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            style={{
              padding: "10px 24px", border: "none", borderRadius: 10, background: "#1a2332",
              color: "#fff", cursor: submitting ? "not-allowed" : "pointer", fontSize: "var(--text-sm)", fontWeight: 700,
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Submitting…" : "Submit Exam"}
          </button>
        )}
      </div>

      {/* Submit always visible at bottom */}
      {currentIdx < total - 1 && (
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            style={{
              padding: "10px 28px", border: "2px solid #1a2332", borderRadius: 10,
              background: "transparent", color: "#1a2332", cursor: "pointer", fontSize: "var(--text-xs)", fontWeight: 600,
            }}
          >
            Submit Now ({answered}/{total} answered)
          </button>
        </div>
      )}
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "#1a2332" }}>{value}</div>
      <div style={{ fontSize: "var(--text-xs)", color: "#71787b" }}>{label}</div>
    </div>
  );
}
