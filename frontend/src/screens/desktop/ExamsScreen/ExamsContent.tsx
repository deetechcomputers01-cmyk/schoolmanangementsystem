"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Plus, Download, Search, ClipboardList, Calendar, BookOpen,
  Users, AlertTriangle, CheckCircle2, X, ChevronRight,
  Clock, Wifi, FileUp, Trash2,
  ToggleLeft, ToggleRight, Pencil, Check,
  ChevronDown, ChevronLeft, Lightbulb, TrendingUp, ListChecks,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import styles from "./ExamsScreen.module.css";

// ── Types ──────────────────────────────────────────────────────────────────────
interface ExamRow {
  id: string;
  title: string;
  className: string;
  classId: string;
  subjectName: string;
  subjectId: string;
  termName: string | null;
  termId: string | null;
  scheduledAt: string;
  maxScore: number;
  questionTotalMarks: number;
  scoredCount: number;
  isOnline: boolean;
  duration: number | null;
  status: "scored" | "pending";
  upcoming: boolean;
}

interface ExamQuestion {
  id: string;
  order: number;
  text: string;
  type: string;
  options: string[] | null;
  correctAnswer: string | null;
  marks: number;
}

interface AttemptRow {
  id: string;
  student: { firstName: string; lastName: string; admissionNo: string };
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
}
interface GradingAnswerRow {
  questionId: string;
  order: number;
  text: string;
  type: string;
  marks: number;
  correctAnswer: string | null;
  answer: string | null;
  isCorrect: boolean | null;
  marksAwarded: number;
}
interface ScoreRosterRow {
  studentId: string;
  name: string;
  admissionNo: string;
  score: number | null;
  remarks: string | null;
}
interface ClassOption   { id: string; name: string; level: string }
interface SubjectOption { id: string; name: string; code: string; classId: string | null; teacherName: string | null }
interface TermOption    { id: string; name: string }
interface Stats {
  total: number; scored: number; pending: number; upcoming: number;
  termName: string; yearName: string;
}
interface RecentPerformance {
  examTitle: string; className: string; avg: number; high: number; low: number; passRate: number;
}
interface TermPassRate { current: number; previous: number | null }
interface Props {
  exams: ExamRow[];
  stats: Stats;
  classOptions: ClassOption[];
  subjectOptions: SubjectOption[];
  termOptions: TermOption[];
  initialExamId?: string;
  recentPerformance: RecentPerformance | null;
  termPassRate: TermPassRate | null;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + " · " +
    new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function exportExamsCSV(rows: ExamRow[]) {
  const headers = ["Title","Class","Subject","Term","Date","Max Score","Scored","Status"];
  const csvRows = [
    headers.join(","),
    ...rows.map((e) => [
      `"${e.title}"`, `"${e.className}"`, `"${e.subjectName}"`,
      e.termName ?? "", fmt(e.scheduledAt), e.maxScore, e.scoredCount, e.status,
    ].join(",")),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "exams.csv"; a.click();
  URL.revokeObjectURL(url);
}

export function ExamsContent({ exams, stats, classOptions, subjectOptions, termOptions, initialExamId, recentPerformance, termPassRate }: Props) {
  const displayExams = exams;
  const displayStats = stats;

  const [search,        setSearch]       = useState("");
  const [classFilter,   setClassFilter]  = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [selectedId,    setSelectedId]   = useState<string>(initialExamId ?? "");
  const [detailOpen,    setDetailOpen]   = useState(!!initialExamId);
  const [showModal,     setShowModal]     = useState(false);
  const { showToast: showToastFn } = useToast();

  // Detail panel tab
  const [detailTab, setDetailTab] = useState<"info" | "questions" | "scores" | "results">("info");

  // Online exam state (per selected exam — live from DB)
  const [onlineMap,   setOnlineMap]   = useState<Record<string, boolean>>({});
  const [durationMap, setDurationMap] = useState<Record<string, number | null>>({});
  const [togglingId,  setTogglingId]  = useState<string | null>(null);

  // Questions state
  const [questions,       setQuestions]       = useState<ExamQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [showAddQ,        setShowAddQ]        = useState(false);
  const [qText,           setQText]           = useState("");
  const [qType,           setQType]           = useState<"mcq" | "short_answer">("mcq");
  const [qOptions,        setQOptions]        = useState(["", "", "", ""]);
  const [qCorrect,        setQCorrect]        = useState("A");
  const [qMarks,          setQMarks]          = useState("1");
  const [addingQ,         setAddingQ]         = useState(false);
  const [deletingQId,     setDeletingQId]     = useState<string | null>(null);
  const [savedBadge,      setSavedBadge]      = useState<string | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Preview overlay state
  const [showPreview,  setShowPreview]  = useState(false);
  const [editingQId,   setEditingQId]   = useState<string | null>(null);
  const [editText,     setEditText]     = useState("");
  const [editOptions,  setEditOptions]  = useState(["", "", "", ""]);
  const [editCorrect,  setEditCorrect]  = useState("A");
  const [editMarks,    setEditMarks]    = useState("1");
  const [editType,     setEditType]     = useState<"mcq" | "short_answer">("mcq");
  const [savingEdit,   setSavingEdit]   = useState(false);

  // Attempts/results state
  const [attempts,         setAttempts]         = useState<AttemptRow[]>([]);
  const [attemptsLoading,  setAttemptsLoading]  = useState(false);

  // Grading state
  const [gradingAttemptId, setGradingAttemptId] = useState<string | null>(null);
  const [gradingRows,      setGradingRows]      = useState<GradingAnswerRow[]>([]);
  const [gradingLoading,   setGradingLoading]   = useState(false);
  const [gradingSaving,    setGradingSaving]    = useState(false);

  // Score entry (paper exams) state
  const [scoreRoster,   setScoreRoster]   = useState<ScoreRosterRow[]>([]);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [scoresSaving,  setScoresSaving]  = useState(false);
  const [scoresMax,     setScoresMax]     = useState(100);

  // Modal form state
  const [mTitle,    setMTitle]    = useState("");
  const [mClassId,  setMClassId]  = useState("");
  const [mSubjId,   setMSubjId]   = useState("");
  const [mTermId,   setMTermId]   = useState("");
  const [mDate,     setMDate]     = useState("");
  const [mMax,      setMMax]      = useState("100");
  const [mOnline,   setMOnline]   = useState(false);
  const [mDuration, setMDuration] = useState("");

  // Load questions for selected exam
  useEffect(() => {
    if (!selectedId || !detailOpen || detailTab !== "questions") return;
    setQuestionsLoading(true);
    fetch(`/api/exams/${selectedId}/questions`)
      .then((r) => r.ok ? r.json() : [])
      .then(setQuestions)
      .catch(() => setQuestions([]))
      .finally(() => setQuestionsLoading(false));
  }, [selectedId, detailOpen, detailTab]);

  // Load attempts for selected exam
  useEffect(() => {
    if (!selectedId || !detailOpen || detailTab !== "results") return;
    setAttemptsLoading(true);
    fetch(`/api/exams/${selectedId}/attempts`)
      .then((r) => r.ok ? r.json() : [])
      .then(setAttempts)
      .catch(() => setAttempts([]))
      .finally(() => setAttemptsLoading(false));
  }, [selectedId, detailOpen, detailTab]);

  // Load score roster for selected exam
  useEffect(() => {
    if (!selectedId || !detailOpen || detailTab !== "scores") return;
    setScoresLoading(true);
    fetch(`/api/exams/${selectedId}/scores`)
      .then((r) => r.ok ? r.json() : { roster: [], maxScore: 100 })
      .then((data: { roster: ScoreRosterRow[]; maxScore: number }) => {
        setScoreRoster(data.roster ?? []);
        setScoresMax(data.maxScore ?? 100);
      })
      .catch(() => setScoreRoster([]))
      .finally(() => setScoresLoading(false));
  }, [selectedId, detailOpen, detailTab]);

  function openGrading(attemptId: string) {
    if (!selectedId) return;
    setGradingAttemptId(attemptId);
    setGradingLoading(true);
    setGradingRows([]);
    fetch(`/api/exams/${selectedId}/attempts/${attemptId}/answers`)
      .then((r) => r.ok ? r.json() : [])
      .then(setGradingRows)
      .catch(() => setGradingRows([]))
      .finally(() => setGradingLoading(false));
  }

  function updateGradingMarks(questionId: string, marksAwarded: number) {
    setGradingRows((prev) => prev.map((r) => (r.questionId === questionId ? { ...r, marksAwarded } : r)));
  }

  async function saveGrading() {
    if (!selectedId || !gradingAttemptId) return;
    setGradingSaving(true);
    try {
      const res = await fetch(`/api/exams/${selectedId}/attempts/${gradingAttemptId}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grades: gradingRows.map((r) => ({ questionId: r.questionId, marksAwarded: r.marksAwarded })) }),
      });
      if (res.ok) {
        const data = await res.json();
        setAttempts((prev) => prev.map((a) => (a.id === gradingAttemptId ? { ...a, score: data.score } : a)));
        setGradingAttemptId(null);
      }
    } finally {
      setGradingSaving(false);
    }
  }

  function updateScoreValue(studentId: string, value: string) {
    setScoreRoster((prev) => prev.map((r) => r.studentId === studentId ? { ...r, score: value === "" ? null : Number(value) } : r));
  }

  async function saveScores() {
    if (!selectedId) return;
    const toSave = scoreRoster.filter((r) => r.score !== null);
    if (toSave.length === 0) { toast("Enter at least one score first."); return; }
    setScoresSaving(true);
    try {
      const res = await fetch(`/api/exams/${selectedId}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: toSave.map((r) => ({ studentId: r.studentId, score: r.score })) }),
      });
      if (res.ok) {
        toast(`Saved scores for ${toSave.length} student${toSave.length !== 1 ? "s" : ""}`);
        window.location.reload();
      } else {
        const data = await res.json().catch(() => ({}));
        toast((data as { error?: string }).error ?? "Failed to save scores");
      }
    } finally {
      setScoresSaving(false);
    }
  }

  async function toggleOnline(examId: string, currentlyOnline: boolean) {
    if (togglingId) return;
    setTogglingId(examId);
    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: !currentlyOnline }),
      });
      if (res.ok) {
        setOnlineMap((prev) => ({ ...prev, [examId]: !currentlyOnline }));
        toast(`Exam ${!currentlyOnline ? "published online" : "taken offline"}`);
      }
    } finally {
      setTogglingId(null);
    }
  }

  async function saveDuration(examId: string, val: string) {
    const dur = val ? parseInt(val, 10) : null;
    setDurationMap((prev) => ({ ...prev, [examId]: dur }));
    await fetch(`/api/exams/${examId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duration: dur }),
    });
  }

  async function addQuestion() {
    if (!qText.trim() || addingQ) return;
    setAddingQ(true);
    try {
      const body: Record<string, unknown> = { text: qText.trim(), type: qType, marks: parseFloat(qMarks) || 1 };
      if (qType === "mcq") {
        body.options = qOptions.map((o) => o.trim()).filter(Boolean);
        body.correctAnswer = qCorrect;
      }
      const res = await fetch(`/api/exams/${selectedId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const q = await res.json();
        setQuestions((prev) => [...prev, q]);
        setQText(""); setQOptions(["", "", "", ""]); setQCorrect("A"); setQMarks("1");
        setShowAddQ(false);
        showSavedBadge("Question saved to database");
      }
    } finally {
      setAddingQ(false);
    }
  }

  async function deleteQuestion(qid: string) {
    if (deletingQId) return;
    setDeletingQId(qid);
    try {
      const res = await fetch(`/api/exams/${selectedId}/questions/${qid}`, { method: "DELETE" });
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== qid));
        toast("Question removed");
      }
    } finally {
      setDeletingQId(null);
    }
  }

  async function importCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const res = await fetch(`/api/exams/${selectedId}/questions/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: text }),
    });
    if (res.ok) {
      const data = await res.json();
      const qRes = await fetch(`/api/exams/${selectedId}/questions`);
      if (qRes.ok) {
        const loaded = await qRes.json();
        setQuestions(loaded);
        showSavedBadge(`${data.imported} question${data.imported !== 1 ? "s" : ""} saved to database`);
      }
    }
    if (csvInputRef.current) csvInputRef.current.value = "";
  }

  function showSavedBadge(msg: string) {
    setSavedBadge(msg);
    setTimeout(() => setSavedBadge(null), 6000);
  }

  function openEditInPreview(q: ExamQuestion) {
    setEditingQId(q.id);
    setEditText(q.text);
    setEditType(q.type as "mcq" | "short_answer");
    setEditCorrect(q.correctAnswer ?? "A");
    setEditMarks(String(q.marks));
    const opts = (q.options as string[] | null) ?? [];
    setEditOptions([opts[0] ?? "", opts[1] ?? "", opts[2] ?? "", opts[3] ?? ""]);
  }

  async function saveEditInPreview() {
    if (!editingQId || !editText.trim()) return;
    setSavingEdit(true);
    try {
      const options = editType === "mcq" ? editOptions.map((o) => o.trim()).filter(Boolean) : null;
      const res = await fetch(`/api/exams/${selectedId}/questions/${editingQId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editText.trim(), type: editType, options, correctAnswer: editType === "mcq" ? editCorrect : null, marks: parseFloat(editMarks) || 1 }),
      });
      if (res.ok) {
        setQuestions((prev) => prev.map((q) =>
          q.id === editingQId
            ? { ...q, text: editText.trim(), type: editType, options: options ?? null, correctAnswer: editType === "mcq" ? editCorrect : null, marks: parseFloat(editMarks) || 1 }
            : q
        ));
        setEditingQId(null);
        showSavedBadge("Question updated");
      }
    } finally { setSavingEdit(false); }
  }

  function toast(msg: string) {
    showToastFn(msg);
  }

  const filtered = useMemo(() => displayExams.filter((e) => {
    if (classFilter && e.classId !== classFilter) return false;
    if (subjectFilter && e.subjectId !== subjectFilter) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) &&
        !e.subjectName.toLowerCase().includes(search.toLowerCase()) &&
        !e.className.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [displayExams, classFilter, subjectFilter, search]);

  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageExams = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectedExam = displayExams.find((e) => e.id === selectedId) ?? null;

  function openDetail(examId: string, tab: "info" | "questions" | "scores" | "results") {
    setSelectedId(examId);
    setDetailTab(tab);
    setDetailOpen(true);
  }

  async function saveExam() {
    if (!mTitle || !mClassId || !mSubjId || !mDate) return;
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: mTitle,
          classId: mClassId,
          subjectId: mSubjId,
          termId: mTermId || null,
          scheduledAt: new Date(mDate).toISOString(),
          maxScore: parseInt(mMax, 10),
          isOnline: mOnline,
          duration: mOnline && mDuration ? parseInt(mDuration, 10) : undefined,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        toast("Exam scheduled successfully");
        setMTitle(""); setMClassId(""); setMSubjId(""); setMTermId(""); setMDate(""); setMMax("100");
        setMOnline(false); setMDuration("");
        window.location.reload();
      }
    } catch {
      // silently ignore
    }
  }

  const filteredSubjects = mClassId
    ? subjectOptions.filter((s) => s.classId === mClassId)
    : subjectOptions;

  const onlineCount = displayExams.filter((e) => e.isOnline).length;

  return (
    <div className={styles.root}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Examinations Management</h1>
          <p className={styles.subtitle}>Schedule, monitor, and manage school-wide assessments.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnOutline} onClick={() => exportExamsCSV(filtered)}><Download size={15} /> Export Results</button>
          <button className={styles.btnPrimary} onClick={() => setShowModal(true)}>
            <Plus size={15} /> Schedule Exam
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statCardTop}>
            <span className={styles.statLabel}>Exams Scheduled</span>
            <ClipboardList size={18} className={styles.statIconMuted} />
          </div>
          <div className={styles.statValueRow}>
            <span className={styles.statValue}>{displayStats.total}</span>
            <span className={styles.statSub}>{displayStats.termName}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statCardTop}>
            <span className={styles.statLabel}>Online Exams</span>
            {onlineCount > 0 && (
              <span className={styles.livePill}><span className={styles.pulseDot} />Live</span>
            )}
          </div>
          <div className={styles.statValueRow}><span className={styles.statValue}>{onlineCount}</span></div>
        </div>
        <div className={`${styles.statCard} ${displayStats.pending > 0 ? styles.statCardAlert : ""}`}>
          <div className={styles.statCardTop}>
            <span className={`${styles.statLabel} ${displayStats.pending > 0 ? styles.statLabelAlert : ""}`}>Awaiting Results</span>
            <AlertTriangle size={18} className={displayStats.pending > 0 ? styles.statIconAlert : styles.statIconMuted} />
          </div>
          <div className={styles.statValueRow}>
            <span className={styles.statValue}>{displayStats.pending}</span>
            {displayStats.pending > 0 && <span className={styles.statSubAlert}>Action required</span>}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statCardTop}>
            <span className={styles.statLabel}>Avg. Pass Rate</span>
            <TrendingUp size={18} className={styles.statIconSuccess} />
          </div>
          <div className={styles.statValueRow}>
            <span className={styles.statValue}>{termPassRate ? `${termPassRate.current}%` : "—"}</span>
            {termPassRate?.previous != null && (
              <span className={styles.statSubSuccess}>vs {termPassRate.previous}% last term</span>
            )}
          </div>
        </div>
      </div>

      {/* Main content: table + side panel */}
      <div className={styles.contentGrid}>
        <div className={styles.card}>
          <div className={styles.filterBar}>
            <div className={styles.searchWrap}>
              <Search size={14} className={styles.searchIcon} />
              <input className={styles.searchInput} placeholder="Search exams by title or subject…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className={styles.filterRight}>
              <div className={styles.selectWrap}>
                <select className={styles.select} value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}>
                  <option value="">All Classes</option>
                  {classOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown size={14} className={styles.selectChevron} />
              </div>
              <div className={styles.selectWrap}>
                <select className={styles.select} value={subjectFilter} onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }}>
                  <option value="">All Subjects</option>
                  {Array.from(new Map(subjectOptions.map((s) => [s.name, s])).values()).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ChevronDown size={14} className={styles.selectChevron} />
              </div>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Exam Title</th>
                  <th>Subject</th>
                  <th>Class</th>
                  <th>Date &amp; Time</th>
                  <th>Status</th>
                  <th className={styles.right}></th>
                </tr>
              </thead>
              <tbody>
                {pageExams.map((e) => (
                  <tr key={e.id} className={styles.dataRow}>
                    <td className={styles.examTitleCell}>
                      {e.upcoming && <span className={styles.upcomingDot} title="Upcoming" />}
                      {e.title}
                    </td>
                    <td className={styles.tdMuted}>{e.subjectName}</td>
                    <td className={styles.tdMuted}>{e.className}</td>
                    <td className={styles.tdMono}>{fmt(e.scheduledAt)}</td>
                    <td>
                      <span className={`${styles.badge} ${e.status === "scored" ? styles.badgeScored : styles.badgePending}`}>
                        {e.status === "scored" ? "Completed" : "Not Started"}
                      </span>
                    </td>
                    <td className={styles.right}>
                      {e.status === "scored" ? (
                        <button className={`${styles.btnAction} ${styles.btnActionSuccess}`} onClick={() => openDetail(e.id, e.isOnline ? "results" : "scores")}>
                          View Results
                        </button>
                      ) : !e.isOnline ? (
                        <button className={`${styles.btnAction} ${styles.btnActionPrimary}`} onClick={() => openDetail(e.id, "scores")}>
                          Enter Scores
                        </button>
                      ) : (
                        <button className={`${styles.btnAction} ${styles.btnActionNeutral}`} onClick={() => openDetail(e.id, "info")}>
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {pageExams.length === 0 && (
                  <tr><td colSpan={6} className={styles.emptyRow}>
                    <ClipboardList size={24} className={styles.emptyIcon} />
                    <p>No exams match your filters.</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className={styles.paginationBar}>
              <span>Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} exams</span>
              <div className={styles.pageButtons}>
                <button className={styles.pageBtn} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={14} /></button>
                <button className={styles.pageBtn} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.sideCol}>
          <div className={`${styles.card} ${styles.sidePanel}`}>
            <h3 className={styles.sidePanelTitle}>Recent Performance</h3>
            {recentPerformance ? (
              <>
                <p className={styles.perfExamName} title={`${recentPerformance.examTitle} (${recentPerformance.className})`}>
                  {recentPerformance.examTitle} ({recentPerformance.className})
                </p>
                <div className={styles.perfStatsRow}>
                  <div className={styles.perfStatBox}>
                    <span className={styles.perfStatLabel}>Avg</span>
                    <span className={styles.perfStatValue}>{recentPerformance.avg}</span>
                  </div>
                  <div className={`${styles.perfStatBox} ${styles.perfStatBoxHigh}`}>
                    <span className={`${styles.perfStatLabel} ${styles.perfStatLabelHigh}`}>High</span>
                    <span className={`${styles.perfStatValue} ${styles.perfStatValueHigh}`}>{recentPerformance.high}</span>
                  </div>
                  <div className={`${styles.perfStatBox} ${styles.perfStatBoxLow}`}>
                    <span className={`${styles.perfStatLabel} ${styles.perfStatLabelLow}`}>Low</span>
                    <span className={`${styles.perfStatValue} ${styles.perfStatValueLow}`}>{recentPerformance.low}</span>
                  </div>
                </div>
                <div className={styles.perfPassRow}>
                  <span className={styles.perfPassLabel}>Overall Pass Rate</span>
                  <span className={styles.perfPassValue}>{recentPerformance.passRate}%</span>
                </div>
                <div className={styles.perfBar}><div className={styles.perfBarFill} style={{ width: `${recentPerformance.passRate}%` }} /></div>
              </>
            ) : (
              <p className={styles.noData}>No scored exams yet.</p>
            )}
          </div>

          <div className={styles.tipCard}>
            <h4 className={styles.tipTitle}><Lightbulb size={16} /> Did you know?</h4>
            <p className={styles.tipText}>
              Click &quot;Export Results&quot; above to download the exams currently in view as a CSV file — it always reflects your active search and filters.
            </p>
          </div>
        </div>
      </div>

      {/* Detail modal (info / questions / scores / results) */}
      {detailOpen && selectedExam && (
        <div className={styles.modalBackdrop} onClick={() => setDetailOpen(false)}>
          <div className={`${styles.modal} ${styles.modalLg}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>{selectedExam.title}</h2>
                <p className={styles.modalSub}>{selectedExam.subjectName} · {selectedExam.className}</p>
              </div>
              <button className={styles.modalClose} onClick={() => setDetailOpen(false)}><X size={18} /></button>
            </div>

            <div className={styles.detailTabs}>
              {(["info", "questions", "scores", "results"] as const).map((t) => (
                <button key={t} className={`${styles.detailTab} ${detailTab === t ? styles.detailTabActive : ""}`} onClick={() => setDetailTab(t)}>
                  {t === "questions" ? "Questions" : t === "results" ? "Attempts" : t === "scores" ? "Scores" : "Details"}
                </button>
              ))}
            </div>

            <div className={styles.modalBody}>
              {detailTab === "info" && (
                <>
                  <div className={styles.detailChips}>
                    <span className={styles.chip}><BookOpen size={12} /> {selectedExam.subjectName}</span>
                    <span className={styles.chip}><Users size={12} /> {selectedExam.className}</span>
                    {(onlineMap[selectedExam.id] ?? selectedExam.isOnline) && (
                      <span className={`${styles.chip} ${styles.chipOnline}`}><Wifi size={12} /> Online</span>
                    )}
                  </div>
                  <div className={styles.metaGrid}>
                    <div className={styles.metaItem}><Calendar size={13} className={styles.metaIcon} /><span>{fmt(selectedExam.scheduledAt)}</span></div>
                    <div className={styles.metaItem}><ListChecks size={13} className={styles.metaIcon} /><span>Max: {selectedExam.questionTotalMarks > 0 ? selectedExam.questionTotalMarks : selectedExam.maxScore} pts</span></div>
                    {selectedExam.termName && <div className={styles.metaItem}><Clock size={13} className={styles.metaIcon} /><span>{selectedExam.termName}</span></div>}
                  </div>

                  <div className={styles.onlineToggleRow}>
                    <span className={styles.onlineToggleLabel}>Online Exam</span>
                    <button
                      className={`${styles.toggleBtn} ${(onlineMap[selectedExam.id] ?? selectedExam.isOnline) ? styles.toggleBtnOn : ""}`}
                      onClick={() => toggleOnline(selectedExam.id, onlineMap[selectedExam.id] ?? selectedExam.isOnline)}
                      disabled={!!togglingId}
                    >
                      {(onlineMap[selectedExam.id] ?? selectedExam.isOnline) ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>
                  </div>
                  {(onlineMap[selectedExam.id] ?? selectedExam.isOnline) && (
                    <div className={styles.durationRow}>
                      <label className={styles.formLabel}>Duration (min)</label>
                      <input
                        type="number" min={1} max={480} placeholder="Untimed" className={styles.durationInput}
                        defaultValue={durationMap[selectedExam.id] ?? selectedExam.duration ?? ""}
                        onBlur={(ev) => saveDuration(selectedExam.id, ev.target.value)}
                      />
                    </div>
                  )}

                  {selectedExam.upcoming && (
                    <div className={styles.upcomingBanner}><Calendar size={14} /><span>Scheduled in the next 7 days</span></div>
                  )}
                </>
              )}

              {detailTab === "scores" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--clr-app-muted)", margin: 0 }}>
                    Enter each student&apos;s score out of {scoresMax}. Leave blank to skip.
                  </p>
                  {scoresLoading ? (
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--clr-app-muted)" }}>Loading roster…</p>
                  ) : scoreRoster.length === 0 ? (
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--clr-app-muted)", textAlign: "center", padding: "24px 0" }}>No students in this class.</p>
                  ) : (
                    <div className={styles.scoreTableWrap}>
                      <table className={styles.scoreTable}>
                        <thead>
                          <tr><th>Student</th><th>Adm No</th><th className={styles.right}>Score / {scoresMax}</th></tr>
                        </thead>
                        <tbody>
                          {scoreRoster.map((r) => (
                            <tr key={r.studentId}>
                              <td>{r.name}</td>
                              <td className={styles.tdMuted}>{r.admissionNo}</td>
                              <td className={styles.right}>
                                <input
                                  type="number" min={0} max={scoresMax} step={0.5}
                                  className={styles.scoreInput}
                                  value={r.score ?? ""}
                                  onChange={(ev) => updateScoreValue(r.studentId, ev.target.value)}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {detailTab === "questions" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--clr-app-accent)" }}>
                        {questionsLoading ? "Loading…" : `${questions.length} question${questions.length !== 1 ? "s" : ""}`}
                      </span>
                      {savedBadge && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--clr-success)", background: "var(--clr-success-bg)", border: "1px solid var(--clr-success-border)", borderRadius: 99, padding: "2px 8px" }}>
                          <CheckCircle2 size={11} /> {savedBadge}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input ref={csvInputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={importCSV} />
                      {questions.length > 0 && (
                        <button className={styles.btnOutline} style={{ height: 30, padding: "0 12px", fontSize: "var(--text-xs)" }}
                          onClick={() => setShowPreview(true)}>
                          <BookOpen size={13} /> Preview
                        </button>
                      )}
                      <button className={styles.btnOutline} style={{ height: 30, padding: "0 12px", fontSize: "var(--text-xs)" }}
                        onClick={() => csvInputRef.current?.click()}>
                        <FileUp size={13} /> Import CSV
                      </button>
                      <button className={styles.btnPrimary} style={{ height: 30, padding: "0 12px", fontSize: "var(--text-xs)" }}
                        onClick={() => setShowAddQ((v) => !v)}>
                        <Plus size={13} /> Add
                      </button>
                    </div>
                  </div>

                  {/* Add question form */}
                  {showAddQ && (
                    <div style={{ background: "var(--clr-app-surface-alt)", borderRadius: 4, padding: 16, border: "1px solid var(--clr-app-border)" }}>
                      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                        <button onClick={() => setQType("mcq")}
                          style={{ padding: "5px 12px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: "var(--text-xs)", fontWeight: 600,
                            background: qType === "mcq" ? "var(--clr-app-accent)" : "var(--clr-app-border)", color: qType === "mcq" ? "#fff" : "var(--clr-app-muted)" }}>
                          MCQ
                        </button>
                        <button onClick={() => setQType("short_answer")}
                          style={{ padding: "5px 12px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: "var(--text-xs)", fontWeight: 600,
                            background: qType === "short_answer" ? "var(--clr-app-accent)" : "var(--clr-app-border)", color: qType === "short_answer" ? "#fff" : "var(--clr-app-muted)" }}>
                          Short Answer
                        </button>
                      </div>
                      <textarea
                        value={qText} onChange={(e) => setQText(e.target.value)}
                        placeholder="Question text…" rows={2}
                        style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--clr-app-border)", borderRadius: 4, fontSize: "var(--text-xs)", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                      />
                      {qType === "mcq" && (
                        <>
                          {["A", "B", "C", "D"].map((l, i) => (
                            <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                              <span style={{ width: 18, fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--clr-app-muted)" }}>{l}</span>
                              <input value={qOptions[i]} onChange={(e) => setQOptions((prev) => { const n = [...prev]; n[i] = e.target.value; return n; })}
                                placeholder={`Option ${l}`}
                                style={{ flex: 1, padding: "5px 8px", border: "1px solid var(--clr-app-border)", borderRadius: 4, fontSize: "var(--text-xs)" }} />
                            </div>
                          ))}
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                            <label style={{ fontSize: "var(--text-xs)" }}>Correct:</label>
                            <select value={qCorrect} onChange={(e) => setQCorrect(e.target.value)}
                              style={{ padding: "4px 8px", border: "1px solid var(--clr-app-border)", borderRadius: 4, fontSize: "var(--text-xs)" }}>
                              {["A","B","C","D"].map((l) => <option key={l}>{l}</option>)}
                            </select>
                            <label style={{ fontSize: "var(--text-xs)" }}>Marks:</label>
                            <input type="number" min={1} value={qMarks} onChange={(e) => setQMarks(e.target.value)}
                              style={{ width: 54, padding: "4px 8px", border: "1px solid var(--clr-app-border)", borderRadius: 4, fontSize: "var(--text-xs)" }} />
                          </div>
                        </>
                      )}
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button className={styles.btnPrimary} style={{ height: 30, padding: "0 14px", fontSize: "var(--text-xs)" }} onClick={addQuestion} disabled={addingQ}>
                          {addingQ ? "Adding…" : "Add Question"}
                        </button>
                        <button className={styles.btnOutline} style={{ height: 30, padding: "0 12px", fontSize: "var(--text-xs)" }} onClick={() => setShowAddQ(false)}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* Question list */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 340, overflowY: "auto" }}>
                    {questions.length === 0 && !questionsLoading && (
                      <p style={{ fontSize: "var(--text-xs)", color: "var(--clr-app-muted)", textAlign: "center", padding: "24px 0" }}>
                        No questions yet. Add questions or import from CSV.
                      </p>
                    )}
                    {questions.map((q, i) => (
                      <div key={q.id} style={{ background: "var(--clr-app-surface)", border: "1px solid var(--clr-app-border)", borderRadius: 4, padding: "12px 14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-app-text)", fontWeight: 500, flex: 1 }}>
                            <span style={{ color: "var(--clr-app-muted)", marginRight: 6, fontSize: "var(--text-xs)" }}>Q{i + 1}.</span>
                            {q.text}
                          </div>
                          <button onClick={() => deleteQuestion(q.id)} disabled={deletingQId === q.id}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--clr-error)", padding: 2, flexShrink: 0 }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {q.type === "mcq" && q.options && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                            {(q.options as string[]).map((opt, oi) => {
                              const letters = ["A","B","C","D"];
                              const isCorrect = q.correctAnswer === letters[oi];
                              return (
                                <span key={oi} style={{
                                  fontSize: "var(--text-xs)", padding: "2px 8px", borderRadius: 99,
                                  background: isCorrect ? "var(--clr-success-bg)" : "var(--clr-app-surface-alt)",
                                  color: isCorrect ? "var(--clr-success)" : "var(--clr-app-muted)", fontWeight: isCorrect ? 700 : 400,
                                }}>{opt}</span>
                              );
                            })}
                          </div>
                        )}
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-app-muted)", marginTop: 6 }}>
                          {q.marks} mark{q.marks !== 1 ? "s" : ""} · {q.type === "mcq" ? "MCQ" : "Short Answer"}
                        </div>
                      </div>
                    ))}
                  </div>

                  <details style={{ fontSize: "var(--text-xs)", color: "var(--clr-app-muted)" }}>
                    <summary style={{ cursor: "pointer" }}>CSV format guide</summary>
                    <pre style={{ marginTop: 6, background: "var(--clr-app-surface-alt)", padding: "8px 10px", borderRadius: 4, fontSize: "var(--text-xs)", overflowX: "auto" }}>
{`text,optionA,optionB,optionC,optionD,correctAnswer,marks
What is 2+2?,3,4,5,6,B,1
Name the capital of Ghana,Kumasi,Accra,Tamale,Cape Coast,B,1`}
                    </pre>
                  </details>
                </div>
              )}

              {detailTab === "results" && (
                <div>
                  <div style={{ marginBottom: 12, fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--clr-app-accent)" }}>
                    {attemptsLoading ? "Loading…" : `${attempts.length} student attempt${attempts.length !== 1 ? "s" : ""}`}
                  </div>
                  {attempts.length === 0 && !attemptsLoading && (
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--clr-app-muted)", textAlign: "center", padding: "24px 0" }}>
                      No students have attempted this exam yet.
                    </p>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 380, overflowY: "auto" }}>
                    {attempts.map((a) => (
                      <div key={a.id} style={{ background: "var(--clr-app-surface)", border: "1px solid var(--clr-app-border)", borderRadius: 4, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--clr-app-text)" }}>
                            {a.student.firstName} {a.student.lastName}
                          </div>
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-app-muted)" }}>{a.student.admissionNo}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          {a.submittedAt ? (
                            <>
                              <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--clr-app-text)" }}>
                                {a.score !== null ? `${a.score}` : "—"}
                                <span style={{ fontSize: "var(--text-xs)", color: "var(--clr-app-muted)" }}>/{selectedExam.questionTotalMarks > 0 ? selectedExam.questionTotalMarks : selectedExam.maxScore}</span>
                              </div>
                              <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-success)", marginBottom: 4 }}>Submitted</div>
                              <button
                                onClick={() => openGrading(a.id)}
                                style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--clr-app-accent)", background: "none", border: "1px solid var(--clr-app-border)", borderRadius: 4, padding: "2px 8px", cursor: "pointer" }}
                              >
                                Grade
                              </button>
                            </>
                          ) : (
                            <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-warning)", fontWeight: 600 }}>In Progress</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {detailTab === "scores" && (
              <div className={styles.modalFooter}>
                <button className={styles.btnOutline} onClick={() => setDetailOpen(false)}>Close</button>
                <button className={styles.btnPrimary} onClick={saveScores} disabled={scoresSaving || scoresLoading}>
                  {scoresSaving ? "Saving…" : "Save Scores"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Exam modal */}
      {showModal && (
        <div className={`${styles.modalBackdrop} desktopOnly`} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Schedule New Exam</h2>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Exam Title *</label>
                <input className={styles.formInput} value={mTitle} onChange={(e) => setMTitle(e.target.value)} placeholder="e.g. Mathematics Mid-Term" />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Class *</label>
                  <select className={styles.formSelect} value={mClassId} onChange={(e) => { setMClassId(e.target.value); setMSubjId(""); }}>
                    <option value="">Select class</option>
                    {classOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Subject *</label>
                  <select className={styles.formSelect} value={mSubjId} onChange={(e) => setMSubjId(e.target.value)}>
                    <option value="">Select subject</option>
                    {filteredSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Term</label>
                  <select className={styles.formSelect} value={mTermId} onChange={(e) => setMTermId(e.target.value)}>
                    <option value="">No term</option>
                    {termOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Date *</label>
                  <input className={styles.formInput} type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup} style={{ maxWidth: 160 }}>
                  <label className={styles.formLabel}>Max Score *</label>
                  <input className={styles.formInput} type="number" min={1} value={mMax} onChange={(e) => setMMax(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    Online Exam
                    <button type="button" onClick={() => setMOnline((v) => !v)}
                      className={`${styles.toggleBtn} ${mOnline ? styles.toggleBtnOn : ""}`}>
                      {mOnline ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>
                  </label>
                  {mOnline && (
                    <input className={styles.formInput} type="number" min={1} max={480}
                      placeholder="Duration (minutes, optional)"
                      value={mDuration} onChange={(e) => setMDuration(e.target.value)} />
                  )}
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setShowModal(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={saveExam}>Schedule Exam</button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule New Exam sheet — mobile */}
      <div className="mobileOnly">
        <MobileSheet
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Schedule New Exam"
          footer={<>
            <button type="button" className={kit.btnOutline} onClick={() => setShowModal(false)}>Cancel</button>
            <button type="button" className={kit.btnPrimary} onClick={saveExam} disabled={!mTitle || !mClassId || !mSubjId || !mDate}>Schedule Exam</button>
          </>}
        >
          <div className={kit.field}>
            <label>Exam Title *</label>
            <input className={kit.input} value={mTitle} onChange={(e) => setMTitle(e.target.value)} placeholder="e.g. Mathematics Mid-Term" />
          </div>
          <div className={kit.field}>
            <label>Class *</label>
            <select className={kit.select} value={mClassId} onChange={(e) => { setMClassId(e.target.value); setMSubjId(""); }}>
              <option value="">Select class</option>
              {classOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className={kit.field}>
            <label>Subject *</label>
            <select className={kit.select} value={mSubjId} onChange={(e) => setMSubjId(e.target.value)}>
              <option value="">Select subject</option>
              {filteredSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className={kit.field}>
            <label>Term</label>
            <select className={kit.select} value={mTermId} onChange={(e) => setMTermId(e.target.value)}>
              <option value="">No term</option>
              {termOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className={kit.fieldRow}>
            <div className={kit.field}>
              <label>Date *</label>
              <input className={kit.input} type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} />
            </div>
            <div className={kit.field}>
              <label>Max Score *</label>
              <input className={kit.input} type="number" min={1} value={mMax} onChange={(e) => setMMax(e.target.value)} />
            </div>
          </div>
          <label className={kit.checkboxRow}>
            <input type="checkbox" checked={mOnline} onChange={(e) => setMOnline(e.target.checked)} />
            <span>
              <span className={kit.checkboxLabel}>Online Exam</span>
              <span className={kit.checkboxSub}>Students can take this exam digitally.</span>
            </span>
          </label>
          {mOnline && (
            <div className={kit.field}>
              <label>Duration (minutes)</label>
              <input className={kit.input} type="number" min={1} max={480} placeholder="Untimed" value={mDuration} onChange={(e) => setMDuration(e.target.value)} />
            </div>
          )}
        </MobileSheet>
      </div>

      {/* ── Full-screen Question Preview Overlay ─────────────────────────── */}
      {showPreview && selectedExam && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(10,18,26,0.82)", backdropFilter: "blur(3px)",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{
            background: "var(--clr-app-surface)", borderBottom: "1px solid var(--clr-app-border)",
            padding: "14px 28px", display: "flex", alignItems: "center", gap: 16, flexShrink: 0,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--clr-app-muted)", fontWeight: 700 }}>
                Exam Preview
              </div>
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--clr-app-accent)", margin: "2px 0 0" }}>
                {selectedExam.title}
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--clr-app-muted)" }}>
                {questions.length} question{questions.length !== 1 ? "s" : ""} ·{" "}
                {questions.reduce((s, q) => s + Number(q.marks), 0)} marks total
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--clr-app-text)" }}>
                {selectedExam.subjectName} · {selectedExam.className}
              </span>
              <button
                onClick={() => { setShowPreview(false); setEditingQId(null); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "1px solid var(--clr-app-border)", borderRadius: 4, background: "var(--clr-app-surface)", cursor: "pointer", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--clr-app-accent)" }}
              >
                <X size={15} /> Close
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "28px 0" }}>
            <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: 20 }}>
              {questions.map((q, idx) => {
                const isEditing = editingQId === q.id;
                const opts = (q.options as string[] | null) ?? [];
                const letters = ["A","B","C","D"];
                return (
                  <div key={q.id} style={{
                    background: "var(--clr-app-surface)", borderRadius: 4,
                    border: isEditing ? "2px solid var(--clr-app-accent)" : "1px solid var(--clr-app-border)",
                    padding: "22px 26px",
                    boxShadow: "var(--shadow-sm)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flex: 1 }}>
                        <span style={{
                          flexShrink: 0, width: 28, height: 28, borderRadius: "50%",
                          background: "var(--clr-app-accent)", color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "var(--text-xs)", fontWeight: 700,
                        }}>{idx + 1}</span>
                        {isEditing ? (
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={2}
                            style={{ flex: 1, padding: "8px 10px", border: "1px solid var(--clr-app-border)", borderRadius: 4, fontSize: "var(--text-base)", fontFamily: "inherit", resize: "vertical", fontWeight: 600 }}
                          />
                        ) : (
                          <p style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--clr-app-text)", margin: 0, lineHeight: 1.55 }}>{q.text}</p>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        {!isEditing ? (
                          <>
                            <button
                              onClick={() => openEditInPreview(q)}
                              style={{ padding: "5px 10px", border: "1px solid var(--clr-app-border)", borderRadius: 4, background: "var(--clr-app-surface-alt)", cursor: "pointer", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--clr-app-accent)", display: "flex", alignItems: "center", gap: 4 }}
                            >
                              <Pencil size={12} /> Edit
                            </button>
                            <button
                              onClick={() => deleteQuestion(q.id)}
                              disabled={deletingQId === q.id}
                              style={{ padding: "5px 8px", border: "none", borderRadius: 4, background: "var(--clr-error-bg)", cursor: "pointer", color: "var(--clr-error)" }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={saveEditInPreview}
                              disabled={savingEdit}
                              style={{ padding: "5px 14px", border: "none", borderRadius: 4, background: "var(--clr-app-accent)", cursor: "pointer", fontSize: "var(--text-xs)", fontWeight: 700, color: "#fff" }}
                            >
                              {savingEdit ? "Saving…" : "Save"}
                            </button>
                            <button
                              onClick={() => setEditingQId(null)}
                              style={{ padding: "5px 10px", border: "1px solid var(--clr-app-border)", borderRadius: 4, background: "var(--clr-app-surface-alt)", cursor: "pointer", fontSize: "var(--text-xs)", color: "var(--clr-app-muted)" }}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div style={{ paddingLeft: 38 }}>
                        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                          <button onClick={() => setEditType("mcq")} style={{ padding: "4px 12px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: "var(--text-xs)", fontWeight: 600, background: editType === "mcq" ? "var(--clr-app-accent)" : "var(--clr-app-border)", color: editType === "mcq" ? "#fff" : "var(--clr-app-muted)" }}>MCQ</button>
                          <button onClick={() => setEditType("short_answer")} style={{ padding: "4px 12px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: "var(--text-xs)", fontWeight: 600, background: editType === "short_answer" ? "var(--clr-app-accent)" : "var(--clr-app-border)", color: editType === "short_answer" ? "#fff" : "var(--clr-app-muted)" }}>Short Answer</button>
                        </div>
                        {editType === "mcq" && (
                          <>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                              {letters.map((l, i) => (
                                <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ width: 16, fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--clr-app-muted)", flexShrink: 0 }}>{l}</span>
                                  <input
                                    value={editOptions[i]}
                                    onChange={(e) => setEditOptions((prev) => { const n = [...prev]; n[i] = e.target.value; return n; })}
                                    placeholder={`Option ${l}`}
                                    style={{ flex: 1, padding: "5px 8px", border: "1px solid var(--clr-app-border)", borderRadius: 4, fontSize: "var(--text-xs)" }}
                                  />
                                </div>
                              ))}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--clr-app-muted)" }}>Correct answer:</label>
                              {letters.map((l) => (
                                <button key={l} onClick={() => setEditCorrect(l)} style={{
                                  width: 30, height: 30, borderRadius: "50%", border: "2px solid",
                                  borderColor: editCorrect === l ? "var(--clr-success)" : "var(--clr-app-border)",
                                  background: editCorrect === l ? "var(--clr-success-bg)" : "var(--clr-app-surface-alt)",
                                  color: editCorrect === l ? "var(--clr-success)" : "var(--clr-app-muted)",
                                  cursor: "pointer", fontSize: "var(--text-xs)", fontWeight: 700,
                                }}>{l}</button>
                              ))}
                              <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--clr-app-muted)", marginLeft: 8 }}>Marks:</label>
                              <input type="number" min={1} value={editMarks} onChange={(e) => setEditMarks(e.target.value)}
                                style={{ width: 54, padding: "4px 8px", border: "1px solid var(--clr-app-border)", borderRadius: 4, fontSize: "var(--text-xs)" }} />
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      q.type === "mcq" && opts.length > 0 && (
                        <div style={{ paddingLeft: 38, display: "flex", flexDirection: "column", gap: 10 }}>
                          {opts.map((opt, oi) => {
                            const letter = letters[oi];
                            const isCorrect = q.correctAnswer === letter;
                            return (
                              <div key={oi} style={{
                                display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
                                borderRadius: 4,
                                border: `2px solid ${isCorrect ? "var(--clr-success)" : "var(--clr-app-border)"}`,
                                background: isCorrect ? "var(--clr-success-bg)" : "var(--clr-app-surface-alt)",
                              }}>
                                <span style={{
                                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                                  background: isCorrect ? "var(--clr-success)" : "var(--clr-app-border)",
                                  color: isCorrect ? "#fff" : "var(--clr-app-muted)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: "var(--text-xs)", fontWeight: 700,
                                }}>{letter}</span>
                                <span style={{ fontSize: "var(--text-sm)", color: isCorrect ? "var(--clr-success)" : "var(--clr-app-text)", fontWeight: isCorrect ? 600 : 400 }}>{opt}</span>
                                {isCorrect && (
                                  <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 3, fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--clr-success)", background: "var(--clr-success-bg)", padding: "2px 8px", borderRadius: 99 }}>
                                    <Check size={10} /> Correct
                                  </span>
                                )}
                              </div>
                            );
                          })}
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-app-muted)", marginTop: 4 }}>{q.marks} mark{q.marks !== 1 ? "s" : ""}</div>
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Grade Submission modal */}
      {gradingAttemptId && (
        <div className={styles.modalBackdrop} onClick={() => !gradingSaving && setGradingAttemptId(null)}>
          <div className={`${styles.modal} ${styles.modalLg}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Grade Submission</h2>
              <button className={styles.modalClose} onClick={() => setGradingAttemptId(null)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              {gradingLoading && <p style={{ fontSize: "var(--text-xs)", color: "var(--clr-app-muted)" }}>Loading answers…</p>}
              {!gradingLoading && gradingRows.map((r) => (
                <div key={r.questionId} style={{ border: "1px solid var(--clr-app-border)", borderRadius: 4, padding: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--clr-app-text)", marginBottom: 4 }}>
                    Q{r.order}. {r.text} <span style={{ fontWeight: 400, color: "var(--clr-app-muted)" }}>({r.marks} mark{r.marks !== 1 ? "s" : ""})</span>
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-app-muted)", background: "var(--clr-app-surface-alt)", borderRadius: 4, padding: "8px 10px", marginBottom: 8, whiteSpace: "pre-wrap" }}>
                    {r.answer?.trim() ? r.answer : <em style={{ color: "var(--clr-app-muted)" }}>No answer submitted</em>}
                  </div>
                  {r.type === "mcq" ? (
                    <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: r.isCorrect ? "var(--clr-success)" : "var(--clr-error)" }}>
                      Auto-graded: {r.isCorrect ? "Correct" : "Incorrect"} — {r.marksAwarded}/{r.marks}
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <label style={{ fontSize: "var(--text-xs)", color: "var(--clr-app-muted)" }}>Marks awarded</label>
                      <input
                        type="number" min={0} max={r.marks} step={0.5}
                        value={r.marksAwarded}
                        onChange={(e) => updateGradingMarks(r.questionId, Number(e.target.value))}
                        style={{ width: 70, padding: "4px 8px", border: "1px solid var(--clr-app-border)", borderRadius: 4, fontSize: "var(--text-xs)" }}
                      />
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--clr-app-muted)" }}>/ {r.marks}</span>
                    </div>
                  )}
                </div>
              ))}
              {!gradingLoading && gradingRows.length === 0 && (
                <p style={{ fontSize: "var(--text-xs)", color: "var(--clr-app-muted)" }}>No questions found for this exam.</p>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setGradingAttemptId(null)} disabled={gradingSaving}>Cancel</button>
              <button className={styles.btnPrimary} onClick={saveGrading} disabled={gradingSaving || gradingLoading}>
                {gradingSaving ? "Saving…" : "Save Grades"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
