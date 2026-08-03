"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Copy, Users, DoorOpen, AlertTriangle, GraduationCap, X, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import styles from "./MobileTimetableContent.module.css";

interface ClassOption { id: string; name: string; level: string }
interface SubjectOption { id: string; name: string; code: string; classId: string | null; teacherName: string | null }
export interface MobileSlotRow {
  id: string;
  classId: string; className: string;
  subjectId: string; subjectName: string;
  teacherName: string | null;
  day: string; startsAt: string; endsAt: string;
  room: string | null;
  recurrence: string;
  effectiveDate: string | null;
  notes: string | null;
}
interface Props {
  classOptions: ClassOption[];
  subjectOptions: SubjectOption[];
  slots: MobileSlotRow[];
  canEdit: boolean;
  defaultClassId?: string;
}

// Ghana-time (UTC+0, no DST) week helpers — mirrors the desktop timetable's own logic.
function addDaysUTC(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}
function getMondayUTC(): Date {
  const d = new Date();
  const dow = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + (dow === 0 ? -6 : 1 - dow));
  return d;
}
function todayDayNum(): number {
  return new Date().getUTCDate();
}
// Matches desktop TimetableManageContent's isoWeek() exactly, needed to
// replicate its "biweekly slots show on odd ISO weeks" heuristic.
function isoWeek(d: Date): number {
  const thu = addDaysUTC(d, 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(thu.getUTCFullYear(), 0, 1));
  return Math.ceil((((thu.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
function dateToISO(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

const DAYS = [
  { key: "MON", label: "Mon", full: "Monday" },
  { key: "TUE", label: "Tue", full: "Tuesday" },
  { key: "WED", label: "Wed", full: "Wednesday" },
  { key: "THU", label: "Thu", full: "Thursday" },
  { key: "FRI", label: "Fri", full: "Friday" },
] as const;
const DAY_OFFSET: Record<string, number> = { MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4 };

const TIME_SLOTS = [
  { id: "p1", label: "7:00 AM", start: "07:00", end: "08:00", isBreak: false },
  { id: "p2", label: "8:00 AM", start: "08:00", end: "09:00", isBreak: false },
  { id: "p3", label: "9:00 AM", start: "09:00", end: "10:00", isBreak: false },
  { id: "brk1", label: "Break", start: "10:00", end: "10:30", isBreak: true },
  { id: "p4", label: "10:30 AM", start: "10:30", end: "11:30", isBreak: false },
  { id: "p5", label: "11:30 AM", start: "11:30", end: "12:30", isBreak: false },
  { id: "lunch", label: "Lunch", start: "12:30", end: "13:30", isBreak: true },
  { id: "p6", label: "1:30 PM", start: "13:30", end: "14:30", isBreak: false },
  { id: "p7", label: "2:30 PM", start: "14:30", end: "15:30", isBreak: false },
];

function nowHM(): string {
  const d = new Date();
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export function MobileTimetableContent({ classOptions, subjectOptions, slots, canEdit, defaultClassId }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [classId, setClassId] = useState(defaultClassId ?? classOptions[0]?.id ?? "");
  const monday = useMemo(() => getMondayUTC(), []);
  const weekDates = useMemo(() => DAYS.map((d, i) => addDaysUTC(monday, i)), [monday]);
  const todayNum = todayDayNum();
  const defaultDayIdx = weekDates.findIndex((d) => d.getUTCDate() === todayNum && d.getUTCDay() !== 0 && d.getUTCDay() !== 6);
  const [dayIdx, setDayIdx] = useState(defaultDayIdx >= 0 ? defaultDayIdx : 0);

  const [sheetSlotId, setSheetSlotId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addSubjectId, setAddSubjectId] = useState("");
  const [addSlotId, setAddSlotId] = useState(TIME_SLOTS.find((t) => !t.isBreak)?.id ?? "");
  const [addRoom, setAddRoom] = useState("");
  const [addRecurrence, setAddRecurrence] = useState<"weekly" | "biweekly" | "one_time">("weekly");
  const [addDate, setAddDate] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editRoom, setEditRoom] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const selectedDay = DAYS[dayIdx];

  // A teacher double-booked at the same day+time across different classes.
  const conflictSlotIds = useMemo(() => {
    const byKey = new Map<string, MobileSlotRow[]>();
    for (const s of slots) {
      if (!s.teacherName) continue;
      const key = `${s.day}|${s.startsAt}|${s.teacherName}`;
      const group = byKey.get(key) ?? [];
      group.push(s);
      byKey.set(key, group);
    }
    const ids = new Set<string>();
    for (const group of byKey.values()) {
      if (group.length > 1) group.forEach((s) => ids.add(s.id));
    }
    return ids;
  }, [slots]);

  const weekNum = useMemo(() => isoWeek(monday), [monday]);
  const selectedDayISO = useMemo(() => dateToISO(addDaysUTC(monday, DAY_OFFSET[selectedDay.key])), [monday, selectedDay]);

  // Recurrence-aware visibility — mirrors desktop's visibleSlots filter exactly
  // (weekly always shows, biweekly shows on odd ISO weeks, one_time only on
  // its exact effectiveDate). Previously mobile showed every slot regardless
  // of recurrence, which could surface one-time/biweekly periods on the
  // wrong day entirely.
  const daySlots = useMemo(() => {
    return slots.filter((s) => {
      if (s.classId !== classId || s.day !== selectedDay.full) return false;
      if (s.recurrence === "one_time") return s.effectiveDate === selectedDayISO;
      if (s.recurrence === "biweekly") return weekNum % 2 === 1;
      return true; // "weekly"
    }).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }, [slots, classId, selectedDay, selectedDayISO, weekNum]);

  const classSubjects = subjectOptions.filter((s) => !s.classId || s.classId === classId);
  const now = nowHM();
  const isToday = defaultDayIdx === dayIdx;

  const periodCount = daySlots.length;
  const breakCount = TIME_SLOTS.filter((t) => t.isBreak).length;
  const nextSlot = isToday ? daySlots.find((s) => s.startsAt > now) : daySlots[0];

  const sheetSlot = slots.find((s) => s.id === sheetSlotId) ?? null;

  function statusFor(slot: MobileSlotRow): "completed" | "current" | "conflict" | "upcoming" {
    if (conflictSlotIds.has(slot.id)) return "conflict";
    if (isToday) {
      if (slot.endsAt <= now) return "completed";
      if (slot.startsAt <= now && slot.endsAt > now) return "current";
    }
    return "upcoming";
  }

  async function handleDelete() {
    if (!sheetSlot) return;
    const ok = await confirm({ message: "Remove this period from the timetable?", tone: "danger", confirmLabel: "Remove" });
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/timetable/${sheetSlot.id}`, { method: "DELETE" });
      if (!res.ok) { showToast("Failed to remove period.", "error"); return; }
      showToast("Timetable slot updated.");
      setSheetSlotId(null);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  function openAdd() {
    setAddSubjectId(classSubjects[0]?.id ?? "");
    setAddSlotId(TIME_SLOTS.find((t) => !t.isBreak)?.id ?? "");
    setAddRoom("");
    setAddRecurrence("weekly");
    setAddDate(selectedDayISO);
    setAddError(null);
    setAddOpen(true);
  }

  function openEdit() {
    if (!sheetSlot) return;
    setEditRoom(sheetSlot.room ?? "");
    setEditNotes(sheetSlot.notes ?? "");
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!sheetSlot) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/timetable/${sheetSlot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: editRoom.trim() || null, notes: editNotes.trim() || null }),
      });
      if (!res.ok) { showToast("Failed to save changes.", "error"); return; }
      showToast("Timetable slot updated.");
      setEditOpen(false);
      setSheetSlotId(null);
      router.refresh();
    } finally {
      setEditSaving(false);
    }
  }

  async function submitAdd() {
    const ts = TIME_SLOTS.find((t) => t.id === addSlotId);
    if (!addSubjectId || !ts) { setAddError("Select a subject and period."); return; }
    if (!addRoom.trim()) { setAddError("Room is required."); return; }
    if (addRecurrence === "one_time" && !addDate) { setAddError("Date is required for one-time periods."); return; }
    setAddSaving(true); setAddError(null);
    try {
      const res = await fetch("/api/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId, subjectId: addSubjectId, day: selectedDay.full,
          startsAt: ts.start, endsAt: ts.end, room: addRoom.trim(),
          recurrence: addRecurrence, effectiveDate: addRecurrence === "one_time" ? addDate : undefined,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setAddError(payload?.message ?? payload?.error ?? "Failed to add period.");
        setAddSaving(false);
        return;
      }
      setAddOpen(false);
      setAddSaving(false);
      showToast("Timetable slot added.");
      router.refresh();
    } catch {
      setAddError("Network error. Please try again.");
      setAddSaving(false);
    }
  }

  return (
    <div className={styles.root}>
      <section className={styles.filterCard}>
        <div className={styles.field}>
          <label>Class</label>
          <select className={styles.select} value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </section>

      <div className={styles.dayRow}>
        {DAYS.map((d, i) => (
          <button
            key={d.key}
            type="button"
            className={`${styles.dayBtn} ${dayIdx === i ? styles.dayBtnActive : ""}`}
            onClick={() => setDayIdx(i)}
          >
            <span className={styles.dayLabel}>{d.label}</span>
            <span className={styles.dayNum}>{weekDates[i].getUTCDate()}</span>
          </button>
        ))}
      </div>

      <div className={styles.overviewCard}>
        <div>
          <h3 className={styles.overviewTitle}>{periodCount} period{periodCount !== 1 ? "s" : ""}, {breakCount} breaks</h3>
          <p className={styles.overviewSub}>{nextSlot ? `Next: ${nextSlot.subjectName} at ${nextSlot.startsAt}` : "No more periods today"}</p>
        </div>
        <span className={styles.overviewIcon}><GraduationCap size={20} /></span>
      </div>

      <div className={styles.timeline}>
        {daySlots.length === 0 ? (
          <p className={styles.emptyText}>No periods scheduled for {selectedDay.full}.</p>
        ) : daySlots.map((slot) => {
          const status = statusFor(slot);
          return (
            <button
              key={slot.id}
              type="button"
              className={`${styles.slotCard} ${styles[`slot_${status}`]}`}
              onClick={() => setSheetSlotId(slot.id)}
            >
              <div className={styles.slotTop}>
                <span className={styles.slotTime}>{slot.startsAt} - {slot.endsAt}</span>
                {status === "completed" && <span className={styles.completedTag}>Completed</span>}
                {status === "current" && <span className={styles.liveDot} />}
              </div>
              <h4 className={styles.slotSubject}>{slot.subjectName}</h4>
              {slot.teacherName && <p className={styles.slotTeacher}>{slot.teacherName}</p>}
              <div className={styles.slotMeta}>
                <span><Users size={13} /> {slot.className}</span>
                {slot.room && <span><DoorOpen size={13} /> {slot.room}</span>}
              </div>
              {status === "conflict" && (
                <div className={styles.conflictBanner}><AlertTriangle size={13} /> Teacher double-booked</div>
              )}
            </button>
          );
        })}
      </div>

      {canEdit && (
        <div className={styles.actionRow}>
          <button type="button" className={styles.btnPrimary} onClick={openAdd}>
            <Plus size={16} /> Add Period
          </button>
          <button type="button" className={styles.btnOutline} onClick={() => showToast("Copy Week is not available yet.")}>
            <Copy size={16} /> Copy Week
          </button>
        </div>
      )}

      {sheetSlot && (
        <div className={styles.sheetBackdrop} onClick={() => { setSheetSlotId(null); setEditOpen(false); }}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHandle} />
            <h3 className={styles.sheetSlotTitle}>{sheetSlot.subjectName}</h3>
            <p className={styles.sheetSlotMeta}>{sheetSlot.startsAt} - {sheetSlot.endsAt} • {sheetSlot.className}</p>
            {editOpen ? (
              <>
                <div className={styles.field}>
                  <label>Room</label>
                  <input className={styles.select} value={editRoom} onChange={(e) => setEditRoom(e.target.value)} placeholder="e.g. Room 102" />
                </div>
                <div className={styles.field}>
                  <label>Notes (optional)</label>
                  <input className={styles.select} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="e.g. Bring textbooks, double period…" />
                </div>
                <div className={styles.sheetFooter}>
                  <button type="button" className={styles.btnOutline} onClick={() => setEditOpen(false)} disabled={editSaving}>Cancel</button>
                  <button type="button" className={styles.btnPrimary} onClick={saveEdit} disabled={editSaving}>{editSaving ? "Saving…" : "Save Changes"}</button>
                </div>
              </>
            ) : canEdit ? (
              <div className={styles.sheetActions}>
                <button type="button" className={styles.sheetAction} onClick={openEdit}>
                  <Edit2 size={18} /> Edit Period
                </button>
                <button type="button" className={styles.sheetActionDanger} onClick={handleDelete} disabled={deleting}>
                  <Trash2 size={18} /> {deleting ? "Removing…" : "Delete Period"}
                </button>
              </div>
            ) : (
              <p className={styles.emptyText}>You don&apos;t have permission to edit this period.</p>
            )}
          </div>
        </div>
      )}

      {addOpen && (
        <div className={styles.sheetBackdrop} onClick={() => !addSaving && setAddOpen(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHeaderRow}>
              <h3 className={styles.sheetSlotTitle}>Add Period — {selectedDay.full}</h3>
              <button type="button" className={styles.sheetClose} onClick={() => setAddOpen(false)} aria-label="Close"><X size={20} /></button>
            </div>
            {addError && <p className={styles.errorText}>{addError}</p>}
            <div className={styles.field}>
              <label>Subject</label>
              <select className={styles.select} value={addSubjectId} onChange={(e) => setAddSubjectId(e.target.value)}>
                {classSubjects.length === 0 && <option value="">No subjects</option>}
                {classSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Period</label>
              <select className={styles.select} value={addSlotId} onChange={(e) => setAddSlotId(e.target.value)}>
                {TIME_SLOTS.filter((t) => !t.isBreak).map((t) => <option key={t.id} value={t.id}>{t.label} ({t.start}–{t.end})</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Room</label>
              <input className={styles.select} value={addRoom} onChange={(e) => setAddRoom(e.target.value)} placeholder="e.g. Room 102" />
            </div>
            <div className={styles.field}>
              <label>Recurrence</label>
              <select className={styles.select} value={addRecurrence} onChange={(e) => setAddRecurrence(e.target.value as typeof addRecurrence)}>
                <option value="weekly">Every Week</option>
                <option value="biweekly">Every 2 Weeks</option>
                <option value="one_time">One-Time</option>
              </select>
            </div>
            {addRecurrence === "one_time" && (
              <div className={styles.field}>
                <label>Date</label>
                <input className={styles.select} type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} />
              </div>
            )}
            <div className={styles.sheetFooter}>
              <button type="button" className={styles.btnOutline} onClick={() => setAddOpen(false)} disabled={addSaving}>Cancel</button>
              <button type="button" className={styles.btnPrimary} onClick={submitAdd} disabled={addSaving}>{addSaving ? "Saving…" : "Add Period"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
