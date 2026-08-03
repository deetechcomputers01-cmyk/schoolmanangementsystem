"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle, Phone, X,
  Plus, Users, Hourglass, Syringe, Search, ChevronLeft, ChevronRight,
  Stethoscope, BedSingle, Pill, CheckCircle2, XCircle, History, ShieldAlert, IdCard, Droplet,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import styles from "./HealthScreen.module.css";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ClinicVisit {
  id: string;
  studentId: string;
  studentName: string;
  admNo: string;
  className: string;
  gender: string;
  age: number;
  complaint: string;
  status: string;
  triage: string;
  arrivalTime: string;
  treatment: string | null;
  notes: string | null;
  vitalsTemp: string | null;
  vitalsBp: string | null;
  allergies: string | null;
  conditions: string | null;
  bloodGroup: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianRelation: string | null;
  vaccinations: { vaccineName: string; date: string; nextDue: string | null; overdue: boolean }[];
}

export interface HealthClinicProps {
  visits: ClinicVisit[];
  stats: {
    visitsToday: number;
    visitsDelta: number;
    activeAlerts: number;
    waiting: number;
    inConsultation: number;
    medicationDue: number;
    vaxDueThisMonth: number;
  };
  students: { id: string; firstName: string; lastName: string; className: string }[];
}

const PAGE_SIZE = 6;

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

// ── Badges ─────────────────────────────────────────────────────────────────────

function TriageBadge({ triage }: { triage: string }) {
  const cls: Record<string, string> = {
    routine: styles.triageRoutine,
    scheduled: styles.triageScheduled,
    urgent: styles.triageUrgent,
    emergency: styles.triageEmergency,
  };
  return <span className={`${styles.triageBadge} ${cls[triage] ?? styles.triageRoutine}`}>{triage}</span>;
}

function StatusCell({ status }: { status: string }) {
  if (status === "in_consultation") return <span className={`${styles.statusCell} ${styles.statusConsult}`}><Stethoscope size={13} /> In Consult</span>;
  if (status === "medication_due") return <span className={`${styles.statusCell} ${styles.statusMeds}`}><Pill size={13} /> Meds Due</span>;
  return <span className={`${styles.statusCell} ${styles.statusWaiting}`}><BedSingle size={13} /> Waiting</span>;
}

// ── New Visit Modal ────────────────────────────────────────────────────────────

