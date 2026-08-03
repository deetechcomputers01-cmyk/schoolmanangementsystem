"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Award, ShieldCheck, PieChart, Hourglass, Ban, Search, Plus, X, ChevronDown } from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import styles from "./ScholarshipsScreen.module.css";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";

interface ScholarshipRow {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  type: "percent" | "fixed";
  value: number;
  reason: string | null;
  academicYearName: string;
  status: "active" | "expired" | "revoked";
  approvedByName: string;
  createdAt: string;
}
interface StudentOption { id: string; name: string; admissionNo: string; className: string }
interface YearOption { id: string; name: string; isCurrent: boolean }

interface Props {
  scholarships: ScholarshipRow[];
  students: StudentOption[];
  years: YearOption[];
}

function fmtValue(type: "percent" | "fixed", value: number) {
  return type === "percent" ? `${value}%` : `GHS ${value.toLocaleString()}`;
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export function ScholarshipsContent({ scholarships, students, years }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [showModal, setShowModal] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("10");
  const [reason, setReason] = useState("");
  const [yearId, setYearId] = useState(years.find((y) => y.isCurrent)?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [bulkRevoking, setBulkRevoking] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filteredModalStudents = useMemo(() => {
    const q = modalSearch.toLowerCase();
    if (!q) return students;
    return students.filter((s) => s.name.toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q));
  }, [students, modalSearch]);

  const activeScholarships = scholarships.filter((s) => s.status === "active");
  const activeCount = activeScholarships.length;
  const totalFixedActive = activeScholarships.filter((s) => s.type === "fixed").reduce((sum, s) => sum + s.value, 0);
  const percentCount = scholarships.filter((s) => s.type === "percent").length;
  const fixedCount = scholarships.filter((s) => s.type === "fixed").length;
  const percentPct = scholarships.length > 0 ? Math.round((percentCount / scholarships.length) * 100) : 0;
  const fixedPct = scholarships.length > 0 ? 100 - percentPct : 0;
  const inactiveCount = scholarships.filter((s) => s.status !== "active").length;

  const filteredScholarships = useMemo(() => scholarships.filter((s) =>
    (statusFilter === "" || s.status === statusFilter) &&
    (typeFilter === "" || s.type === typeFilter) &&
    (search === "" || s.studentName.toLowerCase().includes(search.toLowerCase()) || (s.reason ?? "").toLowerCase().includes(search.toLowerCase()))
  ), [scholarships, statusFilter, typeFilter, search]);

  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredScholarships.length / PAGE_SIZE));
  const pageScholarships = filteredScholarships.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleStudent(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function openModal() {
    setSelectedIds(new Set());
    setModalSearch("");
    setType("percent");
    setValue("10");
    setReason("");
    setError("");
    setShowModal(true);
  }

  async function submitScholarship() {
    if (selectedIds.size === 0) { setError("Select at least one student."); return; }
    const numValue = Number(value);
    if (!numValue || numValue <= 0) { setError("Enter a valid value."); return; }
    setSaving(true);
    setError("");
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
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setError(err?.error?.message ?? err?.message ?? "Failed to apply scholarship.");
        return;
      }
      setShowModal(false);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function revoke(id: string) {
    setRevokingId(id);
    try {
      const res = await fetch(`/api/scholarships/${id}`, { method: "PATCH" });
      if (res.ok) router.refresh();
    } finally {
      setRevokingId(null);
    }
  }

  async function bulkRevoke() {
    if (checkedIds.size === 0) return;
    const confirmed = await confirm({
      message: `Revoke ${checkedIds.size} selected scholarship${checkedIds.size !== 1 ? "s" : ""}? This immediately removes their fee discount.`,
      tone: "danger",
      confirmLabel: "Revoke",
    });
    if (!confirmed) return;
    setBulkRevoking(true);
    try {
      const results = await Promise.allSettled(
        Array.from(checkedIds).map((id) => fetch(`/api/scholarships/${id}`, { method: "PATCH" }))
      );
      const succeeded = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;
      const failed = results.length - succeeded;
      showToast(`${succeeded} scholarship${succeeded !== 1 ? "s" : ""} revoked${failed ? `, ${failed} failed` : ""}.`, failed ? "error" : "success");
      setCheckedIds(new Set());
      router.refresh();
    } finally {
      setBulkRevoking(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Scholarships Management</h1>
          <p className={styles.subtitle}>Manage and monitor institutional aid, student discounts, and financial grants.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnPrimary} onClick={openModal}>
            <Plus size={15} /> Award Scholarship
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox}><ShieldCheck size={19} /></div>
          <div>
            <p className={styles.statLabel}>Active Scholarships</p>
            <p className={styles.statValue}>{activeCount}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIconBox}><Award size={19} /></div>
          <div>
            <p className={styles.statLabel}>Total Fixed Awards</p>
            <p className={`${styles.statValue} ${styles.statValueSm}`}>GHS {totalFixedActive.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIconBox}><PieChart size={19} /></div>
          <div>
            <p className={styles.statLabel}>Distribution</p>
            <p className={`${styles.statValue} ${styles.statValueSm}`}>
              {percentPct}% <span className={styles.distroLabel}>Percent</span> / {fixedPct}% <span className={styles.distroLabel}>Fixed</span>
            </p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIconBox}><Hourglass size={19} /></div>
          <div>
            <p className={styles.statLabel}>Inactive Scholarships</p>
            <p className={styles.statValue}>{inactiveCount}</p>
            <p className={styles.statSub}>Expired or revoked</p>
          </div>
        </div>
      </div>

      <div className={styles.mainCard}>
        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input className={styles.searchInput} placeholder="Search students or reasons…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className={styles.filterRight}>
            <div className={styles.selectWrap}>
              <select className={styles.select} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="revoked">Revoked</option>
              </select>
              <ChevronDown size={14} className={styles.selectChevron} />
            </div>
            <div className={styles.selectWrap}>
              <select className={styles.select} value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
                <option value="">All Types</option>
                <option value="percent">Percent</option>
                <option value="fixed">Fixed</option>
              </select>
              <ChevronDown size={14} className={styles.selectChevron} />
            </div>
          </div>
        </div>

        {checkedIds.size > 0 && (
          <div className={styles.filterBar} style={{ background: "var(--clr-success-bg)", borderBottom: "1px solid var(--clr-success-border)" }}>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--clr-success)" }}>{checkedIds.size} selected</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className={styles.revokeBtn} onClick={bulkRevoke} disabled={bulkRevoking}>
                <Ban size={13} /> {bulkRevoking ? "Revoking…" : "Revoke Selected"}
              </button>
              <button className={styles.btnOutline} onClick={() => setCheckedIds(new Set())}>Clear</button>
            </div>
          </div>
        )}

        {pageScholarships.length === 0 ? (
          <div className={styles.emptyState}>
            <Award size={32} className={styles.emptyIcon} />
            <p>{scholarships.length === 0 ? "No scholarships have been applied yet." : "No scholarships match your filters."}</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      checked={pageScholarships.some(s => s.status === "active") && pageScholarships.filter(s => s.status === "active").every(s => checkedIds.has(s.id))}
                      onChange={() => {
                        const activeRows = pageScholarships.filter(s => s.status === "active");
                        const next = new Set(checkedIds);
                        if (activeRows.every(s => checkedIds.has(s.id))) activeRows.forEach(s => next.delete(s.id));
                        else activeRows.forEach(s => next.add(s.id));
                        setCheckedIds(next);
                      }}
                    />
                  </th>
                  <th>Student</th>
                  <th>Type</th>
                  <th className={styles.right}>Value</th>
                  <th>Reason</th>
                  <th className={styles.center}>Year</th>
                  <th>Status</th>
                  <th>Approved By</th>
                  <th className={styles.right}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pageScholarships.map((s) => (
                  <tr key={s.id} className={styles.dataRow}>
                    <td>
                      <input
                        type="checkbox"
                        checked={checkedIds.has(s.id)}
                        disabled={s.status !== "active"}
                        onChange={() => {
                          const next = new Set(checkedIds);
                          if (next.has(s.id)) next.delete(s.id); else next.add(s.id);
                          setCheckedIds(next);
                        }}
                      />
                    </td>
                    <td>
                      <div className={styles.studentCell}>
                        <div className={styles.avatar}>{initials(s.studentName)}</div>
                        <div>
                          <div className={styles.studentName}>{s.studentName}</div>
                          <div className={styles.studentClass}>{s.className}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={styles.typeBadge}>{s.type}</span></td>
                    <td className={`${styles.right} ${styles.tdMono}`}>{fmtValue(s.type, s.value)}</td>
                    <td className={styles.tdMuted}>{s.reason ?? "—"}</td>
                    <td className={styles.center}>{s.academicYearName}</td>
                    <td>
                      <span className={`${styles.statusPill} ${s.status === "active" ? styles.statusActive : s.status === "revoked" ? styles.statusRevoked : styles.statusExpired}`}>
                        <span className={styles.statusDot} />{s.status}
                      </span>
                    </td>
                    <td className={styles.tdMuted}>{s.approvedByName}</td>
                    <td className={styles.right}>
                      {s.status === "active" && (
                        <button className={styles.revokeBtn} disabled={revokingId === s.id} onClick={() => revoke(s.id)}>
                          <Ban size={13} /> {revokingId === s.id ? "…" : "Revoke"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredScholarships.length > 0 && (
          <div className={styles.paginationBar}>
            <span>Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filteredScholarships.length)} of {filteredScholarships.length} records</span>
            <div className={styles.pageButtons}>
              <button className={styles.pageBtn} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className={styles.pageBtn} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className={`${styles.modalOverlay} desktopOnly`} onClick={() => !saving && setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Award Scholarship</h2>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              {error && <p className={styles.errorText}>{error}</p>}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Students * ({selectedIds.size} selected)</label>
                <div className={styles.searchWrapModal}>
                  <Search size={14} className={styles.searchIcon} style={{ left: 10 }} />
                  <input className={styles.searchInput} style={{ paddingLeft: 32 }} placeholder="Search students…" value={modalSearch} onChange={(e) => setModalSearch(e.target.value)} />
                </div>
              </div>
              <div className={styles.studentList}>
                {filteredModalStudents.map((s) => (
                  <label key={s.id} className={styles.studentItem}>
                    <input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => toggleStudent(s.id)} />
                    <span>{s.name}</span>
                    <span className={styles.studentItemMeta}>{s.admissionNo} · {s.className}</span>
                  </label>
                ))}
                {filteredModalStudents.length === 0 && <p className={styles.noStudentsHint}>No students match.</p>}
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Discount Type</label>
                  <select className={styles.formSelect} value={type} onChange={(e) => setType(e.target.value as "percent" | "fixed")}>
                    <option value="percent">Percentage</option>
                    <option value="fixed">Fixed Amount (GHS)</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{type === "percent" ? "Percent (1-100)" : "Amount (GHS)"}</label>
                  <input className={styles.formInput} type="number" min={1} max={type === "percent" ? 100 : undefined} value={value} onChange={(e) => setValue(e.target.value)} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Academic Year Scope</label>
                <select className={styles.formSelect} value={yearId} onChange={(e) => setYearId(e.target.value)}>
                  <option value="">All years (no expiry)</option>
                  {years.map((y) => <option key={y.id} value={y.id}>{y.name}{y.isCurrent ? " (current)" : ""}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Reason</label>
                <input className={styles.formInput} placeholder="e.g. Merit scholarship, staff ward, sibling discount" value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
              <button className={styles.btnPrimary} onClick={submitScholarship} disabled={saving}>
                {saving ? "Applying…" : `Apply to ${selectedIds.size || ""} Student${selectedIds.size !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Award Scholarship sheet — mobile */}
      <div className="mobileOnly">
        <MobileSheet
          open={showModal}
          onClose={() => !saving && setShowModal(false)}
          title="Award Scholarship"
          footer={<>
            <button type="button" className={kit.btnOutline} onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
            <button type="button" className={kit.btnPrimary} onClick={submitScholarship} disabled={saving}>
              {saving ? "Applying…" : "Award Scholarship"}
            </button>
          </>}
        >
          {error && <p className={kit.errorText}>{error}</p>}
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
    </div>
  );
}
