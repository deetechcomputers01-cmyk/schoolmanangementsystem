"use client";

/**
 * MobileExamsContent — bespoke mobile view for Examinations.
 *
 * Every field/action here traces back to ExamsContent.tsx (the real desktop
 * component) and the real /api/exams endpoints:
 *   - exam list, stats, Add Exam form -> same fields/POST /api/exams as desktop's saveExam()
 *   - Enter Scores -> GET/POST /api/exams/:id/scores, same roster shape (ScoreRosterRow) as desktop
 *
 * The Stitch mockup's "Invigilation" tab, "Assign Invigilator" action, and
 * "Scripts Pending" stat have NO real backing anywhere in the schema or
 * service layer (no invigilator/room field on Exam) — intentionally not
 * reproduced. The desktop's Questions/Attempts/Grading tabs (question
 * bank authoring, CSV import, per-attempt manual grading) are a large,
 * genuinely desktop-oriented workflow and are out of scope for this pass;
 * only the list + schedule + score-entry workflows are covered here.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Calendar, ClipboardList, CheckCircle2, Wifi, Clock } from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
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
    </div>
  );
}