function VisitModal({
  students, onClose, onSuccess, onError,
}: {
  students: { id: string; firstName: string; lastName: string; className: string }[];
  onClose: () => void;
  onSuccess: (m: string) => void;
  onError: (m: string) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    studentId: students[0]?.id ?? "",
    complaint: "",
    triage: "routine",
    vitalsTemp: "",
    vitalsBp: "",
    notes: "",
  });

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.studentId || !form.complaint.trim()) return;
    setBusy(true);
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
      onSuccess("Sick visit logged");
      router.refresh();
      onClose();
    } catch {
      onError("Failed to record visit");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
    <div className={`${styles.modalOverlay} desktopOnly`} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <Plus size={18} style={{ color: "var(--clr-app-accent)" }} />
            <h2 className={styles.modalTitle}>Log Sick Visit</h2>
          </div>
          <button className={styles.modalClose} onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={submit}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Student *</label>
              <select className={styles.formSelect} value={form.studentId} onChange={e => set("studentId", e.target.value)} required>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.firstName} {s.lastName} — {s.className}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Complaint *</label>
              <textarea className={styles.formTextarea} value={form.complaint} onChange={e => set("complaint", e.target.value)} placeholder="Describe the complaint…" required rows={3} />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Triage</label>
                <select className={styles.formSelect} value={form.triage} onChange={e => set("triage", e.target.value)}>
                  <option value="routine">Routine</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="urgent">Urgent</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Temp (°C)</label>
                <input type="text" className={styles.formInput} value={form.vitalsTemp} onChange={e => set("vitalsTemp", e.target.value)} placeholder="37.0" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Blood Pressure</label>
                <input type="text" className={styles.formInput} value={form.vitalsBp} onChange={e => set("vitalsBp", e.target.value)} placeholder="120/80" />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Notes</label>
              <textarea className={styles.formTextarea} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Additional notes…" rows={2} />
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.btnPrimary} disabled={busy || !form.complaint.trim()}>{busy ? "Recording…" : "Record Visit"}</button>
          </div>
        </form>
      </div>
    </div>

    {/* Log Sick Visit sheet — mobile */}
    <div className="mobileOnly">
      <MobileSheet
        open
        onClose={onClose}
        title="Log Sick Visit"
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={() => submit({ preventDefault: () => {} } as React.FormEvent)} disabled={busy || !form.complaint.trim()}>{busy ? "Recording…" : "Log Visit"}</button>
        </>}
      >
        <div className={kit.field}>
          <label>Student *</label>
          <select className={kit.select} value={form.studentId} onChange={e => set("studentId", e.target.value)}>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.firstName} {s.lastName} — {s.className}</option>
            ))}
          </select>
        </div>
        <div className={kit.field}>
          <label>Complaint *</label>
          <textarea className={kit.textarea} value={form.complaint} onChange={e => set("complaint", e.target.value)} placeholder="Describe the complaint…" rows={3} />
        </div>
        <div className={kit.field}>
          <label>Triage</label>
          <div className={kit.segmented}>
            {(["routine", "scheduled", "urgent", "emergency"] as const).map(t => (
              <button
                key={t}
                type="button"
                className={`${kit.segBtn} ${form.triage === t ? kit.segBtnActive : ""}`}
                style={form.triage === t && (t === "urgent" || t === "emergency") ? { background: "var(--clr-error)" } : undefined}
                onClick={() => set("triage", t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className={kit.fieldRow}>
          <div className={kit.field}>
            <label>Temp (°C)</label>
            <input type="text" className={kit.input} value={form.vitalsTemp} onChange={e => set("vitalsTemp", e.target.value)} placeholder="37.0" />
          </div>
          <div className={kit.field}>
            <label>Blood Pressure</label>
            <input type="text" className={kit.input} value={form.vitalsBp} onChange={e => set("vitalsBp", e.target.value)} placeholder="120/80" />
          </div>
        </div>
        <div className={kit.field}>
          <label>Notes</label>
          <textarea className={kit.textarea} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Additional notes…" rows={2} />
        </div>
      </MobileSheet>
    </div>
    </>
  );
}

// ── Focus profile (right column) ────────────────────────────────────────────

function FocusProfile({ visit }: { visit: ClinicVisit }) {
  const router = useRouter();
  const [notes, setNotes] = useState(visit.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [prevId, setPrevId] = useState(visit.id);
  if (visit.id !== prevId) {
    setPrevId(visit.id);
    setNotes(visit.notes ?? "");
  }

  async function saveNotes() {
    setSaving(true);
    try {
      await fetch(`/api/health/${visit.studentId}/visits/${visit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const hasAlert = visit.allergies || visit.conditions;

  return (
    <div className={styles.profileCard}>
      <div className={styles.profileHeader}>
        <div className={styles.profileAvatarWrap}>
          <div className={styles.profileAvatar}>{initials(visit.studentName)}</div>
          {hasAlert && <span className={styles.profileAlertDot}><AlertTriangle size={10} /></span>}
        </div>
        <div>
          <h3 className={styles.profileName}>{visit.studentName}</h3>
          <p className={styles.profileMeta}>{visit.className} • {visit.gender === "Female" ? "Female" : "Male"} • {visit.age} yrs</p>
          {visit.bloodGroup && (
            <span className={styles.bloodPill}><Droplet size={11} /> {visit.bloodGroup}</span>
          )}
        </div>
      </div>

      <div className={styles.profileBody}>
        {hasAlert && (
          <div>
            <h4 className={styles.profileSectionTitle}><ShieldAlert size={13} /> Critical Info</h4>
            <div className={styles.criticalBox}>
              <p className={styles.criticalTitle}>{visit.allergies ? `Allergies: ${visit.allergies}` : "Condition on file"}</p>
              {visit.conditions && <p className={styles.criticalNote}>{visit.conditions}</p>}
            </div>
          </div>
        )}

        {(visit.guardianName || visit.guardianPhone) && (
          <div>
            <h4 className={styles.profileSectionTitle} style={{ color: "var(--clr-app-muted)" }}><IdCard size={13} style={{ color: "var(--clr-app-muted)" }} /> Emergency Contact</h4>
            <div className={styles.contactRow}>
              <div className={styles.contactLeft}>
                <div className={styles.contactAvatar}>{visit.guardianName ? initials(visit.guardianName) : "?"}</div>
                <div>
                  <p className={styles.contactName}>{visit.guardianName ?? "—"}</p>
                  <p className={styles.contactSub}>{visit.guardianRelation ?? "Guardian"}{visit.guardianPhone ? ` • ${visit.guardianPhone}` : ""}</p>
                </div>
              </div>
              {visit.guardianPhone && (
                <a href={`tel:${visit.guardianPhone}`} className={styles.callBtn}><Phone size={14} /></a>
              )}
            </div>
          </div>
        )}

        <div>
          <div className={styles.vaxHeaderRow}>
            <h4 className={styles.profileSectionTitle} style={{ color: "var(--clr-app-muted)", margin: 0 }}><Syringe size={13} style={{ color: "var(--clr-app-muted)" }} /> Vaccinations</h4>
            <Link href={`/health/${visit.studentId}`} className={styles.vaxViewAll}>View All</Link>
          </div>
          {visit.vaccinations.length === 0 ? (
            <p className={styles.vaxEmpty}>No vaccination records on file.</p>
          ) : (
            <div className={styles.vaxList}>
              {visit.vaccinations.slice(0, 3).map((v, i) => (
                <div key={i} className={`${styles.vaxItem} ${v.overdue ? styles.vaxItemOverdue : ""}`}>
                  <div className={styles.vaxLeft}>
                    {v.overdue ? <XCircle size={14} className={styles.vaxBadIcon} /> : <CheckCircle2 size={14} className={styles.vaxOkIcon} />}
                    <span className={styles.vaxName}>{v.vaccineName}</span>
                  </div>
                  {v.overdue ? <span className={styles.vaxOverdueTag}>Overdue</span> : <span className={styles.vaxDate}>{fmtDate(v.date)}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--clr-app-muted)" }}>Treatment Notes</label>
          <textarea className={styles.notesTextarea} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Record treatment and observations…" rows={3} />
          <button className={styles.btnUpdateNotes} onClick={saveNotes} disabled={saving}>{saving ? "Saving…" : "Update Notes"}</button>
        </div>

        <Link href={`/health/${visit.studentId}`} className={styles.historyBtn}>
          <History size={15} /> Full Medical History
        </Link>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function HealthContent({ visits, stats, students }: HealthClinicProps) {
  const [search, setSearch] = useState("");
  const [triageFilter, setTriageFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(
    visits.find(v => v.status === "in_consultation")?.id ?? visits[0]?.id ?? null,
  );
  const [showVisit, setShowVisit] = useState(false);
  const { showToast } = useToast();

  const filteredVisits = useMemo(() => visits.filter(v =>
    (search === "" || v.studentName.toLowerCase().includes(search.toLowerCase()) || v.admNo.toLowerCase().includes(search.toLowerCase())) &&
    (triageFilter === "" || v.triage === triageFilter)
  ), [visits, search, triageFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredVisits.length / PAGE_SIZE));
  const pageVisits = filteredVisits.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = visits.find(v => v.id === selectedId) ?? null;

  function showToastMsg(message: string, type: "success" | "error") {
    showToast(message, type);
  }

  return (
    <div className={styles.root}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Sick Bay Management</h1>
          <p className={styles.subtitle}>Monitor current cases and manage student health records.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnPrimary} onClick={() => setShowVisit(true)}>
            <Plus size={15} /> Log Sick Visit
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Visits Today</span>
            <div className={styles.statIconBox}><Users size={16} /></div>
          </div>
          <div className={styles.statBottom}>
            <span className={styles.statValue}>{stats.visitsToday}</span>
            {stats.visitsDelta !== 0 && (
              <span className={`${styles.statDelta} ${stats.visitsDelta < 0 ? styles.statDeltaDown : ""}`}>
                {stats.visitsDelta > 0 ? "↑" : "↓"} {Math.abs(stats.visitsDelta)}
              </span>
            )}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Queue / Consult</span>
            <div className={styles.statIconBox}><Hourglass size={16} /></div>
          </div>
          <div className={styles.statBottom}>
            <span className={styles.statValue}>{stats.waiting}</span>
            <span className={styles.statSub}>Students waiting</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Vax Due This Month</span>
            <div className={styles.statIconBox}><Syringe size={16} /></div>
          </div>
          <div className={styles.statBottom}>
            <span className={styles.statValue}>{stats.vaxDueThisMonth}</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardAlert}`}>
          <div className={styles.statTop}>
            <span className={`${styles.statLabel} ${styles.statLabelAlert}`}>Medical Alerts</span>
            <div className={`${styles.statIconBox} ${styles.statIconAlert}`}><AlertTriangle size={16} /></div>
          </div>
          <div className={styles.statBottom}>
            <span className={`${styles.statValue} ${styles.statValueAlert}`}>{stats.activeAlerts}</span>
            <span className={styles.statSubAlert}>Action req.</span>
          </div>
        </div>
      </div>

      {/* Main split: queue + profile */}
      <div className={styles.mainSplit}>
        <div className={styles.queueCard}>
          <div className={styles.queueHeader}>
            <div className={styles.queueHeaderLeft}>
              <h3 className={styles.queueTitle}>Sick Bay Queue</h3>
              <span className={styles.queueBadge}>{filteredVisits.length} ACTIVE</span>
            </div>
            <div className={styles.queueHeaderRight}>
              <div className={styles.searchWrap}>
                <Search size={14} className={styles.searchIcon} />
                <input className={styles.searchInput} placeholder="Search…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <select className={styles.filterSelect} value={triageFilter} onChange={(e) => { setTriageFilter(e.target.value); setPage(1); }}>
                <option value="">All Triage</option>
                <option value="routine">Routine</option>
                <option value="scheduled">Scheduled</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>

          {pageVisits.length === 0 ? (
            <div className={styles.emptyState}>No active sick-bay records match your search.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Student</th>
                    <th className={styles.th}>Complaint</th>
                    <th className={styles.th}>Triage</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th}>Vitals</th>
                    <th className={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pageVisits.map(v => {
                    const fever = v.vitalsTemp ? parseFloat(v.vitalsTemp) >= 38 : false;
                    return (
                      <tr key={v.id} className={`${styles.tr} ${selectedId === v.id ? styles.trActive : ""}`} onClick={() => setSelectedId(v.id)}>
                        <td className={styles.td}>
                          <div className={styles.studentCell}>
                            <div className={styles.avatar}>{initials(v.studentName)}</div>
                            <div>
                              <div className={styles.studentName}>{v.studentName}</div>
                              <span className={styles.studentSub}>{v.className} • #{v.admNo}</span>
                            </div>
                          </div>
                        </td>
                        <td className={styles.td}>{v.complaint}</td>
                        <td className={styles.td}><TriageBadge triage={v.triage} /></td>
                        <td className={styles.td}><StatusCell status={v.status} /></td>
                        <td className={styles.td}>
                          {v.vitalsTemp ? <span className={`${styles.vitalsTemp} ${fever ? styles.vitalsFever : ""}`}>{v.vitalsTemp}°C</span> : <span className={styles.studentSub}>—</span>}
                        </td>
                        <td className={styles.td}>
                          <button className={styles.manageBtn} onClick={(e) => { e.stopPropagation(); setSelectedId(v.id); }}>MANAGE</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filteredVisits.length > 0 && (
            <div className={styles.paginationBar}>
              <span className={styles.paginationInfo}>
                Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredVisits.length)} of {filteredVisits.length} active records
              </span>
              <div className={styles.pageButtons}>
                <button className={styles.pageBtn} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={16} /></button>
                <button className={styles.pageBtn} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>

        {selected ? (
          <FocusProfile visit={selected} />
        ) : (
          <div className={styles.profileCard}>
            <div className={styles.profileEmpty}>
              <Stethoscope size={32} style={{ color: "var(--clr-app-border)" }} />
              <p>Select a patient to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showVisit && (
        <VisitModal
          students={students}
          onClose={() => setShowVisit(false)}
          onSuccess={m => showToastMsg(m, "success")}
          onError={m => showToastMsg(m, "error")}
        />
      )}
    </div>
  );
}
