"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Download, Plus, ChevronLeft, ChevronRight, MoreVertical,
  CalendarDays, MapPin, Users, FileText, CheckCircle2,
  AlertTriangle, RefreshCw, Bell, X, ChevronDown,
  CheckCircle, XCircle,
} from "lucide-react";
import styles from "./AcademicCalendarScreen.module.css";
import { YearsTermsPanel } from "./YearsTermsPanel";

interface TermData {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}
interface YearData {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  terms: TermData[];
}

// ── Types ──────────────────────────────────────────────────────────────────────
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
  initialTab: "calendar" | "years";
  years: YearData[];
}

// ── Category config ────────────────────────────────────────────────────────────
const CAT: Record<CategoryKey, { label: string; bg: string; text: string; border: string; dot: string }> = {
  academic: { label: "Academic",  bg: "rgba(74,144,226,0.18)",  text: "#1565C0", border: "rgba(74,144,226,0.35)",  dot: "#4A90E2" },
  exams:    { label: "Exams",     bg: "rgba(229,115,115,0.18)", text: "#C62828", border: "rgba(229,115,115,0.35)", dot: "#E57373" },
  sports:   { label: "Sports",    bg: "rgba(129,199,132,0.18)", text: "#2E7D32", border: "rgba(129,199,132,0.35)", dot: "#81C784" },
  pta:      { label: "PTA",       bg: "#FFB74D",                text: "#E65100", border: "#F57C00",                dot: "#FFB74D" },
  staff:    { label: "Staff",     bg: "rgba(149,117,205,0.18)", text: "#4527A0", border: "rgba(149,117,205,0.35)", dot: "#9575CD" },
  holidays: { label: "Holidays",  bg: "rgba(240,98,146,0.18)",  text: "#C2185B", border: "rgba(240,98,146,0.35)", dot: "#F06292" },
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_HEADERS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function buildGrid(year: number, month: number): Array<{ day: number; inMonth: boolean }> {
  const firstDow   = new Date(year, month, 1).getDay();
  const daysInMon  = new Date(year, month + 1, 0).getDate();
  const prevDays   = new Date(year, month, 0).getDate();
  const cells: Array<{ day: number; inMonth: boolean }> = [];
  for (let i = firstDow - 1; i >= 0; i--) cells.push({ day: prevDays - i, inMonth: false });
  for (let d = 1; d <= daysInMon; d++) cells.push({ day: d, inMonth: true });
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMon - firstDow + 1, inMonth: false });
  return cells;
}

// "YYYY-MM-DD" from year/month/day
function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

type Toast = { type: "success" | "error"; message: string } | null;

