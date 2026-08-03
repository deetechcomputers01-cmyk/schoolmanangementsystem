"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ClipboardCheck,
  Save,
  Search,
  Send,
  Settings,
  Trophy,
  BookOpen,
  FileText,
  MessageSquare,
  X,
} from "lucide-react";
import { DesktopPageFrame } from "@/components/desktop/layout/DesktopPageFrame/DesktopPageFrame";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { gradeFromScore, type GradeBand } from "@backend/utils";
import styles from "./GradebookScreen.module.css";

export interface GradeRow {
  studentId: string;
  studentName: string;
  admNo: string;
  initials: string;
}

export interface ExistingGrade {
  studentId: string;
  subjectId: string;
  term: string;
  score: number;
  remarks?: string;
}

export interface GradebookProps {
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string; code: string; classId: string }[];
  studentsByClass: Record<string, GradeRow[]>;
  existingGrades: ExistingGrade[];
  gradingScale: GradeBand[];
}

type ScoreEntry = { class: string; exam: string; dirty: boolean };

const TERMS = ["Term 1", "Term 2", "Term 3"];
const ASSESSMENT_TYPES = ["Mid-Term", "End of Term", "Continuous Assessment"];

function letterFor(total: number | null, scale: GradeBand[]) {
  if (total === null) return "—";
  return gradeFromScore(total, 100, scale);
}

function gradeClass(letter: string) {
  if (["A1"].includes(letter)) return styles.gradeA;
  if (["B2", "B3"].includes(letter)) return styles.gradeB;
  if (["C4", "C5", "C6"].includes(letter)) return styles.gradeC;
  if (["D7", "E8"].includes(letter)) return styles.gradeD;
  if (letter === "F9") return styles.gradeF;
  return styles.gradeMuted;
}

