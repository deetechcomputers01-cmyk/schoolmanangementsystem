"use client";

import { useState, useMemo, Fragment, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown, AlertTriangle, X, Calendar, Clock, MapPin, User,
  Repeat, FileText, ChevronLeft, ChevronRight, Plus, Trash2,
  BookOpen, RefreshCw, Download, LayoutGrid, Coffee, DoorOpen,
} from "lucide-react";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import styles from "./TimetableManageScreen.module.css";

// ── Types ──────────────────────────────────────────────────────────────────────
interface ClassOption   { id: string; name: string; level: string }
interface SubjectOption { id: string; name: string; code: string; classId: string | null; teacherName: string | null }
interface SlotRow {
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
  slots: SlotRow[];
  canEdit: boolean;
  defaultClassId?: string;
  allowedClassIds?: string[];
}

// ── Ghana-time week helpers (UTC+0, no DST) ───────────────────────────────────
function ghanaToday(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
}
function addDaysUTC(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}
function getMondayUTC(dateISO: string): Date {
  const d = new Date(dateISO + "T00:00:00Z");
  const dow = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + (dow === 0 ? -6 : 1 - dow));
  return d;
}
function isoWeek(d: Date): number {
  const thu = addDaysUTC(d, 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(thu.getUTCFullYear(), 0, 1));
  return Math.ceil((((thu.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtShort(d: Date): string { return `${MONTH_SHORT[d.getUTCMonth()]} ${d.getUTCDate()}`; }
function dateToISO(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS = ["MON", "TUE", "WED", "THU", "FRI"] as const;
const DAY_LABELS: Record<string, string> = {
  MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday",
};
// Map DB day name → grid key
const DAY_KEY: Record<string, string> = {
  Monday: "MON", Tuesday: "TUE", Wednesday: "WED", Thursday: "THU", Friday: "FRI",
};

const TIME_SLOTS = [
  { id: "p1",    label: "7:00 AM",   start: "07:00", end: "08:00", isBreak: false },
  { id: "p2",    label: "8:00 AM",   start: "08:00", end: "09:00", isBreak: false },
  { id: "p3",    label: "9:00 AM",   start: "09:00", end: "10:00", isBreak: false },
  { id: "brk1",  label: "Break",     start: "10:00", end: "10:30", isBreak: true  },
  { id: "p4",    label: "10:30 AM",  start: "10:30", end: "11:30", isBreak: false },
  { id: "p5",    label: "11:30 AM",  start: "11:30", end: "12:30", isBreak: false },
  { id: "lunch", label: "Lunch",     start: "12:30", end: "13:30", isBreak: true  },
  { id: "p6",    label: "1:30 PM",   start: "13:30", end: "14:30", isBreak: false },
  { id: "p7",    label: "2:30 PM",   start: "14:30", end: "15:30", isBreak: false },
];

// Colour palette per class (cycles through these)
const CLASS_COLOURS = [
  { bg: "#e8f4fd", border: "#1a7fc4", text: "#0d4a78" },
  { bg: "#edf7ed", border: "#2e7d32", text: "#1b5e20" },
  { bg: "#fef3e2", border: "#e65100", text: "#bf360c" },
  { bg: "#f3e5f5", border: "#7b1fa2", text: "#4a148c" },
  { bg: "#fce4ec", border: "#c62828", text: "#880e4f" },
  { bg: "#e0f2f1", border: "#00695c", text: "#004d40" },
];

export function TimetableManageContent({
  classOptions, subjectOptions, slots, canEdit, defaultClassId, allowedClassIds
}: Props) {
  const router = useRouter();
  const confirm = useConfirm();

  const visibleClasses = allowedClassIds?.length
    ? classOptions.filter(c => allowedClassIds.includes(c.id))
    : classOptions;
  const displayClasses = visibleClasses.length > 0 ? visibleClasses : classOptions;

  // Build colour map by classId index
  const colourMap = new Map<string, typeof CLASS_COLOURS[0]>();
  displayClasses.forEach((c, i) => colourMap.set(c.id, CLASS_COLOURS[i % CLASS_COLOURS.length]));

  // Grid state
  const [selectedClassId, setSelectedClassId] = useState<string>(
    defaultClassId ?? displayClasses[0]?.id ?? ""
  );
  const [viewMode, setViewMode] = useState<"class" | "all">("class");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // Inspector form state
  const [inspRoom,  setInspRoom]  = useState("");
  const [inspNotes, setInspNotes] = useState("");
  const [inspSaving,  setInspSaving]  = useState(false);
  const [inspSaved,   setInspSaved]   = useState(false);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);

  // Inline slots state (so we can optimistically remove deleted ones)
  const [localSlots, setLocalSlots] = useState<SlotRow[]>(slots);

  // Week navigation
  const todayISO      = ghanaToday();
  const currentMonday = getMondayUTC(todayISO);
  const [weekOffset, setWeekOffset] = useState(0);
  const weekMonday = addDaysUTC(currentMonday, weekOffset * 7);
  const weekFriday = addDaysUTC(weekMonday, 4);
  const weekNum    = isoWeek(weekMonday);
  const weekLabel  = `Week ${weekNum} · ${fmtShort(weekMonday)} – ${fmtShort(weekFriday)}, ${weekFriday.getUTCFullYear()}`;

  const DAY_OFFSET_MAP: Record<string, number> = { MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4 };
  function getDateForDay(day: string) { return dateToISO(addDaysUTC(weekMonday, DAY_OFFSET_MAP[day])); }

  // Add-slot modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addDay,       setAddDay]       = useState("");
  const [addStart,     setAddStart]     = useState("");
  const [addEnd,       setAddEnd]       = useState("");
  const [formClassId,  setFormClassId]  = useState("");
  const [formSubjId,   setFormSubjId]   = useState("");
  const [formRoom,     setFormRoom]     = useState("");
  const [formRecurrence, setFormRecurrence] = useState<"weekly" | "biweekly" | "one_time">("weekly");
  const [formDate,     setFormDate]     = useState("");
  const [formNotes,    setFormNotes]    = useState("");
  const [saving,       setSaving]       = useState(false);
  const [addError,     setAddError]     = useState("");

  // ── Derived data ────────────────────────────────────────────────────────────

  // Which slots are visible for the current view + week
  const visibleSlots = localSlots.filter((s) => {
    if (viewMode === "class" && selectedClassId && s.classId !== selectedClassId) return false;
    if (s.recurrence === "one_time") {
      if (!s.effectiveDate) return false;
      const dayKey = DAY_KEY[s.day];
      if (!dayKey) return false;
      return s.effectiveDate === getDateForDay(dayKey);
    }
    if (s.recurrence === "biweekly") {
      // Show on even ISO weeks from week 1
      return weekNum % 2 === 1;
    }
    return true; // "weekly" — always visible
  });

  const selectedSlot = localSlots.find(s => s.id === selectedSlotId) ?? null;

  function getSlotForCell(day: string, ts: typeof TIME_SLOTS[0]): SlotRow | null {
    return visibleSlots.find(s => s.day === DAY_LABELS[day] && s.startsAt === ts.start) ?? null;
  }

  const formSubjects = formClassId
    ? subjectOptions.filter(s => !s.classId || s.classId === formClassId)
    : subjectOptions;

  // A teacher double-booked at the same day+time across different classes —
  // checked against the FULL slot set (not just the current view) so a
  // "By Class" view still surfaces a conflict caused by another class.
  const conflictSlotIds = useMemo(() => {
    const byKey = new Map<string, SlotRow[]>();
    for (const s of localSlots) {
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
  }, [localSlots]);

  const periodSlotCount = TIME_SLOTS.filter((t) => !t.isBreak).length * DAYS.length;
  const occupiedCells = new Set(visibleSlots.map((s) => `${s.day}|${s.startsAt}`)).size;
  const kpis = {
    periodsPerWeek: visibleSlots.length,
    freePeriods: Math.max(0, periodSlotCount - occupiedCells),
    teacherConflicts: visibleSlots.filter((s) => conflictSlotIds.has(s.id)).length,
    roomUtilization: periodSlotCount > 0 ? Math.round((occupiedCells / periodSlotCount) * 100) : 0,
  };

  // ── Actions ─────────────────────────────────────────────────────────────────

  function openInspector(slot: SlotRow) {
    setSelectedSlotId(slot.id);
    setInspRoom(slot.room ?? "");
    setInspNotes(slot.notes ?? "");
    setInspSaved(false);
  }

  function openAdd(day: string, ts: typeof TIME_SLOTS[number]) {
    setAddDay(day);
    setAddStart(ts.start);
    setAddEnd(ts.end);
    setFormClassId(selectedClassId || displayClasses[0]?.id || "");
    setFormSubjId("");
    setFormRoom("");
    setFormRecurrence("weekly");
    setFormDate(getDateForDay(day));
    setFormNotes("");
    setAddError("");
    setShowAddModal(true);
  }

  async function saveInspector() {
    if (!selectedSlotId) return;
    setInspSaving(true);
    try {
      const res = await fetch(`/api/timetable/${selectedSlotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: inspRoom.trim() || null, notes: inspNotes.trim() || null }),
      });
      if (res.ok) {
        setLocalSlots(prev => prev.map(s =>
          s.id === selectedSlotId ? { ...s, room: inspRoom.trim(), notes: inspNotes.trim() } : s
        ));
        setInspSaved(true);
        setTimeout(() => setInspSaved(false), 2000);
      }
    } finally { setInspSaving(false); }
  }

  async function deleteSlot(id: string) {
    if (!(await confirm({ message: "Remove this period from the timetable?", tone: "danger", confirmLabel: "Remove" }))) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/timetable/${id}`, { method: "DELETE" });
      if (res.ok) {
        setLocalSlots(prev => prev.filter(s => s.id !== id));
        if (selectedSlotId === id) setSelectedSlotId(null);
      }
    } finally { setDeletingId(null); }
  }

  async function submitAdd() {
    if (!formClassId || !formSubjId) { setAddError("Please select a class and subject."); return; }
    if (!formRoom.trim())            { setAddError("Room is required."); return; }
    if (formRecurrence === "one_time" && !formDate) { setAddError("Date is required for one-time slots."); return; }
    setSaving(true); setAddError("");
    try {
      const res = await fetch("/api/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId:       formClassId,
          subjectId:     formSubjId,
          day:           DAY_LABELS[addDay],
          startsAt:      addStart,
          endsAt:        addEnd,
          room:          formRoom.trim(),
          recurrence:    formRecurrence,
          effectiveDate: formRecurrence === "one_time" ? formDate : undefined,
          notes:         formNotes.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const newSlot = data.slot;
        // Map returned slot to SlotRow shape
        const classOpt  = classOptions.find(c => c.id === newSlot.classId);
        const subjOpt   = subjectOptions.find(s => s.id === newSlot.subjectId);
        setLocalSlots(prev => [...prev, {
          id:            newSlot.id,
          classId:       newSlot.classId,
          className:     classOpt?.name ?? "",
          subjectId:     newSlot.subjectId,
          subjectName:   subjOpt?.name ?? "",
          teacherName:   subjOpt?.teacherName ?? null,
          day:           newSlot.day,
          startsAt:      newSlot.startsAt,
          endsAt:        newSlot.endsAt,
          room:          newSlot.room,
          recurrence:    newSlot.recurrence ?? "weekly",
          effectiveDate: newSlot.effectiveDate ?? null,
          notes:         newSlot.notes ?? null,
        }]);
        setShowAddModal(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setAddError(data.error ?? "Failed to save slot.");
      }
    } catch { setAddError("Network error. Please try again."); }
    finally { setSaving(false); }
  }

  const recurrenceLabel: Record<string, string> = {
    weekly:   "Weekly",
    biweekly: "Bi-weekly",
    one_time: "One-time",
  };

  return (
    <div className={styles.root}>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Timetable</h1>
          <p className={styles.pageSubtitle}>Build and manage the weekly class schedule</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnExport} onClick={() => window.print()} type="button">
            <Download size={14} /> Export PDF
          </button>
          {canEdit && (
            <button className={styles.btnPrimary} onClick={() => openAdd("MON", TIME_SLOTS.find(t => !t.isBreak)!)} type="button">
              <Plus size={14} /> Add Period
            </button>
          )}
        </div>
      </div>

      {/* ── KPI tiles ────────────────────────────────────────────────────── */}
      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}><LayoutGrid size={18} /><span className={styles.kpiLabel}>Periods / Week</span></div>
          <div className={styles.kpiValue}>{kpis.periodsPerWeek}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}><Coffee size={18} /><span className={styles.kpiLabel}>Free Periods</span></div>
          <div className={styles.kpiValue}>{kpis.freePeriods}</div>
        </div>
        <div className={`${styles.kpiCard} ${kpis.teacherConflicts > 0 ? styles.kpiCardWarn : ""}`}>
          <div className={`${styles.kpiTop} ${kpis.teacherConflicts > 0 ? styles.kpiTopWarn : ""}`}><AlertTriangle size={18} /><span className={styles.kpiLabel}>Teacher Conflicts</span></div>
          <div className={`${styles.kpiValue} ${kpis.teacherConflicts > 0 ? styles.kpiValueWarn : ""}`}>{kpis.teacherConflicts}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}><DoorOpen size={18} /><span className={styles.kpiLabel}>Room Utilization</span></div>
          <div className={styles.kpiValue}>{kpis.roomUtilization}%</div>
        </div>
      </div>

      {/* ── Control Panel ─────────────────────────────────────────────────── */}
      <div className={styles.controlPanel}>
        <div className={styles.controlLeft}>
          {/* View mode toggle */}
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === "class" ? styles.viewBtnActive : ""}`}
              onClick={() => setViewMode("class")}
            >By Class</button>
            <button
              className={`${styles.viewBtn} ${viewMode === "all" ? styles.viewBtnActive : ""}`}
              onClick={() => setViewMode("all")}
            >All Classes</button>
          </div>

          {/* Class selector (only when viewing by class) */}
          {viewMode === "class" && (
            <div className={styles.selectWrap}>
              <label className={styles.selectLabel}>Class</label>
              <div className={styles.selectControl}>
                <select
                  className={styles.select}
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                >
                  {displayClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className={styles.selectChevron} />
              </div>
            </div>
          )}

          {/* Week navigation */}
          <div className={styles.weekNav}>
            <button
              className={styles.weekBtn}
              onClick={() => setWeekOffset(o => o - 1)}
              disabled={weekOffset === 0}
              style={{ opacity: weekOffset === 0 ? 0.35 : 1 }}
            ><ChevronLeft size={16} /></button>
            <span className={styles.weekLabel}>{weekLabel}</span>
            <button className={styles.weekBtn} onClick={() => setWeekOffset(o => o + 1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className={styles.controlRight}>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--clr-app-muted)" }}>
            {visibleSlots.length} period{visibleSlots.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Main: Grid + Inspector ────────────────────────────────────────── */}
      <div className={styles.mainLayout}>

        {/* Left: Timetable Grid */}
        <div className={styles.gridWrap}>
          <div className={styles.gridScroll}>
            <div className={styles.grid}>
              {/* Header row */}
              <div className={styles.gridTimeHeader} />
              {DAYS.map(d => {
                const dateISO = getDateForDay(d);
                const isToday = dateISO === todayISO;
                return (
                  <div key={d} className={styles.gridDayHeader} style={isToday ? { background: "var(--clr-app-accent-soft)" } : {}}>
                    <span className={styles.gridDayName} style={isToday ? { color: "var(--clr-app-accent)" } : {}}>{DAY_LABELS[d]}</span>
                    <span className={styles.gridDayDate}>{fmtShort(addDaysUTC(weekMonday, DAY_OFFSET_MAP[d]))}</span>
                  </div>
                );
              })}

              {/* Time rows */}
              {TIME_SLOTS.map(ts => (
                <Fragment key={ts.id}>
                  <div className={`${styles.gridTimeLabel} ${ts.isBreak ? styles.gridTimeLabelBreak : ""}`}>
                    {ts.isBreak ? (
                      <span className={styles.breakLabel}>{ts.label}</span>
                    ) : (
                      <>
                        <span className={styles.timeLabelMain}>{ts.label}</span>
                        <span className={styles.timeLabelSub}>{ts.start} – {ts.end}</span>
                      </>
                    )}
                  </div>

                  {DAYS.map(d => {
                    const slot = getSlotForCell(d, ts);
                    const colour = slot ? (colourMap.get(slot.classId) ?? CLASS_COLOURS[0]) : null;

                    if (ts.isBreak) {
                      return <div key={`${ts.id}-${d}`} className={styles.gridBreakCell} />;
                    }

                    if (!slot) {
                      return (
                        <div
                          key={`${ts.id}-${d}`}
                          className={styles.gridEmptyCell}
                          onClick={() => canEdit && openAdd(d, ts)}
                        >
                          {canEdit && (
                            <button
                              className={styles.addSlotBtn}
                              title={`Add period — ${DAY_LABELS[d]} ${ts.start}`}
                            >
                              <Plus size={14} />
                            </button>
                          )}
                        </div>
                      );
                    }

                    const isSelected = slot.id === selectedSlotId;
                    const hasConflict = conflictSlotIds.has(slot.id);
                    const isUnassigned = !slot.teacherName;
                    return (
                      <div
                        key={`${ts.id}-${d}`}
                        className={`${styles.gridCell} ${isSelected ? styles.gridCellSelected : ""} ${hasConflict ? styles.gridCellConflict : isUnassigned ? styles.gridCellUnassigned : ""}`}
                        style={{
                          background:   isSelected ? colour!.bg : colour!.bg,
                          borderLeft:   `3px solid ${colour!.border}`,
                          boxShadow:    isSelected ? `inset 0 0 0 2px ${colour!.border}` : "none",
                        }}
                        onClick={() => openInspector(slot)}
                        title={hasConflict ? `${slot.teacherName} is also scheduled elsewhere at this time` : undefined}
                      >
                        <div className={styles.periodSubject} style={{ color: hasConflict ? undefined : colour!.text }}>{slot.subjectName}</div>
                        {viewMode === "all" && (
                          <div className={styles.periodClass} style={{ color: hasConflict ? undefined : colour!.border }}>{slot.className}</div>
                        )}
                        {slot.teacherName && (
                          <div className={styles.periodTeacher}>{slot.teacherName.split(" ").pop()}</div>
                        )}
                        {slot.room && (
                          <div className={styles.periodRoom}>{slot.room}</div>
                        )}
                        {hasConflict && (
                          <span className={styles.conflictLabel}><AlertTriangle size={10} /> Conflict</span>
                        )}
                        {slot.recurrence !== "weekly" && (
                          <div className={styles.recurrencePill}
                            style={{ background: slot.recurrence === "one_time" ? "var(--clr-warning-bg)" : "var(--clr-info-bg)", color: slot.recurrence === "one_time" ? "var(--clr-warning)" : "var(--clr-info)" }}>
                            {slot.recurrence === "one_time" ? "Once" : "Alt"}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Inspector Panel */}
        <aside className={styles.inspector}>
          {selectedSlot ? (
            <>
              <div className={styles.inspHeader}>
                <h3 className={styles.inspTitle}>Period Details</h3>
                <button className={styles.inspClose} onClick={() => setSelectedSlotId(null)}>
                  <X size={16} />
                </button>
              </div>

              {conflictSlotIds.has(selectedSlot.id) && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "var(--clr-error-bg)", color: "var(--clr-error)", fontSize: "var(--text-xs)", fontWeight: 600 }}>
                  <AlertTriangle size={13} /> {selectedSlot.teacherName} is double-booked at this time on another class.
                </div>
              )}

              <div className={styles.inspSubjectChip}
                style={{ background: (colourMap.get(selectedSlot.classId) ?? CLASS_COLOURS[0]).bg }}>
                <span className={styles.inspSubjectName}
                  style={{ color: (colourMap.get(selectedSlot.classId) ?? CLASS_COLOURS[0]).text }}>
                  {selectedSlot.subjectName}
                </span>
                <span className={styles.inspSubjectCode}>{selectedSlot.className}</span>
              </div>

              <div className={styles.inspMeta}>
                <div className={styles.inspMetaRow}>
                  <Calendar size={14} className={styles.inspMetaIcon} />
                  <span>{selectedSlot.day}</span>
                </div>
                <div className={styles.inspMetaRow}>
                  <Clock size={14} className={styles.inspMetaIcon} />
                  <span>{selectedSlot.startsAt} – {selectedSlot.endsAt}</span>
                </div>
                {selectedSlot.room && (
                  <div className={styles.inspMetaRow}>
                    <MapPin size={14} className={styles.inspMetaIcon} />
                    <span>{selectedSlot.room}</span>
                  </div>
                )}
                <div className={styles.inspMetaRow}>
                  <Repeat size={14} className={styles.inspMetaIcon} />
                  <span>{recurrenceLabel[selectedSlot.recurrence] ?? selectedSlot.recurrence}
                    {selectedSlot.recurrence === "one_time" && selectedSlot.effectiveDate
                      ? ` · ${selectedSlot.effectiveDate}` : ""}
                  </span>
                </div>
                {selectedSlot.teacherName && (
                  <div className={styles.inspMetaRow}>
                    <User size={14} className={styles.inspMetaIcon} />
                    <span>{selectedSlot.teacherName}</span>
                  </div>
                )}
              </div>

              {canEdit ? (
                <>
                  <div className={styles.inspForm}>
                    <div className={styles.inspField}>
                      <label className={styles.inspFieldLabel}><MapPin size={13} /> Room</label>
                      <input
                        className={styles.inspInput}
                        value={inspRoom}
                        onChange={e => setInspRoom(e.target.value)}
                        placeholder="e.g. Blk A-01"
                      />
                    </div>
                    <div className={styles.inspField}>
                      <label className={styles.inspFieldLabel}><FileText size={13} /> Notes</label>
                      <textarea
                        className={styles.inspTextarea}
                        value={inspNotes}
                        onChange={e => setInspNotes(e.target.value)}
                        placeholder="Optional notes…"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className={styles.inspFooter}>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => deleteSlot(selectedSlot.id)}
                      disabled={deletingId === selectedSlot.id}
                    >
                      <Trash2 size={13} />
                      {deletingId === selectedSlot.id ? "Removing…" : "Remove"}
                    </button>
                    <button className={styles.btnPrimary} onClick={saveInspector} disabled={inspSaving} style={{ flex: 1, justifyContent: "center" }}>
                      {inspSaving ? "Saving…" : inspSaved ? "Saved ✓" : "Save"}
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles.inspReadOnly}>
                  <BookOpen size={20} style={{ color: "var(--clr-app-border)", marginBottom: 8 }} />
                  <p>Read-only view</p>
                </div>
              )}
            </>
          ) : (
            <div className={styles.inspEmpty}>
              <Calendar size={28} className={styles.inspEmptyIcon} />
              <p>Click a period to view details{canEdit ? " or click an empty cell to add" : ""}.</p>
            </div>
          )}
        </aside>
      </div>

      {/* ── Add Slot Modal ────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => !saving && setShowAddModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                Add Period — {DAY_LABELS[addDay]}, {addStart}–{addEnd}
              </h3>
              <button className={styles.inspClose} onClick={() => setShowAddModal(false)} disabled={saving}>
                <X size={16} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Recurrence selector — prominent at top */}
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Recurrence</label>
                <div className={styles.recurrenceToggle}>
                  {(["weekly","biweekly","one_time"] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      className={`${styles.recurrenceBtn} ${formRecurrence === r ? styles.recurrenceBtnActive : ""}`}
                      onClick={() => setFormRecurrence(r)}
                    >
                      {r === "weekly" ? "Every Week" : r === "biweekly" ? "Every 2 Weeks" : "One-Time"}
                    </button>
                  ))}
                </div>
                {formRecurrence === "weekly" && (
                  <p className={styles.recurrenceHint}>Repeats automatically every {DAY_LABELS[addDay]}. No maintenance needed.</p>
                )}
                {formRecurrence === "biweekly" && (
                  <p className={styles.recurrenceHint}>Appears every other {DAY_LABELS[addDay]}.</p>
                )}
                {formRecurrence === "one_time" && (
                  <>
                    <p className={styles.recurrenceHint}>Appears only on the selected date.</p>
                    <input
                      type="date"
                      className={styles.modalInput}
                      value={formDate}
                      onChange={e => setFormDate(e.target.value)}
                    />
                  </>
                )}
              </div>

              {/* Class */}
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Class</label>
                <select
                  className={styles.modalSelect}
                  value={formClassId}
                  onChange={e => { setFormClassId(e.target.value); setFormSubjId(""); }}
                >
                  <option value="">Select class…</option>
                  {displayClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Subject</label>
                <select
                  className={styles.modalSelect}
                  value={formSubjId}
                  onChange={e => setFormSubjId(e.target.value)}
                  disabled={!formClassId}
                >
                  <option value="">Select subject…</option>
                  {formSubjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.teacherName ? ` — ${s.teacherName}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room */}
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Room</label>
                <input
                  className={styles.modalInput}
                  value={formRoom}
                  onChange={e => setFormRoom(e.target.value)}
                  placeholder="e.g. Blk A-01, Science Lab, Field…"
                />
              </div>

              {/* Notes */}
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Notes (optional)</label>
                <input
                  className={styles.modalInput}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="e.g. Bring textbooks, double period…"
                />
              </div>

              {addError && <p className={styles.modalError}>{addError}</p>}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setShowAddModal(false)} disabled={saving}>
                Cancel
              </button>
              <button
                className={styles.btnPrimary}
                onClick={submitAdd}
                disabled={saving || !formClassId || !formSubjId}
              >
                {saving ? "Adding…" : <><Plus size={13} /> Add Period</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
