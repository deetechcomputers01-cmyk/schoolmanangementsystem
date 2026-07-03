"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { gradeFromScore } from "@/lib/utils";

type Student = { id: string; firstName: string; lastName: string; admissionNo: string };
type ScoreMap = Record<string, { score: number | string; remarks: string }>;

type Props = {
  examId:         string;
  maxScore:       number;
  students:       Student[];
  existingScores: Record<string, { score: number; remarks: string }>;
  canScore:       boolean;
};

export function ScoreEntryClient({ examId, maxScore, students, existingScores, canScore }: Props) {
  const [scores, setScores] = useState<ScoreMap>(() => {
    const init: ScoreMap = {};
    for (const s of students) {
      init[s.id] = existingScores[s.id]
        ? { score: existingScores[s.id].score, remarks: existingScores[s.id].remarks }
        : { score: "", remarks: "" };
    }
    return init;
  });

  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const set = (studentId: string, field: "score" | "remarks", value: string) => {
    setScores((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true); setError(null);
    const payload = students
      .filter((s) => scores[s.id]?.score !== "")
      .map((s) => ({
        studentId: s.id,
        score:     parseFloat(String(scores[s.id].score)),
        remarks:   scores[s.id].remarks || undefined
      }));

    if (payload.length === 0) { setSaving(false); setError("Enter at least one score."); return; }

    const res = await fetch(`/api/exams/${examId}/scores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scores: payload })
    });
    setSaving(false);
    if (res.ok) setSaved(true);
    else { const j = await res.json(); setError(j.error ?? "Failed to save scores"); }
  };

  const filledCount = students.filter((s) => scores[s.id]?.score !== "").length;

  return (
    <div>
      {error && (
        <div className="mx-6 mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{error}</div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted">
            <tr>
              <th className="px-6 py-3">#</th>
              <th className="px-6 py-3">Student</th>
              <th className="px-6 py-3">Admission No</th>
              <th className="px-6 py-3">Score /{maxScore}</th>
              <th className="px-6 py-3">Grade</th>
              <th className="px-6 py-3">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {students.map((student, i) => {
              const raw   = scores[student.id]?.score;
              const score = raw !== "" ? parseFloat(String(raw)) : null;
              const grade = score !== null && !isNaN(score) ? gradeFromScore(score, maxScore) : null;
              return (
                <tr key={student.id} className="transition hover:bg-slate-50/50">
                  <td className="px-6 py-3 text-muted">{i + 1}</td>
                  <td className="px-6 py-3 font-semibold text-navy">
                    {student.firstName} {student.lastName}
                  </td>
                  <td className="font-data px-6 py-3 text-muted">{student.admissionNo}</td>
                  <td className="px-6 py-3">
                    {canScore ? (
                      <input
                        type="number" min="0" max={maxScore} step="0.5"
                        value={scores[student.id]?.score ?? ""}
                        onChange={(e) => set(student.id, "score", e.target.value)}
                        placeholder="—"
                        className="focus-ring w-24 rounded-lg border border-line px-3 py-1.5 text-sm font-data"
                      />
                    ) : (
                      <span className="font-data font-semibold text-navy">{raw !== "" ? raw : "—"}</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {grade ? (
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        ["A1","B2","B3"].includes(grade) ? "bg-emerald/10 text-emerald"
                        : ["C4","C5","C6"].includes(grade) ? "bg-amber/10 text-amber"
                        : "bg-rose-50 text-rose-600"
                      }`}>{grade}</span>
                    ) : <span className="text-muted">—</span>}
                  </td>
                  <td className="px-6 py-3">
                    {canScore ? (
                      <input
                        type="text" maxLength={120}
                        value={scores[student.id]?.remarks ?? ""}
                        onChange={(e) => set(student.id, "remarks", e.target.value)}
                        placeholder="Optional remark"
                        className="focus-ring w-44 rounded-lg border border-line px-3 py-1.5 text-sm"
                      />
                    ) : (
                      <span className="text-muted">{scores[student.id]?.remarks || "—"}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {canScore && (
        <div className="flex items-center justify-between border-t border-line px-6 py-4">
          <p className="text-sm text-muted">{filledCount} of {students.length} scores entered</p>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald">
                <CheckCircle2 size={16} /> Scores saved
              </span>
            )}
            <button
              onClick={save} disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy/80 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save All Scores
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
