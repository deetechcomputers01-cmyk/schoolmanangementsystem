"use client";

import Link from "next/link";
import { ClipboardList, Clock, CheckCircle2, Play, BookOpen, Calendar, Lock } from "lucide-react";

interface ExamRow {
  id: string;
  title: string;
  subjectName: string;
  scheduledAt: string;
  duration: number | null;
  totalMarks: number;
  isOnline: boolean;
  questionCount: number;
  attemptStatus: "not_started" | "in_progress" | "submitted";
  score: number | null;
}

interface Props {
  exams: ExamRow[];
  studentName: string;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function StudentExamsClient({ exams, studentName }: Props) {
  const online  = exams.filter((e) => e.isOnline);
  const offline = exams.filter((e) => !e.isOnline);

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.06em", color: "#486647", fontWeight: 700, margin: "0 0 4px" }}>
          My Exams
        </p>
        <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "#073543", margin: "0 0 4px" }}>
          Examinations
        </h1>
        <p style={{ fontSize: "var(--text-sm)", color: "#71787b", margin: 0 }}>
          Your assigned exams and online assessments, {studentName.split(" ")[0]}.
        </p>
      </div>

      {exams.length === 0 && (
        <div style={{ textAlign: "center", padding: "64px 24px", background: "#f8f9fa", borderRadius: 16, border: "1px dashed #d1d9e0" }}>
          <ClipboardList size={36} style={{ color: "#c1c7cb", marginBottom: 12 }} />
          <p style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "#41484b", margin: "0 0 6px" }}>No exams assigned yet</p>
          <p style={{ fontSize: "var(--text-xs)", color: "#71787b", margin: 0 }}>Your teacher will assign exams to your class here.</p>
        </div>
      )}

      {/* Online / takeable exams */}
      {online.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#073543", marginBottom: 14 }}>
            Online Assessments
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {online.map((e) => {
              const denom = e.totalMarks > 0 ? e.totalMarks : 1;
              const pct = e.score !== null ? Math.round((e.score / denom) * 100) : null;
              return (
                <div key={e.id} style={{
                  background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0",
                  padding: "20px 24px", display: "flex", alignItems: "center", gap: 20,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: e.attemptStatus === "submitted" ? "#f0fdf4" : "#eef2ff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {e.attemptStatus === "submitted"
                      ? <CheckCircle2 size={22} color="#10b981" />
                      : <ClipboardList size={22} color="#4f46e5" />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "#073543", marginBottom: 3 }}>{e.title}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "#71787b", display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <BookOpen size={12} /> {e.subjectName}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <ClipboardList size={12} /> {e.questionCount} question{e.questionCount !== 1 ? "s" : ""}
                      </span>
                      {e.duration && (
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <Clock size={12} /> {e.duration} min
                        </span>
                      )}
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Calendar size={12} /> {fmt(e.scheduledAt)}
                      </span>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: "right" }}>
                    {e.attemptStatus === "submitted" ? (
                      <div>
                        <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "#073543", lineHeight: 1 }}>
                          {e.score ?? "—"}<span style={{ fontSize: "var(--text-xs)", color: "#71787b", fontWeight: 400 }}>/{e.totalMarks}</span>
                        </div>
                        {pct !== null && (
                          <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: pct >= 50 ? "#10b981" : "#ef4444", marginTop: 2 }}>
                            {pct}%
                          </div>
                        )}
                        <div style={{ fontSize: "var(--text-xs)", color: "#10b981", marginTop: 2 }}>Submitted</div>
                      </div>
                    ) : e.attemptStatus === "in_progress" ? (
                      <Link href={`/student/exam/${e.id}`} style={{
                        display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px",
                        borderRadius: 10, border: "2px solid #f59e0b", background: "#fffbeb",
                        color: "#b45309", fontSize: "var(--text-xs)", fontWeight: 700, textDecoration: "none",
                      }}>
                        <Clock size={14} /> Resume
                      </Link>
                    ) : (
                      <Link href={`/student/exam/${e.id}`} style={{
                        display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 22px",
                        borderRadius: 10, border: "none", background: "#073543",
                        color: "#fff", fontSize: "var(--text-xs)", fontWeight: 700, textDecoration: "none",
                        boxShadow: "0 2px 6px rgba(7,53,67,0.25)",
                      }}>
                        <Play size={14} /> Start Exam
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Scheduled / offline exams */}
      {offline.length > 0 && (
        <section>
          <h2 style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#073543", marginBottom: 14 }}>
            Scheduled Exams
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {offline.map((e) => (
              <div key={e.id} style={{
                background: "#f8f9fa", borderRadius: 12, border: "1px solid #e2e8f0",
                padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
              }}>
                <Lock size={16} style={{ color: "#c1c7cb", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "#41484b" }}>{e.title}</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "#71787b" }}>
                    {e.subjectName} · {fmt(e.scheduledAt)}{e.totalMarks > 0 ? ` · ${e.totalMarks} pts` : ""}
                  </div>
                </div>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "#71787b", background: "#e2e8f0", padding: "3px 10px", borderRadius: 99 }}>
                  In Person
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
