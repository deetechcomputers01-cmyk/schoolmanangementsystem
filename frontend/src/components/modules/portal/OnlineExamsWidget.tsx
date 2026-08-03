"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, CheckCircle2, Clock, Play } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface ExamEntry {
  id: string;
  title: string;
  subjectName: string;
  scheduledAt: string;
  duration: number | null;
  questionCount: number;
  totalMarks: number;
  attemptStatus: "not_started" | "in_progress" | "submitted";
  score: number | null;
}

export function OnlineExamsWidget() {
  const [exams, setExams] = useState<ExamEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/exams")
      .then((r) => r.ok ? r.json() : [])
      .then(setExams)
      .catch(() => setExams([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Card>
      <h2 className="mb-4 font-heading text-base font-semibold text-navy flex items-center gap-2">
        <ClipboardList size={16} /> Online Exams
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[1,2].map((i) => (
          <div key={i} style={{ height: 52, borderRadius: 12, background: "#f1f5f9", animation: "pulse 1.5s infinite" }} />
        ))}
      </div>
    </Card>
  );

  if (exams.length === 0) return (
    <Card>
      <h2 className="mb-3 font-heading text-base font-semibold text-navy flex items-center gap-2">
        <ClipboardList size={16} /> Online Exams
      </h2>
      <p style={{ fontSize: "var(--text-xs)", color: "#71787b", margin: 0 }}>No online exams assigned to your class yet.</p>
    </Card>
  );

  return (
    <Card>
      <h2 className="mb-4 font-heading text-base font-semibold text-navy flex items-center gap-2">
        <ClipboardList size={16} /> Online Exams
      </h2>
      <div className="space-y-3">
        {exams.map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-xl border border-line px-4 py-3 gap-3">
            <div className="min-w-0">
              <div className="font-semibold text-navy text-sm truncate">{e.title}</div>
              <div className="text-xs text-muted mt-0.5">
                {e.subjectName} · {e.questionCount} question{e.questionCount !== 1 ? "s" : ""}
                {e.duration ? ` · ${e.duration} min` : ""}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {e.attemptStatus === "submitted" ? (
                <div className="flex items-center gap-1.5 text-emerald text-xs font-semibold">
                  <CheckCircle2 size={14} />
                  {e.score !== null ? `${e.score}/${e.totalMarks}` : "Submitted"}
                </div>
              ) : e.attemptStatus === "in_progress" ? (
                <Link
                  href={`/student/exam/${e.id}`}
                  className="flex items-center gap-1.5 text-xs font-semibold text-amber rounded-lg border border-amber/30 px-3 py-1.5 hover:bg-amber/5 transition-colors"
                >
                  <Clock size={13} /> Resume
                </Link>
              ) : (
                <Link
                  href={`/student/exam/${e.id}`}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-navy rounded-lg px-3 py-1.5 hover:bg-navy/90 transition-colors"
                >
                  <Play size={13} /> Start
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
