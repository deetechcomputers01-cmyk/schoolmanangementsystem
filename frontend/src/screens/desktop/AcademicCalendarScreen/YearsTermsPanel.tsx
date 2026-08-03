"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, AlertTriangle, X } from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import styles from "./YearsTermsPanel.module.css";

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

function fmtDate(iso: string) {
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
}

function teachingDays(start: string, end: string): number {
  let count = 0;
  const s = new Date(start + "T00:00:00Z");
  const e = new Date(end + "T00:00:00Z");
  for (let d = new Date(s); d <= e; d.setUTCDate(d.getUTCDate() + 1)) {
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

function termLabel(t: TermData): "ACTIVE" | "PAST" | "PENDING" {
  if (t.isCurrent) return "ACTIVE";
  const now = new Date().toISOString().slice(0, 10);
  if (t.endDate < now) return "PAST";
  return "PENDING";
}

const TERM_STATUS_STYLE: Record<string, string> = {
  ACTIVE: styles.badgeActive,
  PENDING: styles.badgePending,
  PAST: styles.badgePast,
};

export function YearsTermsPanel({ years }: { years: YearData[] }) {
  const router = useRouter();

  const [selectedYearId, setSelectedYearId] = useState<string>(
    years.find((y) => y.isCurrent)?.id ?? years[0]?.id ?? ""
  );
  const [selectedTermId, setSelectedTermId] = useState<string>(
    years.find((y) => y.isCurrent)?.terms.find((t) => t.isCurrent)?.id ?? ""
  );
  const [showAddYear, setShowAddYear] = useState(false);
  const [showAddTerm, setShowAddTerm] = useState(false);
  const { showToast } = useToast();
  const [confirmDeleteTermId, setConfirmDeleteTermId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [newYearName, setNewYearName] = useState("");
  const [newYearStart, setNewYearStart] = useState("");
  const [newYearEnd, setNewYearEnd] = useState("");

  const [newTermName, setNewTermName] = useState("");
  const [newTermStart, setNewTermStart] = useState("");
  const [newTermEnd, setNewTermEnd] = useState("");

  function showT(type: "success" | "error", msg: string) {
    showToast(msg, type);
  }

  const selectedYear = years.find((y) => y.id === selectedYearId) ?? years[0];
  const selectedTerm = selectedYear?.terms.find((t) => t.id === selectedTermId) ?? selectedYear?.terms[0];
  const activeYear = years.find((y) => y.isCurrent);
  const activeTerm = activeYear?.terms.find((t) => t.isCurrent);

  async function handleAddYear() {
    if (!newYearName.trim() || !newYearStart || !newYearEnd) { showT("error", "All fields required."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/academic/years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newYearName.trim(), startDate: newYearStart + "T00:00:00.000Z", endDate: newYearEnd + "T00:00:00.000Z" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showT("error", err?.error ?? "Failed to create academic year.");
        return;
      }
      showT("success", `Academic year "${newYearName}" created.`);
      setShowAddYear(false);
      setNewYearName(""); setNewYearStart(""); setNewYearEnd("");
      router.refresh();
    } catch { showT("error", "Network error."); }
    finally { setSaving(false); }
  }

  async function handleAddTerm() {
    if (!newTermName.trim() || !newTermStart || !newTermEnd) { showT("error", "All fields required."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/academic/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTermName.trim(), startDate: newTermStart + "T00:00:00.000Z", endDate: newTermEnd + "T00:00:00.000Z", academicYearId: selectedYearId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showT("error", err?.error ?? "Failed to create term.");
        return;
      }
      showT("success", `${newTermName} added.`);
      setShowAddTerm(false);
      setNewTermName(""); setNewTermStart(""); setNewTermEnd("");
      router.refresh();
    } catch { showT("error", "Network error."); }
    finally { setSaving(false); }
  }

  async function handlePublishYear() {
    if (!selectedYearId) { showT("error", "Select an academic year first."); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/academic/years/${selectedYearId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!res.ok) { showT("error", "Failed to set year as active."); return; }
      showT("success", `"${selectedYear?.name}" set as the active academic year.`);
      router.refresh();
    } catch { showT("error", "Network error."); }
    finally { setSaving(false); }
  }

  async function handleSetActiveTerm(termId: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/academic/terms/${termId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setCurrent: true }),
      });
      if (!res.ok) { showT("error", "Failed to activate term."); return; }
      showT("success", "Term set as active.");
      router.refresh();
    } catch { showT("error", "Network error."); }
    finally { setSaving(false); }
  }

  async function handleDeleteTerm(termId: string) {
    setConfirmDeleteTermId(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/academic/terms/${termId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showT("error", err?.error ?? "Cannot delete this term.");
        return;
      }
      showT("success", "Term removed.");
      setSelectedTermId("");
      router.refresh();
    } catch { showT("error", "Network error."); }
    finally { setSaving(false); }
  }

  return (
    <div className={styles.root}>
      {/* Stats strip — only real, derived numbers */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Academic Years</span>
          <div className={styles.statBottom}>
            <span className={styles.statValue}>{years.length}</span>
            {activeYear && <span className={styles.activeBadge}>Active: {activeYear.name}</span>}
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Active Term</span>
          {activeTerm ? (
            <div>
              <div className={styles.statValue}>{activeTerm.name}</div>
              <div className={styles.statSub}>{teachingDays(activeTerm.startDate, activeTerm.endDate)} teaching days</div>
            </div>
          ) : (
            <div className={styles.statSub}>No active term</div>
          )}
        </div>
      </div>

      <div className={styles.mainLayout}>
        {/* Left: year list */}
        <aside className={styles.yearList}>
          <div className={styles.yearListHeader}>
            <span>Academic Years</span>
            <button className={styles.addYearBtn} onClick={() => setShowAddYear(true)} title="Create academic year">
              <Plus size={13} />
            </button>
          </div>
          {years.map((y) => {
            const active = selectedYearId === y.id;
            return (
              <button
                key={y.id}
                className={`${styles.yearItem} ${active ? styles.yearItemActive : ""}`}
                onClick={() => { setSelectedYearId(y.id); setSelectedTermId(y.terms[0]?.id ?? ""); }}
              >
                <span>{y.name}</span>
                {y.isCurrent && <span className={styles.currentPill}>Current</span>}
              </button>
            );
          })}
          {years.length === 0 && <div className={styles.emptyHint}>No academic years yet.</div>}
        </aside>

        {/* Center: terms table */}
        <div className={styles.centerPanel}>
          <div className={styles.centerHeader}>
            <h2 className={styles.centerTitle}>Terms ({selectedYear?.name ?? "—"})</h2>
            <div className={styles.centerActions}>
              {selectedYear && !selectedYear.isCurrent && (
                <button className={styles.btnOutline} onClick={handlePublishYear} disabled={saving}>
                  Set as Active Year
                </button>
              )}
              <button className={styles.btnFilled} onClick={() => setShowAddTerm(true)} disabled={!selectedYear}>
                <Plus size={13} /> Add Term
              </button>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {["Term Name", "Dates", "Status", "Teaching Days", "Actions"].map((h) => (
                    <th key={h} className={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(selectedYear?.terms ?? []).map((t) => {
                  const lbl = termLabel(t);
                  const isSelected = selectedTermId === t.id;
                  return (
                    <tr key={t.id} className={`${styles.tr} ${isSelected ? styles.trSelected : ""}`} onClick={() => setSelectedTermId(t.id)}>
                      <td className={styles.tdBold}>{t.name}</td>
                      <td className={styles.td}>{fmtDate(t.startDate)} – {fmtDate(t.endDate)}</td>
                      <td className={styles.td}><span className={`${styles.badge} ${TERM_STATUS_STYLE[lbl]}`}>{lbl}</span></td>
                      <td className={styles.td}>{teachingDays(t.startDate, t.endDate)} days</td>
                      <td className={styles.tdActions}>
                        {!t.isCurrent && (
                          <button className={styles.linkBtn} onClick={(e) => { e.stopPropagation(); handleSetActiveTerm(t.id); }}>
                            Activate
                          </button>
                        )}
                        <button className={styles.dangerBtn} onClick={(e) => { e.stopPropagation(); setConfirmDeleteTermId(t.id); }} title="Delete term">
                          <X size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {(selectedYear?.terms ?? []).length === 0 && (
                  <tr><td colSpan={5} className={styles.emptyCell}>No terms yet. Click &quot;+ Add Term&quot; to create one.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: term detail */}
        <aside className={styles.detailPanel}>
          {selectedTerm ? (
            <>
              <div className={styles.detailHeader}>
                <h3 className={styles.detailTitle}>Term Details</h3>
                <Edit2 size={15} className={styles.mutedIcon} />
              </div>
              <div className={styles.detailNameRow}>
                <span className={styles.detailName}>{selectedTerm.name}</span>
                {selectedTerm.isCurrent && <span className={styles.currentPill}>Active</span>}
              </div>
              <div className={styles.detailDates}>{fmtDate(selectedTerm.startDate)} — {fmtDate(selectedTerm.endDate)}</div>
              <div className={styles.detailStat}>
                <span className={styles.detailStatLabel}>Teaching Days</span>
                <span className={styles.detailStatValue}>{teachingDays(selectedTerm.startDate, selectedTerm.endDate)}</span>
              </div>
              <div className={styles.detailActionsRow}>
                {!selectedTerm.isCurrent ? (
                  <>
                    <button className={styles.btnFilled} onClick={() => handleSetActiveTerm(selectedTerm.id)} disabled={saving}>
                      Set as Active Term
                    </button>
                    <button className={styles.dangerOutlineBtn} onClick={() => setConfirmDeleteTermId(selectedTerm.id)}>
                      Delete Term
                    </button>
                  </>
                ) : (
                  <button className={styles.btnOutline} disabled title="Active term cannot be deleted">Active Term</button>
                )}
              </div>
            </>
          ) : (
            <div className={styles.noSelection}>Select a term to view details</div>
          )}
        </aside>
      </div>

      {/* Confirm delete term */}
      {confirmDeleteTermId && (() => {
        const t = selectedYear?.terms.find((t) => t.id === confirmDeleteTermId);
        return (
          <div className={styles.modalBackdrop} onClick={() => setConfirmDeleteTermId(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ width: 380 }}>
              <div className={styles.confirmHeader}>
                <AlertTriangle size={20} className={styles.dangerIcon} />
                <h2 className={styles.modalTitle}>Delete Term?</h2>
              </div>
              <p className={styles.confirmBody}>This will permanently remove <strong>{t?.name}</strong>. This action cannot be undone.</p>
              <div className={styles.modalFooter}>
                <button className={styles.btnOutline} onClick={() => setConfirmDeleteTermId(null)}>Cancel</button>
                <button className={styles.dangerBtnFilled} onClick={() => handleDeleteTerm(confirmDeleteTermId)}>Delete</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add Year modal */}
      {showAddYear && (
        <div className={styles.modalBackdrop} onClick={() => setShowAddYear(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Create Academic Year</h2>
              <button className={styles.modalClose} onClick={() => setShowAddYear(false)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Year Name *</label>
                <input className={styles.formInput} placeholder="e.g. 2027/2028" value={newYearName} onChange={(e) => setNewYearName(e.target.value)} />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Start Date *</label>
                <input className={styles.formInput} type="date" value={newYearStart} onChange={(e) => setNewYearStart(e.target.value)} />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>End Date *</label>
                <input className={styles.formInput} type="date" value={newYearEnd} onChange={(e) => setNewYearEnd(e.target.value)} />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setShowAddYear(false)}>Cancel</button>
              <button className={styles.btnFilled} onClick={handleAddYear} disabled={saving}>{saving ? "Creating…" : "Create Year"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Term modal */}
      {showAddTerm && (
        <div className={styles.modalBackdrop} onClick={() => setShowAddTerm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Add Term</h2>
                <p className={styles.modalSub}>{selectedYear?.name}</p>
              </div>
              <button className={styles.modalClose} onClick={() => setShowAddTerm(false)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Term Name *</label>
                <input className={styles.formInput} placeholder="e.g. Term 1" value={newTermName} onChange={(e) => setNewTermName(e.target.value)} />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Start Date *</label>
                <input className={styles.formInput} type="date" value={newTermStart} onChange={(e) => setNewTermStart(e.target.value)} />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>End Date *</label>
                <input className={styles.formInput} type="date" value={newTermEnd} onChange={(e) => setNewTermEnd(e.target.value)} />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setShowAddTerm(false)}>Cancel</button>
              <button className={styles.btnFilled} onClick={handleAddTerm} disabled={saving}>{saving ? "Saving…" : "Add Term"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