export function GradebookContent({
  classes,
  subjects,
  studentsByClass,
  existingGrades,
  gradingScale,
}: GradebookProps) {
  const router = useRouter();

  const [selectedClass, setSelectedClass] = useState(classes[0]?.id ?? "");
  const [term, setTerm] = useState("Term 1");
  const [assessmentType, setAssessmentType] = useState("Mid-Term");
  const [searchTerm, setSearchTerm] = useState("");

  const classSubjects = useMemo(
    () => subjects.filter((subject) => subject.classId === selectedClass),
    [selectedClass, subjects],
  );

  const [selectedSubject, setSelectedSubject] = useState(classSubjects[0]?.id ?? "");

  useEffect(() => {
    setSelectedSubject(classSubjects[0]?.id ?? "");
  }, [classSubjects]);

  const students = useMemo(
    () => studentsByClass[selectedClass] ?? [],
    [selectedClass, studentsByClass],
  );

  const visibleStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student) =>
      student.studentName.toLowerCase().includes(query) ||
      student.admNo.toLowerCase().includes(query),
    );
  }, [searchTerm, students]);

  const [scores, setScores] = useState<Record<string, ScoreEntry>>({});
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast: showToastFn } = useToast();
  const [showPublishModal, setShowPublishModal] = useState(false);

  useEffect(() => {
    const next: Record<string, ScoreEntry> = {};

    students.forEach((student) => {
      const match = existingGrades
        .filter((grade) => grade.studentId === student.studentId && grade.subjectId === selectedSubject && grade.term === term)
        .sort((left, right) => right.score - left.score)[0];

      if (match) {
        const classScore = Math.round(match.score * 0.3);
        const examScore = Math.max(0, match.score - classScore);
        next[student.studentId] = { class: String(classScore), exam: String(examScore), dirty: false };
      } else {
        next[student.studentId] = { class: "", exam: "", dirty: false };
      }
    });

    setScores(next);
    setFocusedId(students[0]?.studentId ?? null);
    setRemark("");
  }, [existingGrades, selectedSubject, students, term]);

  function hasRemark(studentId: string) {
    if (focusedId === studentId && remark.trim()) return true;
    return existingGrades.some(
      (grade) => grade.studentId === studentId && grade.subjectId === selectedSubject && grade.term === term && !!grade.remarks?.trim(),
    );
  }

  function updateScore(studentId: string, field: "class" | "exam", value: string) {
    setScores((current) => ({
      ...current,
      [studentId]: { ...current[studentId], [field]: value, dirty: true },
    }));
  }

  function getTotal(entry: ScoreEntry | undefined): number | null {
    if (!entry) return null;
    const classScore = parseInt(entry.class, 10);
    const examScore = parseInt(entry.exam, 10);

    if (Number.isNaN(classScore) && Number.isNaN(examScore)) return null;
    return (Number.isNaN(classScore) ? 0 : classScore) + (Number.isNaN(examScore) ? 0 : examScore);
  }

  function isFieldInvalid(entry: ScoreEntry | undefined, field: "class" | "exam") {
    if (!entry || entry[field] === "") return false;
    const value = parseInt(entry[field], 10);
    const max = field === "class" ? 30 : 70;
    return Number.isNaN(value) || value < 0 || value > max;
  }

  const hasUnsaved = Object.values(scores).some((score) => score.dirty);

  const totals = students
    .map((student) => getTotal(scores[student.studentId]))
    .filter((total): total is number => total !== null);

  const classAvg = totals.length > 0
    ? Math.round(totals.reduce((sum, total) => sum + total, 0) / totals.length)
    : null;
  const highestScore = totals.length > 0 ? Math.max(...totals) : null;
  const missingCount = students.filter((student) => {
    const entry = scores[student.studentId];
    return !entry || (entry.class === "" && entry.exam === "");
  }).length;
  const readinessPct = students.length === 0 ? 0 : Math.round(((students.length - missingCount) / students.length) * 100);

  const toast = useCallback((message: string, isError = false) => {
    showToastFn(message, isError ? "error" : "success");
  }, [showToastFn]);

  async function saveDraft() {
    if (!selectedSubject || saving) return;

    setSaving(true);
    try {
      const dirtyStudents = students.filter((student) => {
        const entry = scores[student.studentId];
        return entry?.dirty && (entry.class !== "" || entry.exam !== "");
      });

      const results = await Promise.allSettled(dirtyStudents.map((student) => {
        const entry = scores[student.studentId];
        const total = getTotal(entry);

        if (total === null) return Promise.resolve();

        return fetch("/api/grades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: student.studentId,
            subjectId: selectedSubject,
            term,
            score: Math.min(100, Math.max(0, total)),
            remarks: remark || undefined,
          }),
        });
      }));

      const failed = results.filter((result) => result.status === "rejected").length;
      if (failed > 0) throw new Error("Some saves failed");

      setScores((current) => {
        const next = { ...current };
        Object.keys(next).forEach((key) => {
          next[key] = { ...next[key], dirty: false };
        });
        return next;
      });

      toast("Draft saved successfully.");
      router.refresh();
    } catch {
      toast("Failed to save. Please try again.", true);
    } finally {
      setSaving(false);
    }
  }

  function discardChanges() {
    setScores((current) => {
      const next = { ...current };
      Object.keys(next).forEach((key) => {
        next[key] = { ...next[key], dirty: false };
      });
      return next;
    });
  }

  const focusedStudent = students.find((student) => student.studentId === focusedId);
  const focusedEntry = focusedId ? scores[focusedId] : undefined;
  const focusedTotal = getTotal(focusedEntry);
  const focusedGrade = letterFor(focusedTotal, gradingScale);
  const selectedSubjectName = classSubjects.find((subject) => subject.id === selectedSubject)?.name ?? "—";
  const selectedClassName = classes.find((schoolClass) => schoolClass.id === selectedClass)?.name ?? "—";

  return (
    <DesktopPageFrame
      title="Gradebook"
      subtitle="Enter marks and publish term reports."
      variant="standard"
      action={(
        <div className={styles.headerActions}>
          <Link className={styles.btnOutline} href="/report-cards">
            <FileText size={16} />
            Report Cards
          </Link>
          <button
            className={styles.btnOutline}
            disabled={saving || !hasUnsaved || !selectedSubject}
            onClick={saveDraft}
            type="button"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            className={styles.btnPrimary}
            disabled={!selectedSubject}
            onClick={() => setShowPublishModal(true)}
            type="button"
          >
            <Send size={16} />
            Publish
          </button>
        </div>
      )}
    >
      <div className={styles.root}>
        <div className={styles.filterCard}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Class</label>
              <select className={styles.filterSelect} value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)}>
                {classes.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Term</label>
              <select className={styles.filterSelect} value={term} onChange={(event) => setTerm(event.target.value)}>
                {TERMS.map((currentTerm) => (
                  <option key={currentTerm} value={currentTerm}>{currentTerm}</option>
                ))}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Assessment Type</label>
              <select className={styles.filterSelect} value={assessmentType} onChange={(event) => setAssessmentType(event.target.value)}>
                {ASSESSMENT_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Subject</label>
              <select className={styles.filterSelect} value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value)}>
                {classSubjects.length === 0
                  ? <option value="">No subjects</option>
                  : classSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}><BookOpen size={16} /></span>
            <span className={styles.statLabel}>Class Average</span>
            <span className={styles.statValue}>{classAvg !== null ? `${classAvg}%` : "—"}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}><Trophy size={16} /></span>
            <span className={styles.statLabel}>Highest Score</span>
            <span className={styles.statValue}>{highestScore !== null ? `${highestScore}` : "—"}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}><AlertTriangle size={16} /></span>
            <span className={styles.statLabel}>Missing Entries</span>
            <span className={styles.statValue}>{missingCount}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}><ClipboardCheck size={16} /></span>
            <span className={styles.statLabel}>Publish Readiness</span>
            <div className={styles.publishedRow}>
              <span className={styles.statValue}>{readinessPct}%</span>
              <div className={styles.publishBar}>
                <div className={styles.publishBarFill} style={{ width: `${readinessPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.splitSection}>
          <div className={styles.tableCard}>
            {hasUnsaved && (
              <div className={styles.unsavedBanner}>
                <div className={styles.unsavedLeft}>
                  <AlertTriangle size={15} />
                  <span>You have unsaved changes</span>
                </div>
                <div className={styles.unsavedRight}>
                  <button className={styles.unsavedDiscard} onClick={discardChanges} type="button">Discard</button>
                  <button className={styles.unsavedSave} onClick={saveDraft} type="button">Save Draft</button>
                </div>
              </div>
            )}

            <div className={styles.tableHeader}>
              <h2 className={styles.tableTitle}>Student Roster ({students.length})</h2>
              <div className={styles.searchField}>
                <Search size={14} />
                <input
                  className={styles.searchInput}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search student..."
                  type="search"
                  value={searchTerm}
                />
              </div>
            </div>

            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead className={styles.thead}>
                  <tr>
                    <th className={styles.thAvatar} />
                    <th className={styles.th}>Student</th>
                    <th className={styles.th}>ADM No.</th>
                    <th className={styles.th}>Class (30)</th>
                    <th className={styles.th}>Exam (70)</th>
                    <th className={styles.th}>Total</th>
                    <th className={styles.th}>Grade</th>
                    <th className={styles.th}>RMK</th>
                    <th className={styles.thAction} />
                  </tr>
                </thead>
                <tbody>
                  {visibleStudents.length === 0 && (
                    <tr>
                      <td colSpan={9} className={styles.emptyCell}>No students in this class</td>
                    </tr>
                  )}

                  {visibleStudents.map((student) => {
                    const entry = scores[student.studentId];
                    const total = getTotal(entry);
                    const grade = letterFor(total, gradingScale);
                    const classInvalid = isFieldInvalid(entry, "class");
                    const examInvalid = isFieldInvalid(entry, "exam");
                    const isMissing = !entry || (entry.class === "" && entry.exam === "");
                    const isFocused = focusedId === student.studentId;

                    return (
                      <tr
                        key={student.studentId}
                        className={`${styles.tr} ${isMissing ? styles.trMissing : ""} ${isFocused ? styles.trFocused : ""}`}
                        onClick={() => setFocusedId(student.studentId)}
                      >
                        <td className={styles.tdAvatar}>
                          <div className={styles.avatar}>{student.initials}</div>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.studentName}>{student.studentName}</span>
                        </td>
                        <td className={`${styles.td} ${styles.tdMuted}`}>{student.admNo}</td>
                        <td className={styles.tdInput} onClick={(event) => event.stopPropagation()}>
                          <div className={styles.inputWrap}>
                            <input
                              className={`${styles.scoreInput} ${classInvalid ? styles.scoreInputError : ""}`}
                              max={30}
                              min={0}
                              onChange={(event) => updateScore(student.studentId, "class", event.target.value)}
                              onFocus={() => setFocusedId(student.studentId)}
                              placeholder="—"
                              type="number"
                              value={entry?.class ?? ""}
                            />
                            {classInvalid && <span className={styles.errorTip}>Max 30</span>}
                          </div>
                        </td>
                        <td className={styles.tdInput} onClick={(event) => event.stopPropagation()}>
                          <div className={styles.inputWrap}>
                            <input
                              className={`${styles.scoreInput} ${examInvalid ? styles.scoreInputError : ""}`}
                              max={70}
                              min={0}
                              onChange={(event) => updateScore(student.studentId, "exam", event.target.value)}
                              onFocus={() => setFocusedId(student.studentId)}
                              placeholder="—"
                              type="number"
                              value={entry?.exam ?? ""}
                            />
                            {examInvalid && <span className={styles.errorTip}>Max 70</span>}
                          </div>
                        </td>
                        <td className={`${styles.td} ${styles.tdBold}`}>{total !== null ? total : "—"}</td>
                        <td className={`${styles.td} ${styles.tdBold} ${gradeClass(grade)}`}>{grade}</td>
                        <td className={`${styles.td} ${styles.tdRemark}`}>
                          <MessageSquare
                            size={16}
                            className={hasRemark(student.studentId) ? styles.remarkIconFilled : styles.remarkIconEmpty}
                            fill={hasRemark(student.studentId) ? "currentColor" : "none"}
                          />
                        </td>
                        <td className={styles.tdAction}>
                          <button className={styles.moreBtn} onClick={(event) => event.stopPropagation()} type="button">...</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.sideCard}>
              <div className={styles.sideCardHeader}>
                <h3 className={styles.sideCardTitle}>Student Focus</h3>
                <button className={styles.iconBtn} type="button">
                  <Settings size={16} />
                </button>
              </div>

              {focusedStudent ? (
                <div className={styles.previewCard}>
                  <div className={styles.previewHeader}>
                    <div className={styles.previewIdentity}>
                      <span className={styles.previewAvatar}>{focusedStudent.initials}</span>
                      <div>
                        <h3 className={styles.previewName}>{focusedStudent.studentName}</h3>
                        <span className={styles.previewMeta}>{focusedStudent.admNo}</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.previewBody}>
                    <div className={styles.previewBreakdown}>
                      <div className={styles.previewMetric}>
                        <span className={styles.previewLabel}>Class Score (30%)</span>
                        <div className={styles.previewLine}>
                          <div className={styles.previewBar}>
                            <span style={{ width: `${Math.min(100, ((Number(focusedEntry?.class) || 0) / 30) * 100)}%` }} />
                          </div>
                          <strong>{focusedEntry?.class || "0"} / 30</strong>
                        </div>
                      </div>
                      <div className={styles.previewMetric}>
                        <span className={styles.previewLabel}>Exam Score (70%)</span>
                        <div className={styles.previewLine}>
                          <div className={styles.previewBar}>
                            <span style={{ width: `${Math.min(100, ((Number(focusedEntry?.exam) || 0) / 70) * 100)}%` }} />
                          </div>
                          <strong>{focusedEntry?.exam || "0"} / 70</strong>
                        </div>
                      </div>
                    </div>

                    <div className={styles.previewScoreRow}>
                      <div>
                        <span className={styles.previewLabel}>Total</span>
                        <div className={styles.previewScoreValue}>{focusedTotal !== null ? focusedTotal : "—"}</div>
                      </div>
                      <div>
                        <span className={styles.previewLabel}>Grade</span>
                        <div className={`${styles.previewGrade} ${gradeClass(focusedGrade)}`}>{focusedGrade}</div>
                      </div>
                    </div>

                    <div className={styles.previewRemarkGroup}>
                      <label className={styles.previewLabel}>Teacher&apos;s Remark</label>
                      <textarea
                        className={styles.previewRemark}
                        onChange={(event) => setRemark(event.target.value)}
                        placeholder="Add teacher remark..."
                        value={remark}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.previewCard}>
                  <div className={styles.previewScoreRow}>
                    <div>
                      <span className={styles.previewLabel}>Class</span>
                      <div className={styles.previewMiniValue}>{selectedClassName}</div>
                    </div>
                    <div>
                      <span className={styles.previewLabel}>Subject</span>
                      <div className={styles.previewMiniValue}>{selectedSubjectName}</div>
                    </div>
                  </div>
                  <p className={styles.emptyPanelCopy}>Select a student from the roster to review score breakdown and remarks.</p>
                </div>
              )}
            </div>
          </aside>
        </div>

        {showPublishModal && (
          <div className={`${styles.modalOverlay} desktopOnly`} role="presentation">
            <div className={styles.modalCard} role="dialog" aria-modal="true" aria-labelledby="gradebook-publish-title">
              <div className={styles.modalHeader}>
                <div>
                  <p className={styles.modalEyebrow}>Publish Report</p>
                  <h2 className={styles.modalTitle} id="gradebook-publish-title">Publish gradebook updates?</h2>
                </div>
                <button className={styles.modalClose} onClick={() => setShowPublishModal(false)} type="button">
                  <X size={18} />
                </button>
              </div>
              <p className={styles.modalCopy}>
                This will publish the current scores for {selectedClassName} in {selectedSubjectName}.
              </p>
              <div className={styles.modalActions}>
                <button className={styles.btnCancel} onClick={() => setShowPublishModal(false)} type="button">Cancel</button>
                <button
                  className={styles.btnPrimary}
                  onClick={async () => {
                    await saveDraft();
                    setShowPublishModal(false);
                    toast("Grades published successfully.");
                  }}
                  type="button"
                >
                  Publish Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DesktopPageFrame>
  );
}
