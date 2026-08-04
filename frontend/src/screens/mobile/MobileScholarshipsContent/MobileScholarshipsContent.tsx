"use client";

/**
 * MobileScholarshipsContent — bespoke mobile view for the Scholarships screen.
 *
 * Every field/action traces back to ScholarshipsContent.tsx (the real desktop
 * component) and the real /api/scholarships endpoints — same submitScholarship()
 * (POST) and revoke() (PATCH) handlers, same 4 real KPIs.
 *
 * Deviations from the Stitch mockup (mobile_scholarships_scholarsphere_pro):
 *   - The mockup's "Pending Review" and "Expiring Soon" KPI cards, per-award
 *     "Sponsor" field (GETFund/PTA Fund/Ghana Education Trust), and the
 *     expanded card's "Fee Impact"/"Remaining" breakdown have no backing
 *     anywhere — the real ScholarshipRow has no approval-pending status (only
 *     active/expired/revoked), no sponsor/donor field, and no per-scholarship
 *     fee-impact computation. Replaced the KPI grid with the real 4 (Active,
 *     Total Fixed Awards, Distribution, Inactive) and dropped Sponsor/Fee
 *     Impact from the cards, showing real fields instead (type, value,
 *     reason, year, approved by).
 *   - Filter chips (Merit/Need-Based/Expiring) don't map to real fields —
 *     replaced with the real status filter (Active/Expired/Revoked) and a
 *     type filter (Percent/Fixed), matching desktop's actual filters.
 *   - "Adjust"/"Notify"/"View Application"/"Approve" expanded-card actions
 *     have no real endpoint — the only real per-row action is Revoke
 *     (active scholarships only), matching desktop's revoke() exactly.
 *     Desktop's bulk-select-and-revoke bar was simplified to per-card
 *     Revoke, since a mobile multi-select toolbar didn't fit the space.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Award, PieChart, Hourglass, Search, Plus, Ban, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import { fmtValue, initials } from "@/screens/desktop/ScholarshipsScreen/ScholarshipsContent";
import type { ScholarshipsContentProps } from "@/screens/desktop/ScholarshipsScreen/ScholarshipsContent";
import styles from "./MobileScholarshipsContent.module.css";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "revoked", label: "Revoked" },
] as const;

export function MobileScholarshipsContent({ scholarships, students, years }: ScholarshipsContentProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const activeScholarships = scholarships.filter((s) => s.status === "active");
  const activeCount = activeScholarships.length;
  const totalFixedActive = activeScholarships.filter((s) => s.type === "fixed").reduce((sum, s) => sum + s.value, 0);
  const percentCount = scholarships.filter((s) => s.type === "percent").length;
  const percentPct = scholarships.length > 0 ? Math.round((percentCount / scholarships.length) * 100) : 0;
  const fixedPct = scholarships.length > 0 ? 100 - percentPct : 0;
  const inactiveCount = scholarships.filter((s) => s.status !== "active").length;

  const filtered = useMemo(() => scholarships.filter((s) =>
    (statusFilter === "" || s.status === statusFilter) &&
    (typeFilter === "" || s.type === typeFilter) &&
    (search === "" || s.studentName.toLowerCase().includes(search.toLowerCase()) || (s.reason ?? "").toLowerCase().includes(search.toLowerCase()))
  ), [scholarships, statusFilter, typeFilter, search]);

  async function revoke(id: string, name: string) {
    const sure = await confirm({ message: `Revoke ${name}'s scholarship? This immediately removes their fee discount.`, confirmLabel: "Revoke" });
    if (!sure) return;
    setRevokingId(id);
    try {
      const res = await fetch(`/api/scholarships/${id}`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed");
      showToast("Scholarship revoked");
      router.refresh();
    } catch {
      showToast("Failed to revoke scholarship", "error");
    } finally {
      setRevokingId(null);
    }
  }

  // ── Award Scholarship sheet ──────────────────────────────────────────
  const [sheetOpen, setSheetOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("10");
  const [reason, setReason] = useState("");
  const [yearId, setYearId] = useState(years.find((y) => y.isCurrent)?.id ?? "");
  const [saving, setSaving] = useState(false);

  const filteredModalStudents = useMemo(() => {
    const q = modalSearch.toLowerCase();
    if (!q) return students;
    return students.filter((s) => s.name.toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q));
  }, [students, modalSearch]);

  function toggleStudent(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function openSheet() {
    setSelectedIds(new Set());
    setModalSearch("");
    setType("percent");
    setValue("10");
    setReason("");
    setSheetOpen(true);
  }

  async function submitScholarship() {
    if (selectedIds.size === 0) { showToast("Select at least one student.", "error"); return; }
    const numValue = Number(value);
    if (!numValue || numValue <= 0) { showToast("Enter a valid value.", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/scholarships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: Array.from(selectedIds),
          type,
          value: numValue,
          reason: reason.trim() || undefined,
          academicYearId: yearId || null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSheetOpen(false);
      showToast("Scholarship awarded");
      router.refresh();
    } catch {
      showToast("Failed to award scholarship", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Active</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValue}>{activeCount}</strong><ShieldCheck size={18} className={styles.kpiIcon} /></div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Fixed Awards</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValueSm}>GHS {totalFixedActive.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong><Award size={18} className={styles.kpiIcon} /></div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Distribution</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValueSm}>{percentPct}% / {fixedPct}%</strong><PieChart size={18} className={styles.kpiIcon} /></div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Inactive</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValue}>{inactiveCount}</strong><Hourglass size={18} className={styles.kpiIcon} /></div>
        </div>
      </div>

      <button type="button" className={styles.addBtn} onClick={openSheet}><Plus size={16} /> Award Scholarship</button>

      <label className={kit.searchWrap}>
        <Search size={16} className={kit.searchIcon} />
        <input className={`${kit.input} ${kit.searchInput}`} placeholder="Search students or reasons" value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>

      <div className={styles.chipRow}>
        {STATUS_FILTERS.map((f) => (
          <button key={f.value} type="button" className={`${styles.chip} ${statusFilter === f.value ? styles.chipActive : ""}`} onClick={() => setStatusFilter(f.value)}>{f.label}</button>
        ))}
      </div>
      <div className={styles.chipRow}>
        <button type="button" className={`${styles.chip} ${typeFilter === "" ? styles.chipActive : ""}`} onClick={() => setTypeFilter("")}>All Types</button>
        <button type="button" className={`${styles.chip} ${typeFilter === "percent" ? styles.chipActive : ""}`} onClick={() => setTypeFilter(typeFilter === "percent" ? "" : "percent")}>Percent</button>
        <button type="button" className={`${styles.chip} ${typeFilter === "fixed" ? styles.chipActive : ""}`} onClick={() => setTypeFilter(typeFilter === "fixed" ? "" : "fixed")}>Fixed</button>
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <p className={kit.emptyText}>{scholarships.length === 0 ? "No scholarships have been applied yet." : "No scholarships match your filters."}</p>
        ) : filtered.map((s) => {
          const isOpen = openId === s.id;
          return (
            <article key={s.id} className={`${styles.card} ${isOpen ? styles.cardOpen : ""}`}>
              <button type="button" className={styles.cardHeader} onClick={() => setOpenId(isOpen ? null : s.id)}>
                <span className={kit.pickAvatar}>{initials(s.studentName)}</span>
                <div className={styles.cardHeaderText}>
                  <span className={styles.studentName}>{s.studentName}</span>
                  <span className={styles.studentMeta}>{s.className}</span>
                </div>
                <span className={`${styles.statusPill} ${styles[`status_${s.status}`]}`}>{s.status}</span>
                {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {isOpen && (
                <div className={styles.cardDetail}>
                  <div className={styles.detailRow}><span>Type</span><strong className={styles.typeBadge}>{s.type}</strong></div>
                  <div className={styles.detailRow}><span>Value</span><strong>{fmtValue(s.type, s.value)}</strong></div>
                  <div className={styles.detailRow}><span>Reason</span><strong>{s.reason ?? "—"}</strong></div>
                  <div className={styles.detailRow}><span>Year</span><strong>{s.academicYearName}</strong></div>
                  <div className={styles.detailRow}><span>Approved By</span><strong>{s.approvedByName}</strong></div>

                  {s.status === "active" && (
                    <button type="button" className={styles.revokeBtn} disabled={revokingId === s.id} onClick={() => revoke(s.id, s.studentName)}>
                      <Ban size={13} /> {revokingId === s.id ? "Revoking…" : "Revoke Scholarship"}
                    </button>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <MobileSheet
        open={sheetOpen}
        onClose={() => !saving && setSheetOpen(false)}
        title="Award Scholarship"
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => setSheetOpen(false)} disabled={saving}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={submitScholarship} disabled={saving}>
            {saving ? "Applying…" : `Apply to ${selectedIds.size || ""} Student${selectedIds.size !== 1 ? "s" : ""}`}
          </button>
        </>}
      >
        <div className={kit.field}>
          <label>Students *</label>
          <div className={kit.searchWrap}>
            <Search size={14} className={kit.searchIcon} />
            <input className={`${kit.input} ${kit.searchInput}`} placeholder="Search students…" value={modalSearch} onChange={(e) => setModalSearch(e.target.value)} />
          </div>
        </div>
        <p className={kit.pickCount}>{selectedIds.size} selected</p>
        <div className={kit.pickList}>
          {filteredModalStudents.map((s) => (
            <div key={s.id} className={`${kit.pickRow} ${selectedIds.has(s.id) ? kit.pickRowActive : ""}`} onClick={() => toggleStudent(s.id)}>
              <input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => toggleStudent(s.id)} onClick={(e) => e.stopPropagation()} />
              <div className={kit.pickAvatar}>{initials(s.name)}</div>
              <div className={kit.pickInfo}>
                <p className={kit.pickName}>{s.name}</p>
                <p className={kit.pickSub}>{s.admissionNo} · {s.className}</p>
              </div>
            </div>
          ))}
          {filteredModalStudents.length === 0 && <p className={kit.emptyText}>No students match.</p>}
        </div>

        <div className={kit.field}>
          <label>Discount Type</label>
          <div className={kit.segmented}>
            <button type="button" className={`${kit.segBtn} ${type === "percent" ? kit.segBtnActive : ""}`} onClick={() => setType("percent")}>Percentage</button>
            <button type="button" className={`${kit.segBtn} ${type === "fixed" ? kit.segBtnActive : ""}`} onClick={() => setType("fixed")}>Fixed Amount</button>
          </div>
        </div>
        <div className={kit.field}>
          <label>{type === "percent" ? "Percent (1-100)" : "Amount (GHS)"}</label>
          <input className={kit.input} type="number" min={1} max={type === "percent" ? 100 : undefined} value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div className={kit.field}>
          <label>Academic Year Scope</label>
          <select className={kit.select} value={yearId} onChange={(e) => setYearId(e.target.value)}>
            <option value="">All years (no expiry)</option>
            {years.map((y) => <option key={y.id} value={y.id}>{y.name}{y.isCurrent ? " (current)" : ""}</option>)}
          </select>
        </div>
        <div className={kit.field}>
          <label>Reason</label>
          <input className={kit.input} placeholder="e.g. Merit scholarship, staff ward, sibling discount" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </MobileSheet>
    </div>
  );
}
