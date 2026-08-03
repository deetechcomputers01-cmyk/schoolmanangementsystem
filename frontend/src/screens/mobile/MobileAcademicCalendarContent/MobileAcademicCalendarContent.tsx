"use client";

/**
 * MobileAcademicCalendarContent — bespoke mobile view for the Academic Calendar.
 *
 * Every field/action here traces back to AcademicCalendarContent.tsx (the real
 * desktop component) and the real /api/calendar endpoints:
 *   - event list, month navigation -> same GET /api/calendar?year&month as
 *     desktop's reloadEvents()
 *   - category enum + colors (academic/exams/sports/pta/staff/holidays) ->
 *     copied verbatim from desktop's `CAT` config, not the mockup's arbitrary
 *     Events/Holidays/Exams/Closures mapping
 *   - Add Event sheet -> same fields + POST /api/calendar as desktop's
 *     handleSaveEvent() (title, category, date, start/end time, location,
 *     audience, description)
 *   - Delete -> same DELETE /api/calendar/:id as desktop's handleDeleteEvent()
 *   - "Pending approval" pill -> real `approved` field, shown by desktop too
 *
 * The Stitch mockup's expanded-card "Edit" and "Notify"/"Reminder" actions
 * have NO real backing anywhere: there is no PATCH/update route or service
 * function for calendar events (only create + delete exist), and no
 * notification hook fires off a calendar event anywhere in the codebase.
 * They are intentionally NOT reproduced — only Delete (the one action that
 * is real) appears on an expanded card. The mockup's "Closures" category and
 * "Term Dates"/"Meetings" filter chips also don't exist in the real category
 * enum; holidays covers school closures, and the filter row uses the actual
 * 6 categories instead. Years & Terms management (YearsTermsPanel) is a
 * distinct desktop tab, out of scope for this day-by-day agenda view.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Clock, Users, MapPin, Trash2, CalendarX, CheckCircle2, Bell,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import styles from "./MobileAcademicCalendarContent.module.css";

type CategoryKey = "academic" | "exams" | "sports" | "pta" | "staff" | "holidays";

interface CalEvent {
  id: string;
  title: string;
  description: string;
  category: CategoryKey;
  dateISO: string;   // "YYYY-MM-DD"
  time?: string;
  endTime?: string;
  location?: string;
  audience?: string;
  approved: boolean;
}

interface Props {
  yearName: string;
  termName: string;
  todayISO: string;  // "YYYY-MM-DD" in Ghana time
  initialEvents: CalEvent[];
}

// ── Category config — copied verbatim from desktop AcademicCalendarContent's CAT ──
const CAT: Record<CategoryKey, { label: string; bg: string; text: string; border: string; dot: string }> = {
  academic: { label: "Academic",  bg: "rgba(74,144,226,0.18)",  text: "#1565C0", border: "rgba(74,144,226,0.35)",  dot: "#4A90E2" },
  exams:    { label: "Exams",     bg: "rgba(229,115,115,0.18)", text: "#C62828", border: "rgba(229,115,115,0.35)", dot: "#E57373" },
  sports:   { label: "Sports",    bg: "rgba(129,199,132,0.18)", text: "#2E7D32", border: "rgba(129,199,132,0.35)", dot: "#81C784" },
  pta:      { label: "PTA",       bg: "#FFB74D",                text: "#E65100", border: "#F57C00",                dot: "#FFB74D" },
  staff:    { label: "Staff",     bg: "rgba(149,117,205,0.18)", text: "#4527A0", border: "rgba(149,117,205,0.35)", dot: "#9575CD" },
  holidays: { label: "Holidays",  bg: "rgba(240,98,146,0.18)",  text: "#C2185B", border: "rgba(240,98,146,0.35)", dot: "#F06292" },
};
const CATEGORY_KEYS = Object.keys(CAT) as CategoryKey[];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function MobileAcademicCalendarContent({ yearName, termName, todayISO, initialEvents }: Props) {
  const todayYear  = parseInt(todayISO.slice(0, 4));
  const todayMonth = parseInt(todayISO.slice(5, 7)) - 1;
  const todayDay   = parseInt(todayISO.slice(8, 10));

  const { showToast } = useToast();
  const confirm = useConfirm();

  const [month, setMonth] = useState(todayMonth);
  const [year,  setYear]  = useState(todayYear);
  const [events, setEvents] = useState<CalEvent[]>(initialEvents);
  const [selectedDay, setSelectedDay] = useState(todayDay);
  const [activeCategories, setActiveCategories] = useState<Set<CategoryKey>>(new Set(CATEGORY_KEYS));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const atCurrentMonth = year === todayYear && month === todayMonth;
  const selectedISO = toISO(year, month, selectedDay);
  const isPastSelected = selectedISO < todayISO;

  // ── Add Event sheet state — same fields as desktop's Create Event modal ──
  const [addOpen, setAddOpen] = useState(false);
  const [mTitle, setMTitle] = useState("");
  const [mCategory, setMCategory] = useState<CategoryKey>("academic");
  const [mDate, setMDate] = useState("");
  const [mTime, setMTime] = useState("");
  const [mEndTime, setMEndTime] = useState("");
  const [mLocation, setMLocation] = useState("");
  const [mAudience, setMAudience] = useState("");
  const [mDesc, setMDesc] = useState("");
  const [mSaving, setMSaving] = useState(false);
  const [mError, setMError] = useState("");

  async function reloadMonth(yr: number, mo: number) {
    try {
      const res = await fetch(`/api/calendar?year=${yr}&month=${mo}`);
      if (!res.ok) return;
      const data = await res.json() as Array<{
        id: string; title: string; description: string; category: string;
        date: string; time: string | null; endTime: string | null;
        location: string | null; audience: string | null; approved: boolean;
      }>;
      setEvents(data.map((e) => ({
        id: e.id, title: e.title, description: e.description,
        category: e.category as CategoryKey,
        dateISO: e.date.slice(0, 10),
        time: e.time ?? undefined, endTime: e.endTime ?? undefined,
        location: e.location ?? undefined, audience: e.audience ?? undefined,
        approved: e.approved,
      })));
    } catch { /* silent, matches desktop's reloadEvents */ }
  }

  function goPrevMonth() {
    if (atCurrentMonth) return;
    const newMonth = month === 0 ? 11 : month - 1;
    const newYear  = month === 0 ? year - 1 : year;
    setMonth(newMonth); setYear(newYear);
    setSelectedDay(1);
    setExpandedId(null);
    reloadMonth(newYear, newMonth);
  }
  function goNextMonth() {
    const newMonth = month === 11 ? 0 : month + 1;
    const newYear  = month === 11 ? year + 1 : year;
    setMonth(newMonth); setYear(newYear);
    setSelectedDay(newYear === todayYear && newMonth === todayMonth ? todayDay : 1);
    setExpandedId(null);
    reloadMonth(newYear, newMonth);
  }

  function toggleCategory(k: CategoryKey) {
    setActiveCategories((prev) => {
      const n = new Set(prev);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  }
  const allActive = activeCategories.size === CATEGORY_KEYS.length;
  function toggleAll() {
    setActiveCategories(allActive ? new Set() : new Set(CATEGORY_KEYS));
  }

  const monthCounts = useMemo(() => {
    const counts: Record<CategoryKey, number> = { academic: 0, exams: 0, sports: 0, pta: 0, staff: 0, holidays: 0 };
    for (const e of events) counts[e.category]++;
    return counts;
  }, [events]);

  const dayEvents = useMemo(
    () => events.filter((e) => e.dateISO === selectedISO && activeCategories.has(e.category))
      .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? "")),
    [events, selectedISO, activeCategories]
  );

  // Keep the selected date scrolled into view when the day/month changes.
  useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLButtonElement>(`[data-day="${selectedDay}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedDay, month, year]);

  const daysWithEvents = useMemo(() => {
    const s = new Set<number>();
    for (const e of events) if (e.dateISO.slice(0, 7) === `${year}-${String(month + 1).padStart(2, "0")}`) {
      s.add(parseInt(e.dateISO.slice(8, 10)));
    }
    return s;
  }, [events, year, month]);

  function openAdd() {
    const defaultDate = isPastSelected ? todayISO : selectedISO;
    setMTitle(""); setMCategory("academic"); setMDate(defaultDate);
    setMTime(""); setMEndTime(""); setMLocation(""); setMAudience(""); setMDesc("");
    setMError(""); setAddOpen(true);
  }

  async function submitAdd() {
    if (!mTitle.trim()) { setMError("Title is required."); return; }
    if (!mDate) { setMError("Date is required."); return; }
    setMSaving(true); setMError("");
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: mTitle.trim(),
          description: mDesc.trim(),
          category: mCategory,
          date: mDate,
          time: mTime || undefined,
          endTime: mEndTime || undefined,
          location: mLocation || undefined,
          audience: mAudience || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string; details?: Record<string, string[]> };
        setMError(err.error ?? err.details?.date?.[0] ?? "Failed to save event.");
        return;
      }
      const saved = await res.json() as { id: string; title: string; description: string; category: string; date: string; time: string | null; endTime: string | null; location: string | null; audience: string | null; approved: boolean };
      const newEv: CalEvent = {
        id: saved.id, title: saved.title, description: saved.description,
        category: saved.category as CategoryKey,
        dateISO: saved.date.slice(0, 10),
        time: saved.time ?? undefined, endTime: saved.endTime ?? undefined,
        location: saved.location ?? undefined, audience: saved.audience ?? undefined,
        approved: saved.approved,
      };
      setEvents((prev) => [...prev, newEv]);
      setAddOpen(false);
      showToast(`"${saved.title}" added to calendar.`);
    } catch {
      setMError("Network error. Please try again.");
    } finally {
      setMSaving(false);
    }
  }

  async function handleDelete(ev: CalEvent) {
    const ok = await confirm({ message: `Delete "${ev.title}"? This cannot be undone.`, tone: "danger", confirmLabel: "Delete" });
    if (!ok) return;
    setDeletingId(ev.id);
    try {
      const res = await fetch(`/api/calendar/${ev.id}`, { method: "DELETE" });
      if (!res.ok) { showToast("Failed to delete event.", "error"); return; }
      setEvents((prev) => prev.filter((e) => e.id !== ev.id));
      setExpandedId(null);
      showToast("Event deleted.");
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  const selectedDate = new Date(`${selectedISO}T12:00:00`);
  const selectedWeekday = selectedDate.toLocaleDateString("en-GB", { weekday: "long" });
  const dayCount = daysInMonth(year, month);
  const dayCells = Array.from({ length: dayCount }, (_, i) => i + 1);

  return (
    <div className={styles.root}>
      {/* Month nav */}
      <div className={styles.monthNav}>
        <button type="button" className={styles.monthNavBtn} onClick={goPrevMonth} disabled={atCurrentMonth} aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <h2 className={styles.monthTitle}>{MONTHS[month]} {year}</h2>
        <button type="button" className={styles.monthNavBtn} onClick={goNextMonth} aria-label="Next month">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Date strip */}
      <div className={styles.dateStrip} ref={stripRef}>
        {dayCells.map((day) => {
          const iso = toISO(year, month, day);
          const isSelected = day === selectedDay;
          const isToday = iso === todayISO;
          return (
            <button
              key={day}
              type="button"
              data-day={day}
              className={`${styles.dateCell} ${isSelected ? styles.dateCellActive : ""} ${isToday && !isSelected ? styles.dateCellToday : ""}`}
              onClick={() => { setSelectedDay(day); setExpandedId(null); }}
            >
              <span className={styles.dateCellDow}>{DOW[new Date(year, month, day).getDay()]}</span>
              <span className={styles.dateCellNum}>{day}</span>
              {daysWithEvents.has(day) && <span className={styles.dateCellDot} />}
            </button>
          );
        })}
      </div>

      {/* Category summary chips — real counts for this month */}
      <div className={styles.summaryRow}>
        {CATEGORY_KEYS.map((k) => (
          <div key={k} className={styles.summaryChip}>
            <span className={styles.summaryDot} style={{ background: CAT[k].dot }} />
            <span>{CAT[k].label} <strong>{monthCounts[k]}</strong></span>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className={kit.chipRow}>
        <button type="button" className={`${kit.chip} ${allActive ? kit.chipActive : ""}`} onClick={toggleAll}>All active</button>
        {CATEGORY_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            className={`${kit.chip} ${activeCategories.has(k) ? kit.chipActive : ""}`}
            onClick={() => toggleCategory(k)}
          >
            {CAT[k].label}
          </button>
        ))}
      </div>

      {/* Selected day agenda header */}
      <div className={styles.agendaHeader}>
        <h3 className={styles.agendaTitle}>{selectedWeekday}, {MONTHS[month].slice(0, 3)} {selectedDay}</h3>
        <span className={styles.agendaBadge}>{dayEvents.length} Event{dayEvents.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Event list */}
      <div className={styles.eventList}>
        {dayEvents.length === 0 ? (
          <div className={styles.emptyState}>
            <CalendarX size={32} className={styles.emptyIcon} />
            <p>No events on this day</p>
          </div>
        ) : dayEvents.map((ev) => {
          const c = CAT[ev.category];
          const isOpen = expandedId === ev.id;
          return (
            <div key={ev.id} className={styles.eventCard} style={{ borderLeftColor: c.dot }}>
              <button type="button" className={styles.eventCardTop} onClick={() => setExpandedId(isOpen ? null : ev.id)}>
                <div className={styles.eventCardTopLeft}>
                  <span className={styles.categoryBadge} style={{ background: c.bg, color: c.text }}>{c.label}</span>
                  <h4 className={styles.eventTitle}>{ev.title}</h4>
                </div>
                {isOpen ? <ChevronUp size={18} className={styles.chevIcon} /> : <ChevronDown size={18} className={styles.chevIcon} />}
              </button>

              <div className={styles.eventMeta}>
                <span><Clock size={14} /> {ev.time ? `${ev.time}${ev.endTime ? ` – ${ev.endTime}` : ""}` : "All Day"}</span>
                {ev.audience && <span><Users size={14} /> {ev.audience}</span>}
                {ev.location && <span><MapPin size={14} /> {ev.location}</span>}
              </div>

              {!ev.approved && (
                <span className={styles.pendingPill}><Bell size={11} /> Pending approval</span>
              )}
              {ev.approved && isOpen && (
                <span className={styles.approvedPill}><CheckCircle2 size={11} /> Approved</span>
              )}

              {ev.category === "holidays" && (
                <div className={styles.holidayNote}>
                  School is closed — public holiday.
                </div>
              )}

              {ev.description && isOpen && (
                <p className={styles.eventDesc}>{ev.description}</p>
              )}

              {isOpen && (
                <div className={styles.eventActions}>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(ev)}
                    disabled={deletingId === ev.id}
                  >
                    <Trash2 size={16} /> {deletingId === ev.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FAB */}
      <button type="button" className={styles.fab} onClick={openAdd}>
        <Plus size={18} /> Add Event
      </button>

      {/* Add Event sheet */}
      <MobileSheet
        open={addOpen}
        onClose={() => !mSaving && setAddOpen(false)}
        title="Create Event"
        subtitle={`${yearName} • ${termName}`}
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => setAddOpen(false)} disabled={mSaving}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={submitAdd} disabled={mSaving}>
            {mSaving ? "Saving…" : "Save Event"}
          </button>
        </>}
      >
        {mError && <p className={kit.errorText}>{mError}</p>}
        <div className={kit.field}>
          <label>Event Title *</label>
          <input className={kit.input} placeholder="e.g. End-of-Term Assembly" value={mTitle} onChange={(e) => setMTitle(e.target.value)} />
        </div>
        <div className={kit.fieldRow}>
          <div className={kit.field}>
            <label>Category</label>
            <select className={kit.select} value={mCategory} onChange={(e) => setMCategory(e.target.value as CategoryKey)}>
              {CATEGORY_KEYS.map((k) => <option key={k} value={k}>{CAT[k].label}</option>)}
            </select>
          </div>
          <div className={kit.field}>
            <label>Date *</label>
            <input className={kit.input} type="date" value={mDate} min={todayISO} onChange={(e) => setMDate(e.target.value)} />
          </div>
        </div>
        <div className={kit.fieldRow}>
          <div className={kit.field}>
            <label>Start Time</label>
            <input className={kit.input} type="time" value={mTime} onChange={(e) => setMTime(e.target.value)} />
          </div>
          <div className={kit.field}>
            <label>End Time</label>
            <input className={kit.input} type="time" value={mEndTime} onChange={(e) => setMEndTime(e.target.value)} />
          </div>
        </div>
        <div className={kit.field}>
          <label>Location</label>
          <input className={kit.input} placeholder="e.g. School Hall" value={mLocation} onChange={(e) => setMLocation(e.target.value)} />
        </div>
        <div className={kit.field}>
          <label>Audience</label>
          <input className={kit.input} placeholder="e.g. All Students, JHS 1 – 3" value={mAudience} onChange={(e) => setMAudience(e.target.value)} />
        </div>
        <div className={kit.field}>
          <label>Description</label>
          <textarea className={kit.textarea} rows={3} placeholder="Optional description…" value={mDesc} onChange={(e) => setMDesc(e.target.value)} />
        </div>
      </MobileSheet>
    </div>
  );
}
