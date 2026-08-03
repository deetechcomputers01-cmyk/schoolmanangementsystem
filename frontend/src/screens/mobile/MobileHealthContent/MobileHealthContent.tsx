"use client";

/**
 * MobileHealthContent — bespoke mobile view for the Health / Sick Bay screen.
 *
 * Every field/action here traces back to HealthContent.tsx (the real desktop
 * component) and the real /api/health endpoints:
 *   - queue stats, Log Sick Visit form -> same fields/POST /api/health/:studentId/visits
 *     as desktop's VisitModal.submit()
 *   - Add Note / Mark Resolved -> PATCH /api/health/:studentId/visits/:visitId
 *     (sickVisitUpdateSchema allows notes/status/triage/vitals — same endpoint
 *     desktop's FocusProfile.saveNotes() uses for notes)
 *   - Call Guardian -> tel: link off the real guardian phone on the visit's
 *     health record, same as desktop's FocusProfile contact card
 *
 * The Stitch mockup shows three visually distinct list-item "types" (a red
 * incident card, an indigo allergy card, an amber medication card) as if
 * they were separate feed entries. The real data model has no such feed —
 * every item is one SickVisit record with a triage/status plus the
 * student's allergy/condition flags attached. So this screen renders a
 * single unified, expandable visit card per queue entry whose color and
 * inline alert box react to those real fields, instead of fabricating three
 * separate item kinds. The mockup's "Refer Clinic" action and "Medication
 * Round" quick action have no backing endpoint/workflow anywhere in the
 * health service layer and are intentionally omitted. The mockup's filter
 * chips (Incidents/Medication/Allergies/Follow-up/Resolved) don't map to
 * any real field either — the real filterable field is triage, so the chips
 * here mirror desktop's actual triage filter (Routine/Scheduled/Urgent/
 * Emergency) instead.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, Siren, Pill, ShieldAlert, Users, Phone, StickyNote,
  CheckCircle2, Lock, Clock,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import type { ClinicVisit, HealthClinicProps } from "@/screens/desktop/HealthScreen/HealthContent";
import styles from "./MobileHealthContent.module.css";

const TRIAGE_FILTERS = [
  { value: "", label: "All active" },
  { value: "routine", label: "Routine" },
  { value: "scheduled", label: "Scheduled" },
  { value: "urgent", label: "Urgent" },
  { value: "emergency", label: "Emergency" },
] as const;

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function TriageBadge({ triage }: { triage: string }) {
  const cls: Record<string, string> = {
    routine: styles.triageRoutine,
    scheduled: styles.triageScheduled,
    urgent: styles.triageUrgent,
    emergency: styles.triageEmergency,
  };
  return (
    <span className={`${styles.triageBadge} ${cls[triage] ?? styles.triageRoutine}`}>
      {triage.charAt(0).toUpperCase() + triage.slice(1)}
    </span>
  );
}

export function MobileHealthContent({ visits, stats, students }: HealthClinicProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [search, setSearch] = useState("");
  const [triageFilter, setTriageFilter] = useState<string>("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visits.filter((v) =>
      (q === "" || v.studentName.toLowerCase().includes(q) || v.admNo.toLowerCase().includes(q)) &&
      (triageFilter === "" || v.triage === triageFilter)
    );
  }, [visits, search, triageFilter]);

  // ── Log Sick Visit sheet — same fields/endpoint as desktop's VisitModal ──
  const [logOpen, setLogOpen] = useState(false);
  const [form, setForm] = useState({
    studentId: students[0]?.id ?? "",
    complaint: "",
    triage: "routine",
    vitalsTemp: "",
    vitalsBp: "",
    notes: "",
  });
  const [logSaving, setLogSaving] = useState(false);

  function openLog() {
    setForm({ studentId: students[0]?.id ?? "", complaint: "", triage: "routine", vitalsTemp: "", vitalsBp: "", notes: "" });
    setLogOpen(true);
  }
  function setField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submitLog() {
    if (!form.studentId || !form.complaint.trim()) {
      showToast("Select a student and enter a complaint.", "error");
      return;
    }
    setLogSaving(true);
    try {
      const res = await fetch(`/api/health/${form.studentId}/visits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString(),
          complaint: form.complaint.trim(),
          triage: form.triage,
          status: "waiting",
          vitalsTemp: form.vitalsTemp || undefined,
          vitalsBp: form.vitalsBp || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setLogOpen(false);
      showToast("Sick visit logged");
      router.refresh();
    } catch {
      showToast("Failed to record visit", "error");
    } finally {
      setLogSaving(false);
    }
  }

  // ── Add Note — PATCH /api/health/:studentId/visits/:visitId (notes) ──
  const [noteEditId, setNoteEditId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  function startNoteEdit(v: ClinicVisit) {
    setNoteEditId(v.id);
    setNoteDraft(v.notes ?? "");
  }

  async function saveNote(v: ClinicVisit) {
    setNoteSaving(true);
    try {
      const res = await fetch(`/api/health/${v.studentId}/visits/${v.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: noteDraft.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast("Note saved");
      setNoteEditId(null);
      router.refresh();
    } catch {
      showToast("Failed to save note", "error");
    } finally {
      setNoteSaving(false);
    }
  }

  // ── Mark Resolved — PATCH status: "completed" ──
  async function markResolved(v: ClinicVisit) {
    const sure = await confirm({
      message: `Mark ${v.studentName}'s sick-bay visit as resolved? It will leave the active queue.`,
      confirmLabel: "Mark Resolved",
    });
    if (!sure) return;
    try {
      const res = await fetch(`/api/health/${v.studentId}/visits/${v.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast("Visit marked resolved");
      router.refresh();
    } catch {
      showToast("Failed to update visit", "error");
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.privacyBanner}>
        <Lock size={15} />
        <span>Restricted health records — access logged</span>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Active Cases</span>
          <div className={styles.kpiBottom}>
            <strong className={styles.kpiValueError}>{visits.length}</strong>
            <Siren size={18} className={styles.kpiIconError} />
          </div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Medication Due</span>
          <div className={styles.kpiBottom}>
            <strong className={styles.kpiValueWarn}>{stats.medicationDue}</strong>
            <Pill size={18} className={styles.kpiIconWarn} />
          </div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Medical Alerts</span>
          <div className={styles.kpiBottom}>
            <strong className={styles.kpiValueAccent}>{stats.activeAlerts}</strong>
            <ShieldAlert size={18} className={styles.kpiIconAccent} />
          </div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Visits Today</span>
          <div className={styles.kpiBottom}>
            <strong className={styles.kpiValue}>{stats.visitsToday}</strong>
            <Users size={18} className={styles.kpiIconMuted} />
          </div>
        </div>
      </div>

      <label className={kit.searchWrap}>
        <Search size={16} className={kit.searchIcon} />
        <input
          className={`${kit.input} ${kit.searchInput}`}
          placeholder="Search student or condition"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      <div className={styles.chipRow}>
        {TRIAGE_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`${styles.chip} ${triageFilter === f.value ? styles.chipActive : ""}`}
            onClick={() => setTriageFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <button type="button" className={styles.logBtn} onClick={openLog}>
        <Plus size={16} /> Log Sick Visit
      </button>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <p className={kit.emptyText}>{search || triageFilter ? "No records match your search." : "No active sick-bay records."}</p>
        ) : filtered.map((v) => {
          const isOpen = openId === v.id;
          const fever = v.vitalsTemp ? parseFloat(v.vitalsTemp) >= 38 : false;
          const severe = v.triage === "urgent" || v.triage === "emergency";
          const hasAlert = !!(v.allergies || v.conditions);
          const cardTone = severe ? styles.cardSevere : v.status === "medication_due" ? styles.cardMeds : hasAlert ? styles.cardAlert : "";
          const isEditingNote = noteEditId === v.id;

          return (
            <article key={v.id} className={`${styles.card} ${cardTone}`}>
              <button type="button" className={styles.cardHeader} onClick={() => setOpenId(isOpen ? null : v.id)}>
                <span className={styles.avatar}>{initials(v.studentName)}</span>
                <span className={styles.cardHeaderText}>
                  <span className={styles.cardTopRow}>
                    <TriageBadge triage={v.triage} />
                    <span className={styles.timeText}><Clock size={11} /> {fmtTime(v.arrivalTime)}</span>
                  </span>
                  <span className={styles.studentName}>{v.studentName}</span>
                  <span className={styles.studentMeta}>{v.className} • #{v.admNo}</span>
                </span>
              </button>

              <div className={styles.complaintBox}>
                <div className={styles.complaintTop}>
                  <span className={styles.complaintText}>{v.complaint}</span>
                  {v.vitalsTemp && (
                    <span className={`${styles.vitalsTemp} ${fever ? styles.vitalsFever : ""}`}>Temp {v.vitalsTemp}°C</span>
                  )}
                </div>
                {v.notes && !isEditingNote && <p className={styles.noteQuote}>&ldquo;{v.notes}&rdquo;</p>}
                {(v.guardianName || v.guardianPhone) && (
                  <div className={styles.guardianRow}>
                    <Users size={13} />
                    <span>Guardian: {v.guardianName ?? "—"}{v.guardianRelation ? ` (${v.guardianRelation})` : ""}</span>
                  </div>
                )}
              </div>

              {hasAlert && (
                <div className={styles.alertBox}>
                  <ShieldAlert size={14} />
                  <span>
                    {v.allergies ? `Allergy: ${v.allergies}` : "Condition on file"}
                    {v.conditions ? ` • ${v.conditions}` : ""}
                  </span>
                </div>
              )}

              {isOpen && (
                <div className={styles.actionArea}>
                  {isEditingNote ? (
                    <div className={styles.noteEditor}>
                      <textarea
                        className={kit.textarea}
                        rows={3}
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Record treatment and observations…"
                      />
                      <div className={styles.noteEditorActions}>
                        <button type="button" className={kit.btnOutline} onClick={() => setNoteEditId(null)} disabled={noteSaving}>Cancel</button>
                        <button type="button" className={kit.btnPrimary} onClick={() => saveNote(v)} disabled={noteSaving}>
                          {noteSaving ? "Saving…" : "Save Note"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.actionRow}>
                      {v.guardianPhone && (
                        <a href={`tel:${v.guardianPhone}`} className={styles.actionBtn}><Phone size={14} /> Call Guardian</a>
                      )}
                      <button type="button" className={styles.actionBtn} onClick={() => startNoteEdit(v)}>
                        <StickyNote size={14} /> {v.notes ? "Edit Note" : "Add Note"}
                      </button>
                      <button type="button" className={`${styles.actionBtn} ${styles.actionBtnResolve}`} onClick={() => markResolved(v)}>
                        <CheckCircle2 size={14} /> Resolved
                      </button>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <MobileSheet
        open={logOpen}
        onClose={() => !logSaving && setLogOpen(false)}
        title="Log Sick Visit"
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => setLogOpen(false)} disabled={logSaving}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={submitLog} disabled={logSaving || !form.complaint.trim()}>
            {logSaving ? "Recording…" : "Log Visit"}
          </button>
        </>}
      >
        <div className={kit.field}>
          <label>Student *</label>
          <select className={kit.select} value={form.studentId} onChange={(e) => setField("studentId", e.target.value)}>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.firstName} {s.lastName} — {s.className}</option>
            ))}
          </select>
        </div>
        <div className={kit.field}>
          <label>Complaint *</label>
          <textarea className={kit.textarea} rows={3} value={form.complaint} onChange={(e) => setField("complaint", e.target.value)} placeholder="Describe the complaint…" />
        </div>
        <div className={kit.field}>
          <label>Triage</label>
          <div className={kit.segmented}>
            {(["routine", "scheduled", "urgent", "emergency"] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`${kit.segBtn} ${form.triage === t ? kit.segBtnActive : ""}`}
                style={form.triage === t && (t === "urgent" || t === "emergency") ? { background: "var(--clr-error)" } : undefined}
                onClick={() => setField("triage", t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className={kit.fieldRow}>
          <div className={kit.field}>
            <label>Temp (°C)</label>
            <input className={kit.input} value={form.vitalsTemp} onChange={(e) => setField("vitalsTemp", e.target.value)} placeholder="37.0" />
          </div>
          <div className={kit.field}>
            <label>Blood Pressure</label>
            <input className={kit.input} value={form.vitalsBp} onChange={(e) => setField("vitalsBp", e.target.value)} placeholder="120/80" />
          </div>
        </div>
        <div className={kit.field}>
          <label>Notes</label>
          <textarea className={kit.textarea} rows={2} value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Additional notes…" />
        </div>
      </MobileSheet>
    </div>
  );
}
