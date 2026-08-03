"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Users, ClipboardList, TrendingUp, BarChart3, Star, Save, Send } from "lucide-react";
import { gradeFromScore, type GradeBand } from "@backend/utils";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import styles from "./MobileGradebookContent.module.css";

export interface MobileGradeRow {
  studentId: string;
  studentName: string;
  admNo: string;
  initials: string;
}
export interface MobileExistingGrade {
  studentId: string;
  subjectId: string;
  term: string;
  score: number;
  remarks?: string;
}

interface Props {
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string; code: string; classId: string }[];
  studentsByClass: Record<string, MobileGradeRow[]>;
  existingGrades: MobileExistingGrade[];
  gradingScale: GradeBand[];
}

const TERMS = ["Term 1", "Term 2", "Term 3"];
type Tab = "entry" | "summary";

export function MobileGradebookContent({ classes, subjects, studentsByClass, existingGrades, gradingScale }: Props) {
  const { showToast } = useToast();
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [subjectId, setSubjectId] = useState("");
  const [term, setTerm] = useState("Term 1");
  const [tab, setTab] = useState<Tab>("entry");
  const [scores, setScores] = useState<Record<string, { value: string; dirty: boolean }>>({});
  const [saving, setSaving] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  const classSubjects = useMemo(() => subjects.filter((s) => s.classId === classId), [subjects, classId]);
  const selectedClassName = classes.find((c) => c.id === classId)?.name ?? "this class";
  const selectedSubjectName = classSubjects.find((s) => s.id === subjectId)?.name ?? "this subject";
  const roster = useMemo(() => studentsByClass[classId] ?? [], [studentsByClass, classId]);

  useEffect(() => {
    setSubjectId(classSubjects[0]?.id ?? "");
  }, [classSubjects]);

  useEffect(() => {
    const next: Record<string, { value: string; dirty: boolean }> = {};
    roster.forEach((s) => {
      const match = existingGrades.find((g) => g.studentId === s.studentId && g.subjectId === subjectId && g.term === term);
      next[s.studentId] = { value: match ? String(match.score) : "", dirty: false };
    });
    setScores(next);
  }, [roster, subjectId, term, existingGrades]);

  function setScore(studentId: string, value: string) {
    setScores((prev) => ({ ...prev, [studentId]: { value, dirty: true } }));
  }

  const gradedScores = roster
    .map((s) => Number(scores[s.studentId]?.value))
    .filter((n) => Number.isFinite(n) && n >= 0);
  const classAvg = gradedScores.length ? Math.round(gradedScores.reduce((a, b) => a + b, 0) / gradedScores.length) : null;

  const distribution = useMemo(() => {
    const sorted = [...gradingScale].sort((a, b) => b.min - a.min);
    const counts = new Map(sorted.map((b) => [b.grade, 0]));
    gradedScores.forEach((score) => {
      const g = gradeFromScore(score, 100, gradingScale);
      counts.set(g, (counts.get(g) ?? 0) + 1);
    });
    const total = gradedScores.length || 1;
    return sorted.map((b) => ({ grade: b.grade, pct: Math.round(((counts.get(b.grade) ?? 0) / total) * 100), isFail: b.remark?.toLowerCase() === "fail" }));
  }, [gradedScores, gradingScale]);

  const topPerformer = useMemo(() => {
    type Best = { name: string; score: number };
    return roster.reduce<Best | null>((best, s) => {
      const v = Number(scores[s.studentId]?.value);
      if (!Number.isFinite(v)) return best;
      if (!best || v > best.score) return { name: s.studentName, score: v };
      return best;
    }, null);
  }, [roster, scores]);

  // Mirrors desktop GradebookContent's saveDraft(): both the plain "Save Draft"
  // button and the "Publish Now" confirm call this same save — the only
  // difference is Publish gates it behind a confirmation step first.
  async function saveDraft(successMessage: string) {
    if (!subjectId) { showToast("Select a subject first.", "error"); return; }
    const dirty = roster.filter((s) => scores[s.studentId]?.dirty && scores[s.studentId]?.value !== "");
    if (dirty.length === 0) { showToast("No changes to save."); return; }
    setSaving(true);
    try {
      const results = await Promise.allSettled(dirty.map((s) => {
        const score = Math.min(100, Math.max(0, Number(scores[s.studentId].value)));
        return fetch("/api/grades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: s.studentId, subjectId, term, score }),
        });
      }));
      const failed = results.filter((r) => r.status === "rejected").length;
      setScores((prev) => {
        const next = { ...prev };
        dirty.forEach((s) => { next[s.studentId] = { ...next[s.studentId], dirty: false }; });
        return next;
      });
      showToast(failed > 0 ? `Saved with ${failed} error(s).` : successMessage, failed > 0 ? "error" : "success");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublishConfirm() {
    await saveDraft("Grades published successfully.");
    setShowPublishModal(false);
  }

  return (
    <div className={styles.root}>
      <section className={styles.filterCard}>
        <div className={styles.filterRow}>
          <div className={styles.field}>
            <label>Class</label>
            <select className={styles.select} value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label>Subject</label>
            <select className={styles.select} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              {classSubjects.length === 0 && <option value="">No subjects</option>}
              {classSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div className={styles.field}>
          <label>Term</label>
          <select className={styles.select} value={term} onChange={(e) => setTerm(e.target.value)}>
            {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </section>

      <section className={styles.statsScroll}>
        <div className={styles.statChip}><Users size={16} /><span>Students</span><strong>{roster.length}</strong></div>
        <div className={styles.statChip}><ClipboardList size={16} /><span>Graded</span><strong>{gradedScores.length}</strong></div>
        <div className={styles.statChip}><TrendingUp size={16} /><span>Class Avg</span><strong>{classAvg !== null ? `${classAvg}%` : "—"}</strong></div>
      </section>

      <div className={styles.tabs}>
        <button type="button" className={`${styles.tab} ${tab === "entry" ? styles.tabActive : ""}`} onClick={() => setTab("entry")}>Entry</button>
        <button type="button" className={`${styles.tab} ${tab === "summary" ? styles.tabActive : ""}`} onClick={() => setTab("summary")}>Summary</button>
        <Link href="/gradebook/reports" className={styles.tab}>Reports</Link>
      </div>

      {tab === "entry" ? (
        <>
          <div className={styles.list}>
            {roster.length === 0 ? (
              <p className={styles.emptyText}>No students in this class.</p>
            ) : roster.map((s) => {
              const raw = scores[s.studentId]?.value ?? "";
              const numeric = raw === "" ? null : Number(raw);
              const grade = numeric !== null && Number.isFinite(numeric) ? gradeFromScore(numeric, 100, gradingScale) : null;
              return (
                <div key={s.studentId} className={styles.studentRow}>
                  <span className={styles.avatar}>{s.initials}</span>
                  <div className={styles.studentInfo}>
                    <p className={styles.studentName}>{s.studentName}</p>
                    <p className={styles.studentId}>ID: {s.admNo}</p>
                  </div>
                  <input
                    className={styles.scoreInput}
                    type="number"
                    min={0}
                    max={100}
                    placeholder="0-100"
                    value={raw}
                    onChange={(e) => setScore(s.studentId, e.target.value)}
                  />
                  <span className={styles.gradeBadge}>{grade ?? "—"}</span>
                </div>
              );
            })}
          </div>
          <div className={styles.footerRow}>
            <button type="button" className={styles.saveDraftBtn} onClick={() => saveDraft("Grades saved successfully.")} disabled={saving || !subjectId}>
              <Save size={16} /> {saving ? "Saving…" : "Save Draft"}
            </button>
            <button type="button" className={styles.publishBtn} onClick={() => setShowPublishModal(true)} disabled={saving || !subjectId}>
              <Send size={16} /> Publish
            </button>
          </div>

          <MobileSheet
            open={showPublishModal}
            onClose={() => setShowPublishModal(false)}
            title="Publish gradebook updates?"
            eyebrow="Publish Report"
            footer={<>
              <button type="button" className={kit.btnOutline} onClick={() => setShowPublishModal(false)} disabled={saving}>Cancel</button>
              <button type="button" className={kit.btnPrimary} onClick={handlePublishConfirm} disabled={saving}>{saving ? "Publishing…" : "Publish Now"}</button>
            </>}
          >
            <p className={kit.helperText}>
              This will publish the current scores for {selectedClassName} in {selectedSubjectName}.
            </p>
          </MobileSheet>
        </>
      ) : (
        <>
          <section className={styles.card}>
            <h3 className={styles.cardTitle}><BarChart3 size={16} /> Grade Distribution</h3>
            {distribution.length === 0 || gradedScores.length === 0 ? (
              <p className={styles.emptyText}>No grades entered yet.</p>
            ) : (
              <div className={styles.distList}>
                {distribution.map((d) => (
                  <div key={d.grade} className={styles.distRow}>
                    <span className={styles.distLabel}>{d.grade}</span>
                    <div className={styles.distTrack}><div className={`${styles.distFill} ${d.isFail ? styles.distFillBad : ""}`} style={{ width: `${d.pct}%` }} /></div>
                    <span className={styles.distPct}>{d.pct}%</span>
                  </div>
                ))}
              </div>
            )}
          </section>
          {topPerformer && (
            <section className={styles.card}>
              <h3 className={styles.cardTitle}><Star size={16} /> Top Performer</h3>
              <div className={styles.topRow}>
                <span className={styles.avatar}>{topPerformer.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}</span>
                <div>
                  <p className={styles.studentName}>{topPerformer.name}</p>
                  <p className={styles.topScore}>{topPerformer.score}% - {term}</p>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
