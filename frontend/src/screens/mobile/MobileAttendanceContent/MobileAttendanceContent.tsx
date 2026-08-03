"use client";

import { useCallback, useMemo, useState } from "react";
import { Save, CheckCircle2, WifiOff, CloudUpload } from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import styles from "./MobileAttendanceContent.module.css";

type AttendanceStatus = "present" | "absent" | "late" | "excused";
type Mark = { status: AttendanceStatus | null; note: string };

export interface MobileAttendanceProps {
  classes: { id: string; name: string }[];
  students: { id: string; firstName: string; lastName: string; admissionNo: string; classId: string; photoUrl: string | null }[];
  existingAttendance: { studentId: string; classId: string; date: string; status: AttendanceStatus; note: string }[];
  subjects: { id: string; name: string; classId: string; staffId: string | null }[];
  staffList: { id: string; name: string }[];
  canEdit: boolean;
}

const STATUS_OPTIONS: { key: AttendanceStatus; label: string }[] = [
  { key: "present", label: "P" },
  { key: "absent", label: "A" },
  { key: "late", label: "L" },
  { key: "excused", label: "E" },
];

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

export function MobileAttendanceContent({ classes, students, existingAttendance, subjects, staffList, canEdit }: MobileAttendanceProps) {
  const { showToast } = useToast();
  const { online, pending, enqueue } = useOfflineSync();

  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [date, setDate] = useState(todayISO);
  const [session, setSession] = useState<"Morning" | "Afternoon" | "Evening">("Morning");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [marks, setMarks] = useState<Record<string, Mark>>(() => {
    const init: Record<string, Mark> = {};
    existingAttendance
      .filter((a) => a.classId === (classes[0]?.id ?? "") && a.date === todayISO())
      .forEach((a) => { init[a.studentId] = { status: a.status, note: a.note }; });
    return init;
  });

  const roster = useMemo(() => students.filter((s) => s.classId === classId), [students, classId]);
  const classSubjects = useMemo(() => subjects.filter((s) => s.classId === classId), [subjects, classId]);

  const hydrate = useCallback((cid: string, d: string) => {
    const next: Record<string, Mark> = {};
    existingAttendance.filter((a) => a.classId === cid && a.date === d).forEach((a) => { next[a.studentId] = { status: a.status, note: a.note }; });
    setMarks(next);
  }, [existingAttendance]);

  function handleClassChange(next: string) { setClassId(next); hydrate(next, date); }
  function handleDateChange(next: string) { setDate(next); hydrate(classId, next); }

  function setStatus(studentId: string, status: AttendanceStatus) {
    setMarks((prev) => ({ ...prev, [studentId]: { status, note: prev[studentId]?.note ?? "" } }));
  }
  function setNote(studentId: string, note: string) {
    setMarks((prev) => ({ ...prev, [studentId]: { status: prev[studentId]?.status ?? null, note } }));
  }
  function markAll(status: AttendanceStatus) {
    setMarks((prev) => {
      const next = { ...prev };
      roster.forEach((s) => { next[s.id] = { status, note: next[s.id]?.note ?? "" }; });
      return next;
    });
  }
  function clearAll() {
    setMarks((prev) => {
      const next = { ...prev };
      roster.forEach((s) => { delete next[s.id]; });
      return next;
    });
  }

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0, excused: 0 };
    roster.forEach((s) => {
      const st = marks[s.id]?.status;
      if (st) c[st] += 1;
    });
    return c;
  }, [roster, marks]);
  const markedCount = counts.present + counts.absent + counts.late + counts.excused;
  const progressPct = roster.length > 0 ? Math.round((markedCount / roster.length) * 100) : 0;

  async function handleSave() {
    if (!canEdit || roster.length === 0) return;
    setSaving(true);
    const records = roster.filter((s) => marks[s.id]?.status).map((s) => ({ studentId: s.id, status: marks[s.id].status as AttendanceStatus, note: marks[s.id].note || undefined }));
    if (records.length === 0) {
      showToast("Mark at least one student before saving.", "error");
      setSaving(false);
      return;
    }
    const result = await enqueue("/api/attendance", { classId, date, records });
    setSaving(false);
    if (result) showToast("Attendance saved.");
    else showToast("Attendance queued — will sync when online.");
  }

  return (
    <div className={styles.root}>
      {!online && (
        <div className={styles.offlineBanner}>
          <WifiOff size={16} /> Working Offline{pending > 0 ? ` — ${pending} queued` : ""}
        </div>
      )}

      <section className={styles.card}>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label>Class</label>
            <select className={styles.select} value={classId} onChange={(e) => handleClassChange(e.target.value)}>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label>Date</label>
            <input className={styles.select} type="date" value={date} onChange={(e) => handleDateChange(e.target.value)} />
          </div>
        </div>

        <div className={styles.field}>
          <label>Session</label>
          <div className={styles.segmented}>
            {(["Morning", "Afternoon", "Evening"] as const).map((s) => (
              <button key={s} type="button" className={`${styles.segBtn} ${session === s ? styles.segBtnActive : ""}`} onClick={() => setSession(s)}>{s}</button>
            ))}
          </div>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label>Subject</label>
            <select className={styles.select} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">—</option>
              {classSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label>Teacher</label>
            <select className={styles.select} value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">—</option>
              {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className={styles.statsScroll}>
        <div className={styles.statChip}><span>TOTAL</span><strong>{roster.length}</strong></div>
        <div className={`${styles.statChip} ${styles.statChipAccent}`}><span>MARKED</span><strong>{markedCount}/{roster.length}</strong></div>
        <div className={`${styles.statChip} ${styles.statChipGood}`}><span>PRESENT</span><strong>{counts.present}</strong></div>
        <div className={`${styles.statChip} ${styles.statChipBad}`}><span>ABSENT</span><strong>{counts.absent}</strong></div>
        <div className={`${styles.statChip} ${styles.statChipWarn}`}><span>LATE</span><strong>{counts.late}</strong></div>
        <div className={styles.statChip}><span>EXCUSED</span><strong>{counts.excused}</strong></div>
      </section>

      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
      </div>
      <div className={styles.progressLabelRow}>
        <span>Marking Progress</span>
        <strong>{progressPct}%</strong>
      </div>

      <section className={styles.quickRow}>
        <button type="button" className={styles.quickBtn} onClick={() => markAll("present")}><CheckCircle2 size={14} /> Mark all present</button>
        <button type="button" className={styles.quickBtnDanger} onClick={clearAll}>Clear</button>
      </section>

      <section className={styles.roster}>
        {roster.length === 0 ? (
          <p className={styles.emptyText}>No students in this class.</p>
        ) : roster.map((s, i) => {
          const mark = marks[s.id];
          const status = mark?.status ?? null;
          const isExpanded = expandedId === s.id;
          return (
            <div
              key={s.id}
              className={`${styles.studentCard} ${status ? styles[`border_${status}`] : ""}`}
            >
              <div className={styles.studentTop}>
                <div className={styles.studentLeft}>
                  <span className={styles.rowIndex}>{i + 1}</span>
                  {s.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.photoUrl} alt="" className={styles.studentAvatarImg} />
                  ) : (
                    <span className={styles.studentAvatar}>{initials(s.firstName, s.lastName)}</span>
                  )}
                  <div>
                    <p className={styles.studentName}>{s.firstName} {s.lastName}</p>
                    <p className={styles.studentAdm}>{s.admissionNo}</p>
                  </div>
                </div>
                <button type="button" className={styles.expandBtn} onClick={() => setExpandedId(isExpanded ? null : s.id)} aria-label="Add note">
                  •••
                </button>
              </div>
              <div className={styles.statusGroup}>
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    disabled={!canEdit}
                    className={`${styles.statusBtn} ${status === opt.key ? styles[`statusBtnActive_${opt.key}`] : ""}`}
                    onClick={() => setStatus(s.id, opt.key)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {isExpanded && (
                <div className={styles.noteField}>
                  <label>Notes (optional)</label>
                  <textarea
                    className={styles.noteInput}
                    rows={2}
                    value={mark?.note ?? ""}
                    onChange={(e) => setNote(s.id, e.target.value)}
                    placeholder="Add a note…"
                  />
                </div>
              )}
            </div>
          );
        })}
      </section>

      {canEdit && (
        <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={saving || roster.length === 0}>
          <Save size={18} /> {saving ? "Saving…" : "Save Attendance"}
        </button>
      )}
      {!online && pending > 0 && (
        <p className={styles.syncHint}><CloudUpload size={13} /> Will sync automatically when back online.</p>
      )}
    </div>
  );
}
