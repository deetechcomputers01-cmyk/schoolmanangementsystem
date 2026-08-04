"use client";

/**
 * MobileExamsContent — bespoke mobile view for Examinations.
 *
 * Every field/action here traces back to ExamsContent.tsx (the real desktop
 * component) and the real /api/exams endpoints:
 *   - exam list, stats, Add Exam form -> same fields/POST /api/exams as desktop's saveExam()
 *   - Enter Scores -> GET/POST /api/exams/:id/scores, same roster shape (ScoreRosterRow) as desktop
 *   - Edit Exam (Details tab) -> PATCH /api/exams/:id { isOnline, duration } — this is
 *     the ENTIRE real metadata-edit capability on desktop too; title/class/subject/
 *     date/maxScore are create-only everywhere in this app, not just on mobile.
 *   - Edit Exam (Questions tab) -> full ExamQuestion CRUD, same endpoints/handlers as
 *     desktop's Questions tab: GET/POST /api/exams/:id/questions, PATCH/DELETE
 *     /api/exams/:id/questions/:qid. CSV import and the Attempts/Grading tab (online
 *     exam submissions) are desktop-only power-user workflows, intentionally not
 *     reproduced here — everything else desktop can edit about a question, mobile can too.
 *
 * The Stitch mockup's "Invigilation" tab, "Assign Invigilator" action, and
 * "Scripts Pending" stat have NO real backing anywhere in the schema or
 * service layer (no invigilator/room field on Exam) — intentionally not
 * reproduced.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Calendar, ClipboardList, CheckCircle2, Wifi, Clock,
  Pencil, Trash2, Check,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import styles from "./MobileExamsContent.module.css";

interface ExamRow {
  id: string; title: string; className: string; classId: string;
  subjectName: string; subjectId: string; termName: string | null; termId: string | null;
  scheduledAt: string; maxScore: number; questionTotalMarks: number; scoredCount: number;
  isOnline: boolean; duration: number | null; status: "scored" | "pending"; upcoming: boolean;
}
interface ClassOption { id: string; name: string; level: string }
interface SubjectOption { id: string; name: string; code: string; classId: string | null; teacherName: string | null }
interface TermOption { id: string; name: string }
interface Stats { total: number; scored: number; pending: number; upcoming: number; termName: string; yearName: string }
interface ScoreRosterRow { studentId: string; name: string; admissionNo: string; score: number | null; remarks: string | null }
interface ExamQuestion {
  id: string; order: number; text: string; type: string;
  options: string[] | null; correctAnswer: string | null; marks: number;
}

interface Props {
  exams: ExamRow[];
  stats: Stats;
  classOptions: ClassOption[];
  subjectOptions: SubjectOption[];
  termOptions: TermOption[];
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function MobileExamsContent({ exams, stats, classOptions, subjectOptions, termOptions }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "scored" | "upcoming">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exams.filter((e) => {
      if (q && !e.title.toLowerCase().includes(q) && !e.className.toLowerCase().includes(q) && !e.subjectName.toLowerCase().includes(q)) return false;
      if (classFilter && e.classId !== classFilter) return false;
      if (statusFilter === "pending" && e.status !== "pending") return false;
      if (statusFilter === "scored" && e.status !== "scored") return false;
      if (statusFilter === "upcoming" && !e.upcoming) return false;
      return true;
    }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [exams, search, classFilter, statusFilter]);

  // ── Add Exam sheet — same fields/endpoint as desktop's saveExam() ────────
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState("");
  const [subjId, setSubjId] = useState("");
  const [termId, setTermId] = useState("");
  const [date, setDate] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [isOnline, setIsOnline] = useState(false);
  const [duration, setDuration] = useState("");
  const [saving, setSaving] = useState(false);
  const filteredSubjects = classId ? subjectOptions.filter((s) => s.classId === classId) : subjectOptions;

  function openAdd() {
    setTitle(""); setClassId(""); setSubjId(""); setTermId(""); setDate(""); setMaxScore("100");
    setIsOnline(false); setDuration("");
    setAddOpen(true);
  }

  async function submitAdd() {
    if (!title || !classId || !subjId || !date) { showToast("Fill in the required fields.", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, classId, subjectId: subjId, termId: termId || null,
          scheduledAt: new Date(date).toISOString(),
          maxScore: parseInt(maxScore, 10),
          isOnline,
          duration: isOnline && duration ? parseInt(duration, 10) : undefined,
        }),
      });
      if (!res.ok) { showToast("Failed to schedule exam.", "error"); setSaving(false); return; }
      setAddOpen(false);
      showToast("Exam scheduled successfully");
      router.refresh();
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  // ── Enter Scores sheet — same roster shape/endpoint as desktop's scores tab ──
  const [scoresExam, setScoresExam] = useState<ExamRow | null>(null);
  const [roster, setRoster] = useState<ScoreRosterRow[]>([]);
  const [rosterMax, setRosterMax] = useState(100);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [scoresSaving, setScoresSaving] = useState(false);

  function openScores(exam: ExamRow) {
    setScoresExam(exam);
    setRoster([]);
    setRosterLoading(true);
    fetch(`/api/exams/${exam.id}/scores`)
      .then((r) => r.json())
      .then((data: { roster: ScoreRosterRow[]; maxScore: number }) => {
        setRoster(data.roster ?? []);
        setRosterMax(data.maxScore ?? exam.maxScore);
      })
      .catch(() => showToast("Failed to load roster.", "error"))
      .finally(() => setRosterLoading(false));
  }

  function updateScore(studentId: string, value: string) {
    setRoster((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, score: value === "" ? null : Number(value) } : r)));
  }

  async function saveScores() {
    if (!scoresExam) return;
    const toSave = roster.filter((r) => r.score !== null);
    if (toSave.length === 0) { showToast("Enter at least one score first.", "error"); return; }
    setScoresSaving(true);
    try {
      const res = await fetch(`/api/exams/${scoresExam.id}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: toSave.map((r) => ({ studentId: r.studentId, score: r.score })) }),
      });
      if (!res.ok) { showToast("Failed to save scores.", "error"); return; }
      showToast(`Saved scores for ${toSave.length} student${toSave.length !== 1 ? "s" : ""}`);
      setScoresExam(null);
      router.refresh();
    } finally {
      setScoresSaving(false);
    }
  }

  // ── Edit Exam sheet — Details tab (PATCH /api/exams/:id) ────────────
  const [editExam, setEditExam] = useState<ExamRow | null>(null);
  const [editTab, setEditTab] = useState<"details" | "questions">("details");
  const [edOnline, setEdOnline] = useState(false);
  const [edDuration, setEdDuration] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);

  // ── Edit Exam sheet — Questions tab (same endpoints as desktop) ─────
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [qFormOpen, setQFormOpen] = useState(false);
  const [qEditingId, setQEditingId] = useState<string | null>(null);
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState<"mcq" | "short_answer">("mcq");
  const [qOptions, setQOptions] = useState(["", "", "", ""]);
  const [qCorrect, setQCorrect] = useState("A");
  const [qMarks, setQMarks] = useState("1");
  const [qSaving, setQSaving] = useState(false);
  const [qDeletingId, setQDeletingId] = useState<string | null>(null);

  function openEditExam(exam: ExamRow) {
    setEditExam(exam);
    setEditTab("details");
    setEdOnline(exam.isOnline);
    setEdDuration(exam.duration ? String(exam.duration) : "");
    setQuestions([]);
    setQuestionsLoaded(false);
    setQFormOpen(false);
  }

  function loadQuestions(examId: string) {
    setQuestionsLoading(true);
    fetch(`/api/exams/${examId}/questions`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: ExamQuestion[]) => { setQuestions(rows); setQuestionsLoaded(true); })
      .catch(() => showToast("Failed to load questions.", "error"))
      .finally(() => setQuestionsLoading(false));
  }

  function switchEditTab(tab: "details" | "questions") {
    setEditTab(tab);
    if (tab === "questions" && editExam && !questionsLoaded) loadQuestions(editExam.id);
  }

  async function saveDetails() {
    if (!editExam) return;
    setSavingDetails(true);
    try {
      const res = await fetch(`/api/exams/${editExam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: edOnline, duration: edOnline && edDuration ? Number(edDuration) : null }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast("Exam details updated");
      setEditExam(null);
      router.refresh();
    } catch {
      showToast("Failed to update exam", "error");
    } finally {
      setSavingDetails(false);
    }
  }

  const questionTotalMarks = questions.reduce((s, q) => s + q.marks, 0);

  function switchQType(type: "mcq" | "short_answer") {
    setQType(type);
    if (type === "mcq" && !["A", "B", "C", "D"].includes(qCorrect)) setQCorrect("A");
    if (type === "short_answer" && ["A", "B", "C", "D"].includes(qCorrect)) setQCorrect("");
  }

  function openAddQuestion() {
    setQEditingId(null);
    setQText(""); setQType("mcq"); setQOptions(["", "", "", ""]); setQCorrect("A"); setQMarks("1");
    setQFormOpen(true);
  }

  function openEditQuestion(q: ExamQuestion) {
    setQEditingId(q.id);
    setQText(q.text);
    const isShort = q.type === "short_answer";
    setQType(isShort ? "short_answer" : "mcq");
    setQCorrect(q.correctAnswer ?? (isShort ? "" : "A"));
    setQMarks(String(q.marks));
    const opts = q.options ?? [];
    setQOptions([opts[0] ?? "", opts[1] ?? "", opts[2] ?? "", opts[3] ?? ""]);
    setQFormOpen(true);
  }

  async function submitQuestion() {
    if (!editExam || !qText.trim()) { showToast("Question text is required.", "error"); return; }
    setQSaving(true);
    try {
      const body: Record<string, unknown> = { text: qText.trim(), type: qType, marks: parseFloat(qMarks) || 1 };
      if (qType === "mcq") {
        body.options = qOptions.map((o) => o.trim()).filter(Boolean);
        body.correctAnswer = qCorrect;
      } else {
        body.options = null;
        body.correctAnswer = null;
      }
      const url = qEditingId ? `/api/exams/${editExam.id}/questions/${qEditingId}` : `/api/exams/${editExam.id}/questions`;
      const res = await fetch(url, {
        method: qEditingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      if (qEditingId) {
        setQuestions((prev) => prev.map((q) => (q.id === qEditingId ? { ...q, text: body.text as string, type: qType, options: body.options as string[] | null, correctAnswer: body.correctAnswer as string | null, marks: body.marks as number } : q)));
        showToast("Question updated");
      } else {
        const created = await res.json();
        setQuestions((prev) => [...prev, created]);
        showToast("Question added");
      }
      setQFormOpen(false);
    } catch {
      showToast("Failed to save question", "error");
    } finally {
      setQSaving(false);
    }
  }

  async function removeQuestion(q: ExamQuestion) {
    if (!editExam) return;
    const sure = await confirm({ message: `Delete this question? This can't be undone.`, confirmLabel: "Delete" });
    if (!sure) return;
    setQDeletingId(q.id);
    try {
      const res = await fetch(`/api/exams/${editExam.id}/questions/${q.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setQuestions((prev) => prev.filter((x) => x.id !== q.id));
      showToast("Question removed");
    } catch {
      showToast("Failed to delete question", "error");
    } finally {
      setQDeletingId(null);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.statsRow}>
        <div className={styles.statPill}><strong className={styles.statValue}>{stats.upcoming}</strong><span className={styles.statLabel}>Upcoming</span></div>
        <div className={styles.statPill}><strong className={styles.statValue}>{stats.pending}</strong><span className={styles.statLabel}>Pending</span></div>
        <div className={styles.statPill}><strong className={`${styles.statValue} ${styles.statValueGood}`}>{stats.scored}</strong><span className={styles.statLabel}>Scored</span></div>
        <div className={styles.statPill}><strong className={styles.statValue}>{stats.total}</strong><span className={styles.statLabel}>Total</span></div>
      </div>
      <p className={styles.contextLine}>{stats.termName} · {stats.yearName}</p>

      <label className={kit.searchWrap}>
        <Search size={16} className={kit.searchIcon} />
        <input className={`${kit.input} ${kit.searchInput}`} placeholder="Search exams…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>

      <div className={styles.chipRow}>
        {(["all", "upcoming", "pending", "scored"] as const).map((s) => (
          <button key={s} type="button" className={`${styles.chip} ${statusFilter === s ? styles.chipActive : ""}`} onClick={() => setStatusFilter(s)}>
            {s === "all" ? "All" : s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <div className={styles.chipRow}>
        <button type="button" className={`${styles.chip} ${classFilter === "" ? styles.chipActive : ""}`} onClick={() => setClassFilter("")}>All Classes</button>
        {classOptions.map((c) => (
          <button key={c.id} type="button" className={`${styles.chip} ${classFilter === c.id ? styles.chipActive : ""}`} onClick={() => setClassFilter(c.id)}>{c.name}</button>
        ))}
      </div>

      <button type="button" className={styles.addBtn} onClick={openAdd}>
        <Plus size={18} /> Add Exam
      </button>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <p className={kit.emptyText}>No exams match your search.</p>
        ) : filtered.map((e) => {
          const isOpen = openId === e.id;
          return (
            <div key={e.id} className={`${styles.card} ${e.upcoming ? styles.cardUpcoming : ""}`}>
              <button type="button" className={styles.cardTop} onClick={() => setOpenId(isOpen ? null : e.id)}>
                <div className={styles.cardTopLeft}>
                  <h4 className={styles.examTitle}>{e.title}</h4>
                  <p className={styles.examSub}>{e.className} • {e.subjectName}</p>
                </div>
                <span className={`${styles.statusPill} ${e.status === "scored" ? styles.statusScored : styles.statusPending}`}>
                  {e.status === "scored" ? "Completed" : e.upcoming ? "Upcoming" : "Not Started"}
                </span>
              </button>
              <div className={styles.metaRow}>
                <span><Calendar size={13} /> {fmtDate(e.scheduledAt)}</span>
                <span><Clock size={13} /> {fmtTime(e.scheduledAt)}</span>
                {e.isOnline && <span><Wifi size={13} /> Online</span>}
              </div>
              {isOpen && (
                <div className={styles.actionRow}>
                  <button type="button" className={styles.actionBtnPrimary} onClick={() => openScores(e)}>
                    <ClipboardList size={15} /> {e.status === "scored" ? "Update Scores" : "Enter Scores"}
                  </button>
                  <button type="button" className={styles.actionBtnOutline} onClick={() => openEditExam(e)}>
                    <Pencil size={14} /> Edit
                  </button>
                  {e.status === "scored" && (
                    <span className={styles.scoredHint}><CheckCircle2 size={13} /> {e.scoredCount} scored</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Exam sheet */}
      <MobileSheet
        open={addOpen}
        onClose={() => !saving && setAddOpen(false)}
        title="Schedule New Exam"
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => setAddOpen(false)} disabled={saving}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={submitAdd} disabled={saving || !title || !classId || !subjId || !date}>
            {saving ? "Scheduling…" : "Schedule Exam"}
          </button>
        </>}
      >
        <div className={kit.field}>
          <label>Exam Title *</label>
          <input className={kit.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mathematics Mid-Term" />
        </div>
        <div className={kit.field}>
          <label>Class *</label>
          <select className={kit.select} value={classId} onChange={(e) => { setClassId(e.target.value); setSubjId(""); }}>
            <option value="">Select class</option>
            {classOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className={kit.field}>
          <label>Subject *</label>
          <select className={kit.select} value={subjId} onChange={(e) => setSubjId(e.target.value)}>
            <option value="">Select subject</option>
            {filteredSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className={kit.field}>
          <label>Term</label>
          <select className={kit.select} value={termId} onChange={(e) => setTermId(e.target.value)}>
            <option value="">No term</option>
            {termOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className={kit.fieldRow}>
          <div className={kit.field}>
            <label>Date *</label>
            <input className={kit.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className={kit.field}>
            <label>Max Score *</label>
            <input className={kit.input} type="number" min={1} value={maxScore} onChange={(e) => setMaxScore(e.target.value)} />
          </div>
        </div>
        <label className={kit.checkboxRow}>
          <input type="checkbox" checked={isOnline} onChange={(e) => setIsOnline(e.target.checked)} />
          <span>
            <span className={kit.checkboxLabel}>Online Exam</span>
            <span className={kit.checkboxSub}>Students can take this exam digitally.</span>
          </span>
        </label>
        {isOnline && (
          <div className={kit.field}>
            <label>Duration (minutes)</label>
            <input className={kit.input} type="number" min={1} max={480} placeholder="Untimed" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
        )}
      </MobileSheet>

      {/* Enter Scores sheet */}
      <MobileSheet
        open={!!scoresExam}
        onClose={() => !scoresSaving && setScoresExam(null)}
        title={scoresExam ? `Enter Scores — ${scoresExam.title}` : ""}
        subtitle={scoresExam ? `${scoresExam.className} • Max ${rosterMax}` : undefined}
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => setScoresExam(null)} disabled={scoresSaving}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={saveScores} disabled={scoresSaving || rosterLoading}>
            {scoresSaving ? "Saving…" : "Save Scores"}
          </button>
        </>}
      >
        {rosterLoading ? (
          <p className={kit.emptyText}>Loading roster…</p>
        ) : roster.length === 0 ? (
          <p className={kit.emptyText}>No students in this class.</p>
        ) : (
          <div className={styles.rosterList}>
            {roster.map((r) => (
              <div key={r.studentId} className={styles.rosterRow}>
                <div className={styles.rosterInfo}>
                  <p className={styles.rosterName}>{r.name}</p>
                  <p className={styles.rosterAdm}>{r.admissionNo}</p>
                </div>
                <input
                  className={styles.rosterInput}
                  type="number"
                  min={0}
                  max={rosterMax}
                  placeholder="—"
                  value={r.score ?? ""}
                  onChange={(e) => updateScore(r.studentId, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}
      </MobileSheet>

      {/* Edit Exam sheet — Details + Questions tabs */}
      <MobileSheet
        open={!!editExam}
        onClose={() => !savingDetails && setEditExam(null)}
        title={editExam ? `Edit Exam — ${editExam.title}` : ""}
        subtitle={editExam ? `${editExam.className} · ${editExam.subjectName}` : undefined}
        footer={editTab === "details" ? <>
          <button type="button" className={kit.btnOutline} onClick={() => setEditExam(null)} disabled={savingDetails}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={saveDetails} disabled={savingDetails}>
            {savingDetails ? "Saving…" : "Save Changes"}
          </button>
        </> : undefined}
      >
        {editExam && (
          <>
            <div className={kit.segmented} style={{ marginBottom: 14 }}>
              <button type="button" className={`${kit.segBtn} ${editTab === "details" ? kit.segBtnActive : ""}`} onClick={() => switchEditTab("details")}>Details</button>
              <button type="button" className={`${kit.segBtn} ${editTab === "questions" ? kit.segBtnActive : ""}`} onClick={() => switchEditTab("questions")}>Questions</button>
            </div>

            {editTab === "details" ? (
              <>
                <div className={styles.readonlyGrid}>
                  <div><span>Class</span><strong>{editExam.className}</strong></div>
                  <div><span>Subject</span><strong>{editExam.subjectName}</strong></div>
                  <div><span>Term</span><strong>{editExam.termName ?? "—"}</strong></div>
                  <div><span>Scheduled</span><strong>{fmtDate(editExam.scheduledAt)} · {fmtTime(editExam.scheduledAt)}</strong></div>
                  <div><span>Max Score</span><strong>{editExam.questionTotalMarks || editExam.maxScore}</strong></div>
                </div>
                <label className={kit.checkboxRow}>
                  <input type="checkbox" checked={edOnline} onChange={(e) => setEdOnline(e.target.checked)} />
                  <span>
                    <span className={kit.checkboxLabel}>Online Exam</span>
                    <span className={kit.checkboxSub}>Students can take this exam digitally.</span>
                  </span>
                </label>
                {edOnline && (
                  <div className={kit.field}>
                    <label>Duration (minutes)</label>
                    <input className={kit.input} type="number" min={1} max={480} placeholder="Untimed" value={edDuration} onChange={(e) => setEdDuration(e.target.value)} />
                  </div>
                )}
                <p className={kit.helperText}>Title, class, subject, and schedule can&apos;t be changed after creation.</p>
              </>
            ) : (
              <>
                <p className={kit.pickCount}>{questions.length} question{questions.length === 1 ? "" : "s"} · {questionTotalMarks} total marks</p>

                {!qFormOpen && (
                  <button type="button" className={styles.addBtn} onClick={openAddQuestion} style={{ marginBottom: 12 }}>
                    <Plus size={16} /> Add Question
                  </button>
                )}

                {qFormOpen && (
                  <div className={styles.qForm}>
                    <div className={kit.segmented}>
                      <button type="button" className={`${kit.segBtn} ${qType === "mcq" ? kit.segBtnActive : ""}`} onClick={() => switchQType("mcq")}>MCQ</button>
                      <button type="button" className={`${kit.segBtn} ${qType === "short_answer" ? kit.segBtnActive : ""}`} onClick={() => switchQType("short_answer")}>Short Answer</button>
                    </div>
                    <div className={kit.field}>
                      <label>Question Text *</label>
                      <textarea className={kit.textarea} rows={2} value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Enter the question…" />
                    </div>
                    {qType === "mcq" ? (
                      <>
                        {(["A", "B", "C", "D"] as const).map((letter, i) => (
                          <div key={letter} className={styles.optionRow}>
                            <button type="button" className={`${styles.optLetter} ${qCorrect === letter ? styles.optLetterActive : ""}`} onClick={() => setQCorrect(letter)} title="Mark as correct answer">
                              {qCorrect === letter ? <Check size={13} /> : letter}
                            </button>
                            <input
                              className={kit.input}
                              value={qOptions[i]}
                              onChange={(e) => setQOptions((prev) => prev.map((o, idx) => (idx === i ? e.target.value : o)))}
                              placeholder={`Option ${letter}`}
                            />
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className={kit.field}>
                        <label>Model Answer</label>
                        <input className={kit.input} value={qCorrect} onChange={(e) => setQCorrect(e.target.value)} placeholder="Expected answer (for reference)" />
                      </div>
                    )}
                    <div className={kit.field}>
                      <label>Marks</label>
                      <input className={kit.input} type="number" min={0} step="0.5" value={qMarks} onChange={(e) => setQMarks(e.target.value)} />
                    </div>
                    <div className={kit.fieldRow}>
                      <button type="button" className={kit.btnOutline} onClick={() => setQFormOpen(false)} disabled={qSaving}>Cancel</button>
                      <button type="button" className={kit.btnPrimary} onClick={submitQuestion} disabled={qSaving || !qText.trim()}>
                        {qSaving ? "Saving…" : qEditingId ? "Save Changes" : "Add Question"}
                      </button>
                    </div>
                  </div>
                )}

                {questionsLoading ? (
                  <p className={kit.emptyText}>Loading questions…</p>
                ) : questions.length === 0 && !qFormOpen ? (
                  <p className={kit.emptyText}>No questions added yet.</p>
                ) : (
                  <div className={styles.qList}>
                    {questions.map((q, i) => (
                      <div key={q.id} className={styles.qCard}>
                        <div className={styles.qCardTop}>
                          <span className={styles.qNumber}>{i + 1}</span>
                          <span className={styles.qTypePill}>{q.type === "short_answer" ? "Short Answer" : "MCQ"}</span>
                          <span className={styles.qMarks}>{q.marks} pts</span>
                        </div>
                        <p className={styles.qText}>{q.text}</p>
                        <div className={styles.qActions}>
                          <button type="button" className={styles.qActionBtn} onClick={() => openEditQuestion(q)}><Pencil size={13} /> Edit</button>
                          <button type="button" className={styles.qActionBtnDanger} onClick={() => removeQuestion(q)} disabled={qDeletingId === q.id}>
                            <Trash2 size={13} /> {qDeletingId === q.id ? "…" : "Delete"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </MobileSheet>
    </div>
  );
}