// ── Component ─────────────────────────────────────────────────────────────────
export function AcademicCalendarContent({ yearName, termName, todayISO, initialEvents, initialTab, years }: Props) {
  const todayYear  = parseInt(todayISO.slice(0, 4));
  const todayMonth = parseInt(todayISO.slice(5, 7)) - 1;

  const [tab, setTab] = useState<"calendar" | "years">(initialTab);
  const [month,    setMonth]    = useState(todayMonth);
  const [year,     setYear]     = useState(todayYear);
  const [view,     setView]     = useState<"month" | "week" | "day">("month");
  const [selectedId,  setSelectedId]  = useState<string>("");
  const [activeCategories, setActiveCategories] = useState<Set<CategoryKey>>(
    new Set(["academic","exams","sports","pta","holidays"] as CategoryKey[])
  );
  const [events,   setEvents]   = useState<CalEvent[]>(initialEvents);
  const [toast,    setToast]    = useState<Toast>(null);

  // Add-event modal state
  const [showModal,   setShowModal]   = useState(false);
  const [modalDate,   setModalDate]   = useState("");
  const [mTitle,      setMTitle]      = useState("");
  const [mCategory,   setMCategory]   = useState<CategoryKey>("academic");
  const [mTime,       setMTime]       = useState("");
  const [mEndTime,    setMEndTime]    = useState("");
  const [mLocation,   setMLocation]   = useState("");
  const [mAudience,   setMAudience]   = useState("");
  const [mDesc,       setMDesc]       = useState("");
  const [mSaving,     setMSaving]     = useState(false);
  const [mError,      setMError]      = useState("");

  // Month navigation — never go before the current month
  function prevMonth() {
    const prevIsBeforeCurrent = year < todayYear || (year === todayYear && month <= todayMonth);
    if (prevIsBeforeCurrent) return;
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }
  function goToday() { setMonth(todayMonth); setYear(todayYear); }

  function toggleCategory(k: CategoryKey) {
    setActiveCategories(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });
  }

  function showToast(type: "success"|"error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  // A date cell is "past" if its ISO date < todayISO
  function isPast(day: number) {
    return toISO(year, month, day) < todayISO;
  }
  function isToday(day: number) {
    return toISO(year, month, day) === todayISO;
  }

  function openModal(day: number) {
    if (isPast(day)) return;
    const iso = toISO(year, month, day);
    setModalDate(iso);
    setMTitle(""); setMCategory("academic"); setMTime(""); setMEndTime("");
    setMLocation(""); setMAudience(""); setMDesc(""); setMError("");
    setShowModal(true);
  }

  // Reload events for current month from API
  const reloadEvents = useCallback(async (yr: number, mo: number) => {
    try {
      const res = await fetch(`/api/calendar?year=${yr}&month=${mo}`);
      if (!res.ok) return;
      const data = await res.json() as Array<{
        id: string; title: string; description: string; category: string;
        date: string; time: string | null; endTime: string | null;
        location: string | null; audience: string | null; approved: boolean;
      }>;
      setEvents(data.map(e => ({
        id: e.id, title: e.title, description: e.description,
        category: e.category as CategoryKey,
        dateISO: e.date.slice(0, 10),
        time: e.time ?? undefined, endTime: e.endTime ?? undefined,
        location: e.location ?? undefined, audience: e.audience ?? undefined,
        approved: e.approved,
      })));
    } catch { /* silent */ }
  }, []);

  async function handleSaveEvent() {
    if (!mTitle.trim()) { setMError("Title is required."); return; }
    setMSaving(true); setMError("");
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:       mTitle.trim(),
          description: mDesc.trim(),
          category:    mCategory,
          date:        modalDate,
          time:        mTime     || undefined,
          endTime:     mEndTime  || undefined,
          location:    mLocation || undefined,
          audience:    mAudience || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string; details?: Record<string,string[]> };
        const msg = err.error ?? (err.details?.date?.[0]) ?? "Failed to save event.";
        setMError(msg); return;
      }
      const saved = await res.json() as { id: string; title: string; description: string; category: string; date: string; time: string|null; endTime: string|null; location: string|null; audience: string|null; approved: boolean };
      const newEv: CalEvent = {
        id: saved.id, title: saved.title, description: saved.description,
        category: saved.category as CategoryKey,
        dateISO: saved.date.slice(0, 10),
        time: saved.time ?? undefined, endTime: saved.endTime ?? undefined,
        location: saved.location ?? undefined, audience: saved.audience ?? undefined,
        approved: saved.approved,
      };
      setEvents(prev => [...prev, newEv]);
      setShowModal(false);
      showToast("success", `"${saved.title}" added to calendar.`);
    } catch {
      setMError("Network error. Please try again.");
    } finally {
      setMSaving(false);
    }
  }

  async function handleDeleteEvent(id: string) {
    try {
      await fetch(`/api/calendar/${id}`, { method: "DELETE" });
      setEvents(prev => prev.filter(e => e.id !== id));
      setSelectedId("");
      showToast("success", "Event deleted.");
    } catch {
      showToast("error", "Failed to delete event.");
    }
  }

  // When navigating months, reload events
  function handlePrev() {
    if (year < todayYear || (year === todayYear && month <= todayMonth)) return;
    const newMonth = month === 0 ? 11 : month - 1;
    const newYear  = month === 0 ? year - 1 : year;
    setMonth(newMonth); setYear(newYear);
    reloadEvents(newYear, newMonth);
  }
  function handleNext() {
    const newMonth = month === 11 ? 0 : month + 1;
    const newYear  = month === 11 ? year + 1 : year;
    setMonth(newMonth); setYear(newYear);
    reloadEvents(newYear, newMonth);
  }

  const grid           = useMemo(() => buildGrid(year, month), [year, month]);
  const selectedEvent  = events.find((e) => e.id === selectedId) ?? null;
  const selectedCat    = selectedEvent ? CAT[selectedEvent.category] : null;

  function eventsForDay(day: number) {
    const iso = toISO(year, month, day);
    return events.filter(e => e.dateISO === iso && activeCategories.has(e.category));
  }

  const atCurrentMonth = year === todayYear && month === todayMonth;
  const canGoPrev = !atCurrentMonth;

  return (
    <div className={styles.root}>
      {/* Toast */}
      {toast && (
        <div className={styles.calToast} data-type={toast.type}>
          {toast.type === "success" ? <CheckCircle size={15} /> : <XCircle size={15} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbLink}>Events</span>
            <ChevronRight size={14} />
            <span>Calendar</span>
          </div>
          <h1 className={styles.title}>Academic Calendar</h1>
          <p className={styles.subtitle}>Plan school activities, and manage the academic year and term structure they run on.</p>
        </div>
        <div className={styles.headerActions}>
          {tab === "calendar" ? (
            <>
              <button className={styles.btnOutline}><Download size={14} /> Export</button>
              <button className={styles.btnFilled} onClick={() => {
                const iso = toISO(year, month, parseInt(todayISO.slice(8, 10)));
                openModal(isPast(parseInt(todayISO.slice(8, 10))) ? parseInt(todayISO.slice(8, 10)) + 1 : parseInt(todayISO.slice(8, 10)));
                void iso;
              }}>
                <Plus size={14} /> Create Event
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 4 }}>
        <div style={{ border: "1px solid var(--clr-app-border)", borderRadius: 4, background: "var(--clr-app-surface)", padding: "10px 14px" }}>
          <span style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--clr-app-accent)", textTransform: "uppercase" }}>Active Year</span>
          <strong style={{ color: "var(--clr-app-text)" }}>{yearName}</strong>
        </div>
        <div style={{ border: "1px solid var(--clr-app-border)", borderRadius: 4, background: "var(--clr-app-surface)", padding: "10px 14px" }}>
          <span style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--clr-app-accent)", textTransform: "uppercase" }}>Active Term</span>
          <strong style={{ color: "var(--clr-app-text)" }}>{termName}</strong>
        </div>
      </div>

      {/* Tab switcher */}
      <div className={styles.calendarTabRow}>
        {([["calendar", "Events Calendar"], ["years", "Years & Terms"]] as const).map(([key, label]) => (
          <button
            key={key}
            className={`${styles.calendarTabBtn} ${tab === key ? styles.calendarTabBtnActive : ""}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "years" ? (
        <YearsTermsPanel years={years} />
      ) : (
        <>
      {/* Quick action bento */}
      <div className={styles.bentoGrid}>
        {[
          { Icon: CalendarDays, label: "Add Holiday",       sub: "Mark public dates",     color: styles.bentoIconGreen,  cat: "holidays" as CategoryKey },
          { Icon: FileText,     label: "Schedule Exam",     sub: "Academic assessments",  color: styles.bentoIconAmber,  cat: "exams" as CategoryKey },
          { Icon: MapPin,       label: "Book Venue",        sub: "Reserve facilities",    color: styles.bentoIconBlue,   cat: "academic" as CategoryKey },
          { Icon: RefreshCw,    label: "Publish Calendar",  sub: "Share with parents",    color: styles.bentoIconGray,   cat: "staff" as CategoryKey },
        ].map(({ Icon, label, sub, color, cat }) => (
          <button key={label} className={styles.bentoBtn} onClick={() => {
            const todayDay = parseInt(todayISO.slice(8, 10));
            setModalDate(todayISO);
            setMTitle(""); setMCategory(cat); setMTime(""); setMEndTime("");
            setMLocation(""); setMAudience(""); setMDesc(""); setMError("");
            setShowModal(true);
          }}>
            <div className={`${styles.bentoIcon} ${color}`}><Icon size={20} /></div>
            <div>
              <div className={styles.bentoBtnLabel}>{label}</div>
              <div className={styles.bentoBtnSub}>{sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Main calendar — single full-width card, matching the mockup */}
      <div className={styles.mainLayout}>
        <div className={styles.centerCol}>
          <div className={styles.calHeader}>
            <div className={styles.calHeaderLeft}>
              <h2 className={styles.calMonthTitle}>{MONTHS[month]} {year}</h2>
              <div className={styles.viewToggle}>
                {(["month","week","day"] as const).map((v) => (
                  <button key={v}
                    className={`${styles.viewBtn} ${view === v ? styles.viewBtnActive : ""}`}
                    onClick={() => setView(v)}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.calHeaderRight}>
              <button className={styles.todayBtn} onClick={goToday}>Today</button>
              <div className={styles.calNavBtns}>
                <button className={styles.calNavBtn} onClick={handlePrev} disabled={!canGoPrev} style={{ opacity: canGoPrev ? 1 : 0.35 }}>
                  <ChevronLeft size={14} />
                </button>
                <button className={styles.calNavBtn} onClick={handleNext}><ChevronRight size={14} /></button>
              </div>
            </div>
          </div>

          <div className={styles.calDow}>
            {DAY_HEADERS.map((d) => <div key={d} className={styles.calDowCell}>{d}</div>)}
          </div>

          <div className={styles.calGrid}>
            {grid.map((cell, i) => {
              const past   = cell.inMonth && isPast(cell.day);
              const today  = cell.inMonth && isToday(cell.day);
              const events = cell.inMonth ? eventsForDay(cell.day) : [];
              return (
                <div
                  key={i}
                  className={[
                    styles.calCell,
                    !cell.inMonth ? styles.calCellOtherMonth : "",
                    today ? styles.calCellToday : "",
                    past  ? styles.calCellPast  : "",
                    cell.inMonth && !past ? styles.calCellClickable : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => cell.inMonth && !past && openModal(cell.day)}
                >
                  <div className={styles.calCellHeader}>
                    <span className={[
                      styles.calDay,
                      today ? styles.calDayToday : !cell.inMonth ? styles.calDayGray : past ? styles.calDayPast : "",
                    ].filter(Boolean).join(" ")}>
                      {cell.day}
                    </span>
                    {/* Hover "+" button — only on future/today cells */}
                    {cell.inMonth && !past && (
                      <button
                        className={styles.cellAddBtn}
                        onClick={(e) => { e.stopPropagation(); openModal(cell.day); }}
                        title={`Add event on ${MONTHS[month]} ${cell.day}`}
                      >
                        <Plus size={11} />
                      </button>
                    )}
                  </div>
                  <div className={styles.calEvents}>
                    {events.slice(0, 2).map((ev) => {
                      const c = CAT[ev.category];
                      return (
                        <button key={ev.id} className={styles.eventPill}
                          style={{ background: c.bg, color: c.text, borderColor: c.border }}
                          onClick={(e) => { e.stopPropagation(); setSelectedId(ev.id); }}
                        >
                          {!ev.approved && <AlertTriangle size={9} style={{ marginRight: 2 }} />}
                          <span className={styles.eventPillText}>{ev.title}</span>
                        </button>
                      );
                    })}
                    {events.length > 2 && (
                      <div className={styles.moreEvents}>+{events.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Category legend — clickable filters, matching the mockup's legend row */}
          <div className={styles.legendRow}>
            <span className={styles.legendCaption}>Categories:</span>
            {(Object.entries(CAT) as [CategoryKey, typeof CAT[CategoryKey]][]).map(([key, cfg]) => (
              <button
                key={key}
                className={`${styles.legendItem} ${activeCategories.has(key) ? "" : styles.legendItemOff}`}
                onClick={() => toggleCategory(key)}
                title={activeCategories.has(key) ? `Hide ${cfg.label} events` : `Show ${cfg.label} events`}
              >
                <span className={styles.legendDot} style={{ background: cfg.dot }} />
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Event detail modal */}
      {selectedEvent && selectedCat && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedId("")}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.rightCol} style={{ border: "none", borderRadius: 0 }}>
              <div className={styles.detailBg} style={{ background: selectedCat.dot }} />
              <div className={styles.detailTop}>
                <span className={styles.detailCatBadge}
                  style={{ background: selectedCat.bg, color: selectedCat.text, borderColor: selectedCat.border }}>
                  {selectedCat.label}
                </span>
                <button className={styles.moreBtn} onClick={() => handleDeleteEvent(selectedEvent.id)} title="Delete event">
                  <X size={16} />
                </button>
              </div>
              <h3 className={styles.detailTitle}>{selectedEvent.title}</h3>
              {selectedEvent.description && (
                <p className={styles.detailDesc}>{selectedEvent.description}</p>
              )}

              <div className={styles.detailMeta}>
                <div className={styles.detailMetaRow}>
                  <CalendarDays size={18} className={styles.detailMetaIcon} />
                  <div>
                    <div className={styles.detailMetaMain}>
                      {MONTHS[parseInt(selectedEvent.dateISO.slice(5,7))-1].slice(0,3)} {parseInt(selectedEvent.dateISO.slice(8,10))}, {selectedEvent.dateISO.slice(0,4)}
                    </div>
                    {selectedEvent.time && (
                      <div className={styles.detailMetaSub}>{selectedEvent.time}{selectedEvent.endTime ? ` – ${selectedEvent.endTime}` : ""}</div>
                    )}
                  </div>
                </div>
                {selectedEvent.location && (
                  <div className={styles.detailMetaRow}>
                    <MapPin size={18} className={styles.detailMetaIcon} />
                    <div><div className={styles.detailMetaMain}>{selectedEvent.location}</div></div>
                  </div>
                )}
                {selectedEvent.audience && (
                  <div className={styles.detailMetaRow}>
                    <Users size={18} className={styles.detailMetaIcon} />
                    <div><div className={styles.detailMetaMain}>{selectedEvent.audience}</div></div>
                  </div>
                )}
              </div>

              <div className={styles.detailStats}>
                <div className={styles.detailStatRow}>
                  <span className={styles.detailStatLabel}>Approval Status</span>
                  <span className={`${styles.detailStatValue} ${selectedEvent.approved ? styles.detailStatApproved : styles.detailStatPending}`}>
                    {selectedEvent.approved ? <CheckCircle2 size={13} /> : <Bell size={13} />}
                    {selectedEvent.approved ? "Approved" : "Pending"}
                  </span>
                </div>
              </div>

              <div className={styles.detailActions}>
                <button className={styles.btnOutlinePrimary} onClick={() => setSelectedId("")}>Close</button>
                <button className={styles.btnFilled} onClick={() => setSelectedId("")}>Done</button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* ── Add Event Modal ── */}
      {showModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Create Event</h2>
                <p className={styles.modalSub}>{modalDate ? new Date(modalDate + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}</p>
              </div>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              {mError && (
                <div className={styles.modalError}>
                  <AlertTriangle size={14} /> {mError}
                </div>
              )}
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Event Title *</label>
                <input className={styles.modalInput} placeholder="e.g. End-of-Term Assembly"
                  value={mTitle} onChange={(e) => setMTitle(e.target.value)}
                  autoFocus />
              </div>
              <div className={styles.modalRow}>
                <div className={styles.modalField}>
                  <label className={styles.modalLabel}>Category</label>
                  <div className={styles.modalSelectWrap}>
                    <select className={styles.modalSelect} value={mCategory}
                      onChange={(e) => setMCategory(e.target.value as CategoryKey)}>
                      {(Object.entries(CAT) as [CategoryKey, typeof CAT[CategoryKey]][]).map(([k, c]) => (
                        <option key={k} value={k}>{c.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className={styles.modalSelectChev} />
                  </div>
                </div>
                <div className={styles.modalField}>
                  <label className={styles.modalLabel}>Date</label>
                  <input className={styles.modalInput} type="date"
                    value={modalDate}
                    min={todayISO}
                    onChange={(e) => setModalDate(e.target.value)} />
                </div>
              </div>
              <div className={styles.modalRow}>
                <div className={styles.modalField}>
                  <label className={styles.modalLabel}>Start Time</label>
                  <input className={styles.modalInput} type="time"
                    value={mTime} onChange={(e) => setMTime(e.target.value)} />
                </div>
                <div className={styles.modalField}>
                  <label className={styles.modalLabel}>End Time</label>
                  <input className={styles.modalInput} type="time"
                    value={mEndTime} onChange={(e) => setMEndTime(e.target.value)} />
                </div>
              </div>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Location</label>
                <input className={styles.modalInput} placeholder="e.g. School Hall"
                  value={mLocation} onChange={(e) => setMLocation(e.target.value)} />
              </div>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Audience</label>
                <input className={styles.modalInput} placeholder="e.g. All Students, JHS 1 – 3"
                  value={mAudience} onChange={(e) => setMAudience(e.target.value)} />
              </div>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Description</label>
                <textarea className={styles.modalTextarea} rows={3}
                  placeholder="Optional description…"
                  value={mDesc} onChange={(e) => setMDesc(e.target.value)} />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setShowModal(false)}>Cancel</button>
              <button className={styles.btnFilled} onClick={handleSaveEvent} disabled={mSaving}>
                {mSaving ? "Saving…" : "Save Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
