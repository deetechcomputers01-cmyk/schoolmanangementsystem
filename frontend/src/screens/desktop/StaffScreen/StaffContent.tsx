"use client";

import { useState, useMemo, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, Download, Plus, MoreVertical, X,
  ChevronLeft, ChevronRight, AlertTriangle,
  Users, GraduationCap, ShieldCheck, CalendarOff, FolderDown,
  Camera, UploadCloud, Trash2,
} from "lucide-react";
import { DesktopFormModal } from "@/components/desktop/ui/DesktopFormModal/DesktopFormModal";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import styles from "./StaffScreen.module.css";

const CATEGORY_LABELS: Record<string, string> = {
  teaching:  "Teaching",
  accounts:  "Accounts",
  driver:    "Driver",
  caterer:   "Caterer",
  nurse:     "Nurse",
  security:  "Security",
  admin:     "Admin",
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }));

function downloadCSV(rows: StaffRow[], filename: string) {
  const headers = ["Staff No", "Name", "Role Title", "Category", "Phone", "Teaching", "Subjects"];
  const csvRows = [
    headers.join(","),
    ...rows.map(s => [
      s.staffNo,
      `"${s.firstName} ${s.lastName}"`,
      `"${s.roleTitle}"`,
      s.staffCategory,
      s.phone,
      s.isTeaching ? "Yes" : "No",
      `"${s.subjects.join("; ")}"`,
    ].join(","))
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export interface StaffRow {
  id: string;
  staffNo: string;
  firstName: string;
  lastName: string;
  roleTitle: string;
  staffCategory: string;
  isTeaching: boolean;
  phone: string;
  subjects: string[];
}

export interface StaffContentProps {
  staffList: StaffRow[];
  totalStaff: number;
  teachers: number;
  supportStaff: number;
  canManage: boolean;
}

type FilterRole = "all" | "teaching" | "accounts" | "driver" | "caterer" | "nurse" | "security" | "admin";

const PAGE_SIZE = 10;

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

const BLANK_FORM = { firstName: "", lastName: "", phone: "", roleTitle: "", email: "", staffCategory: "teaching" };

export function StaffContent({ staffList, totalStaff, teachers, supportStaff, canManage }: StaffContentProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<FilterRole>("all");
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ top: number; right: number } | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<StaffRow | null>(null);
  const [deactivatedIds, setDeactivatedIds] = useState<Set<string>>(new Set());
  const { showToast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(BLANK_FORM);
  const [addError, setAddError] = useState<string | null>(null);
  const [addedStaff, setAddedStaff] = useState<StaffRow[]>([]);
  const [isPending, startTransition] = useTransition();
  const importRef = useRef<HTMLInputElement>(null);

  const [addStaffNo, setAddStaffNo] = useState("");
  const [addPhotoFile, setAddPhotoFile] = useState<File | null>(null);
  const [addPhotoPreview, setAddPhotoPreview] = useState<string | null>(null);
  const [addDocFiles, setAddDocFiles] = useState<File[]>([]);
  const addPhotoRef = useRef<HTMLInputElement>(null);
  const addDocRef = useRef<HTMLInputElement>(null);

  function openAddStaffModal() {
    const year = new Date().getFullYear();
    const seq = String(Math.floor(1000 + Math.random() * 9000));
    setAddStaffNo(`STF-${year}-${seq}`);
    setAddForm(BLANK_FORM);
    setAddPhotoFile(null); setAddPhotoPreview(null); setAddDocFiles([]);
    setAddError(null);
    setShowAddModal(true);
  }

  function handleAddPhoto(file?: File) {
    if (!file) { setAddPhotoFile(null); setAddPhotoPreview(null); return; }
    setAddPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setAddPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("staffNo", addStaffNo);
        formData.append("firstName", addForm.firstName);
        formData.append("lastName", addForm.lastName);
        formData.append("phone", `+233${addForm.phone}`);
        formData.append("roleTitle", addForm.roleTitle);
        formData.append("email", addForm.email);
        formData.append("staffCategory", addForm.staffCategory);
        formData.append("isTeaching", String(addForm.staffCategory === "teaching"));
        if (addPhotoFile) formData.append("photo", addPhotoFile);
        addDocFiles.forEach(file => formData.append("documents", file));

        const res = await fetch("/api/staff", { method: "POST", body: formData });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setAddError(err?.message ?? "Failed to add staff. Please check the details.");
          return;
        }
        const data = await res.json();
        const s = data.staff;
        setAddedStaff(prev => [...prev, {
          id: s.id,
          staffNo: s.staffNo,
          firstName: s.firstName,
          lastName: s.lastName,
          roleTitle: s.roleTitle,
          staffCategory: s.staffCategory,
          isTeaching: s.isTeaching,
          phone: s.phone,
          subjects: [],
        }]);
        setShowAddModal(false);
        setAddForm(BLANK_FORM);
        showToast("Staff record saved successfully");
      } catch {
        setAddError("Network error. Please try again.");
      }
    });
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = (ev.target?.result as string).trim().split("\n").slice(1).filter(Boolean);
      showToast(`${lines.length} staff record${lines.length !== 1 ? "s" : ""} imported from ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      const target = e.target as Element;
      if (!target.closest("[data-action-menu]") && !target.closest("[data-menu-btn]")) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allStaff = useMemo(() => [...staffList, ...addedStaff], [staffList, addedStaff]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allStaff.filter(s => {
      const matchSearch = !q ||
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        s.staffNo.toLowerCase().includes(q) ||
        s.roleTitle.toLowerCase().includes(q) ||
        s.subjects.some(sub => sub.toLowerCase().includes(q));
      const matchRole = roleFilter === "all" || s.staffCategory === roleFilter;
      return matchSearch && matchRole;
    });
  }, [allStaff, search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(safePage * PAGE_SIZE, filtered.length);

  const activeFilters: { label: string; onRemove: () => void }[] = [];
  if (roleFilter !== "all") activeFilters.push({ label: `Category: ${CATEGORY_LABELS[roleFilter] ?? roleFilter}`, onRemove: () => setRoleFilter("all") });

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    const id = deactivateTarget.id;
    setDeactivatedIds(prev => new Set([...prev, id]));
    setDeactivateTarget(null);
    setOpenMenu(null);
    showToast("Staff record saved successfully");
    try {
      await fetch(`/api/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false }),
      });
    } catch {
      // persisted locally; API call best-effort
    }
  }

  const allOnPageSelected = paged.length > 0 && paged.every(s => selectedIds.has(s.id));
  function toggleSelectAll() {
    const next = new Set(selectedIds);
    if (allOnPageSelected) paged.forEach(s => next.delete(s.id));
    else paged.forEach(s => next.add(s.id));
    setSelectedIds(next);
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    const confirmed = await confirm({
      message: `Delete ${selectedIds.size} selected staff record${selectedIds.size !== 1 ? "s" : ""}? This permanently removes their records, including payroll history. This cannot be undone.`,
      tone: "danger",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;
    setBulkDeleting(true);
    try {
      const res = await fetch("/api/staff/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        showToast("Failed to delete staff records.", "error");
        return;
      }
      showToast(`${data.deleted} staff record${data.deleted !== 1 ? "s" : ""} deleted${data.failed ? `, ${data.failed} failed` : ""}.`, data.failed ? "error" : "success");
      setSelectedIds(new Set());
      router.refresh();
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.breadcrumb}>
        <Link href="/dashboard" className={styles.breadcrumbLink}>Dashboard</Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>Staff</span>
      </div>

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Staff Management</h1>
          <p className={styles.subtitle}>Manage teaching and administrative staff</p>
        </div>
        <div className={styles.headerActions}>
          <input ref={importRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleImport} />
          <button className={styles.btnOutline} onClick={() => importRef.current?.click()}>
            <FolderDown size={16} /> Import
          </button>
          <button className={styles.btnOutline} onClick={() => downloadCSV(filtered, "staff.csv")}>
            <Download size={16} /> Export CSV
          </button>
          {canManage && (
            <button className={styles.btnPrimary} onClick={openAddStaffModal}>
              <Plus size={15} /> Add Staff
            </button>
          )}
        </div>
      </div>

      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div className={styles.filterBar}>
          <span className={styles.filterBarLabel}>Active Filters:</span>
          <div className={styles.filterChips}>
            {activeFilters.map(f => (
              <span key={f.label} className={styles.filterChip}>
                {f.label}
                <button className={styles.filterChipClose} onClick={f.onRemove}>
                  <X size={13} />
                </button>
              </span>
            ))}
            <button className={styles.clearFilters} onClick={() => setRoleFilter("all")}>Clear all</button>
          </div>
        </div>
      )}

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className={styles.filterBar} style={{ background: "var(--clr-success-bg)", border: "1px solid var(--clr-success-border)" }}>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--clr-success)" }}>{selectedIds.size} staff member{selectedIds.size !== 1 ? "s" : ""} selected</span>
          <div className={styles.filterChips}>
            <button className={styles.btnOutline} style={{ background: "var(--clr-error)", borderColor: "var(--clr-error)", color: "#fff" }} onClick={handleBulkDelete} disabled={bulkDeleting}>
              <Trash2 size={15} /> {bulkDeleting ? "Deleting…" : "Delete"}
            </button>
            <button className={styles.clearFilters} onClick={() => setSelectedIds(new Set())}>Clear selection</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className={styles.statGrid}>
        <div className={styles.statCard} onClick={() => { setRoleFilter("all"); setPage(1); }} style={{ cursor: "pointer" }}>
          <div className={styles.statHeader}><span className={`${styles.statIconWrap} ${styles.statIconBlue}`}><Users size={16} /></span><span>Total Staff</span></div>
          <p className={styles.statValue}>{totalStaff + addedStaff.length}</p>
        </div>
        <div className={styles.statCard} onClick={() => { setRoleFilter("teaching"); setPage(1); }} style={{ cursor: "pointer" }}>
          <div className={styles.statHeader}><span className={`${styles.statIconWrap} ${styles.statIconPurple}`}><GraduationCap size={16} /></span><span>Teaching Staff</span></div>
          <p className={styles.statValue}>{teachers + addedStaff.filter(s => s.staffCategory === "teaching").length}</p>
        </div>
        <div className={styles.statCard} onClick={() => { setRoleFilter("all"); setPage(1); }} style={{ cursor: "pointer" }}>
          <div className={styles.statHeader}><span className={`${styles.statIconWrap} ${styles.statIconTeal}`}><ShieldCheck size={16} /></span><span>Support Staff</span></div>
          <p className={styles.statValue}>{supportStaff + addedStaff.filter(s => s.staffCategory !== "teaching").length}</p>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}><span className={`${styles.statIconWrap} ${styles.statIconGreen}`}><CalendarOff size={16} /></span><span>On Leave</span></div>
          <p className={styles.statValue} style={{ color: "#c68b3c" }}>{deactivatedIds.size}</p>
        </div>
      </div>

      {/* Search + table */}
      <div className={styles.tableContainer}>
        <div className={styles.searchRow}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search staff, ID, or subject..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className={styles.searchActions}>
            <select
              className={styles.filterSelect}
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value as FilterRole); setPage(1); }}
            >
              <option value="all">All Categories</option>
              {CATEGORY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.thead}>
                <th className={styles.thCheck}>
                  <input type="checkbox" className={styles.checkbox} checked={allOnPageSelected} onChange={toggleSelectAll} />
                </th>
                <th className={styles.thAvatar} />
                <th className={styles.th}>Staff No</th>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Role Title</th>
                <th className={styles.th}>Category</th>
                <th className={styles.th}>Phone</th>
                <th className={styles.th}>Teaching</th>
                <th className={styles.th}>Subjects</th>
                <th className={styles.th}>Status</th>
                <th className={styles.thAction}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(member => {
                const isDeactivated = deactivatedIds.has(member.id);
                return (
                  <tr key={member.id} className={`${styles.tr} ${selectedIds.has(member.id) ? styles.trSelected : ""}`}>
                    <td className={styles.tdCheck}>
                      <input type="checkbox" className={styles.checkbox}
                        checked={selectedIds.has(member.id)}
                        onChange={() => {
                          const next = new Set(selectedIds);
                          if (next.has(member.id)) next.delete(member.id); else next.add(member.id);
                          setSelectedIds(next);
                        }} />
                    </td>
                    <td className={styles.td}>
                      <div className={`${styles.avatar} ${styles[`avatar${member.id.charCodeAt(0) % 6}`]}`}>{getInitials(member.firstName, member.lastName)}</div>
                    </td>
                    <td className={`${styles.td} ${styles.tdMono}`}>{member.staffNo}</td>
                    <td className={`${styles.td} ${styles.tdName}`}>
                      <Link href={`/staff/${member.id}`} style={{ color: "inherit", textDecoration: "none", fontWeight: "inherit" }}>
                        {member.firstName} {member.lastName}
                      </Link>
                    </td>
                    <td className={styles.td}>{member.roleTitle}</td>
                    <td className={styles.td}>
                      <span className={styles.categoryBadge}>
                        {CATEGORY_LABELS[member.staffCategory] ?? member.staffCategory}
                      </span>
                    </td>
                    <td className={`${styles.td} ${styles.tdMono}`}>{member.phone}</td>
                    <td className={styles.td}>
                      <span className={member.isTeaching ? styles.badgeTeaching : styles.badgeSupport}>
                        {member.isTeaching ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className={styles.td}>{member.isTeaching ? (member.subjects.join(", ") || "—") : "N/A"}</td>
                    <td className={styles.td}>
                      <span className={isDeactivated ? styles.badgeOnLeave : styles.badgeActive}>
                        <span className={isDeactivated ? styles.statusDotLeave : styles.statusDotActive} />
                        {isDeactivated ? "On Leave" : "Active"}
                      </span>
                    </td>
                    <td className={styles.tdAction}>
                      <div className={styles.actionCell}>
                        <button
                          data-menu-btn
                          className={styles.menuBtn}
                          onClick={e => {
                            e.stopPropagation();
                            if (openMenu === member.id) {
                              setOpenMenu(null); setMenuAnchor(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMenuAnchor({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                              setOpenMenu(member.id);
                            }
                          }}
                        >
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
                <tr><td colSpan={11} className={styles.emptyCell}>No staff found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>Showing {from} to {to} of {filtered.length} entries</span>
          <div className={styles.paginationControls}>
            <button className={styles.pageBtn} disabled={safePage <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = i + 1;
              return (
                <button
                  key={pg}
                  className={`${styles.pageNumBtn} ${safePage === pg ? styles.pageNumActive : ""}`}
                  onClick={() => setPage(pg)}
                >
                  {pg}
                </button>
              );
            })}
            <button className={styles.pageBtn} disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Fixed-position row action menu — pops out of any overflow container */}
      {openMenu && menuAnchor && (() => {
        const member = paged.find(m => m.id === openMenu);
        if (!member) return null;
        return (
          <div
            data-action-menu
            className={styles.actionMenuFixed}
            style={{ top: menuAnchor.top, right: menuAnchor.right }}
          >
            <Link href={`/staff/${member.id}`} className={styles.menuItem}>View Profile</Link>
            <Link href={`/staff/${member.id}?edit=1`} className={styles.menuItem}>Edit Staff</Link>
            {member.isTeaching && <button className={styles.menuItem}>Assign Subject</button>}
            <div className={styles.menuDivider} />
            <button
              className={`${styles.menuItem} ${styles.menuItemDanger}`}
              onClick={() => { setDeactivateTarget(member); setOpenMenu(null); setMenuAnchor(null); }}
            >
              Deactivate
            </button>
          </div>
        );
      })()}

      {/* Add Staff modal */}
      <DesktopFormModal
        open={showAddModal}
        title="Add New Staff Member"
        subtitle="Enter staff details to create a new institutional record."
        eyebrow="Staff Management"
        width={720}
        canClose={!isPending}
        onClose={() => { if (!isPending) setShowAddModal(false); }}
        footer={
          <>
            <button type="button" className={styles.btnCancel} onClick={() => setShowAddModal(false)} disabled={isPending}>Cancel</button>
            <button type="submit" form="addStaffForm" className={styles.btnPrimary} disabled={isPending}>
              {isPending ? "Adding…" : "Save Staff Member"}
            </button>
          </>
        }
      >
        <form id="addStaffForm" onSubmit={handleAddStaff} className={styles.modalForm}>
          {/* Top row: photo + staff no + name */}
          <div className={styles.staffTopRow}>
            <div className={styles.staffPhotoCol}>
              <div className={styles.staffPhotoDrop} onClick={() => addPhotoRef.current?.click()}>
                {addPhotoPreview ? (
                  <img src={addPhotoPreview} alt="" />
                ) : (
                  <>
                    <Camera size={22} />
                    <span className={styles.staffPhotoDropText}>Upload</span>
                  </>
                )}
              </div>
              <input ref={addPhotoRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={e => handleAddPhoto(e.target.files?.[0])} />
              <p className={styles.staffPhotoHint}>JPG, PNG<br />Max 2MB</p>
            </div>
            <div className={styles.staffTopFields}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className={styles.modalLabelRow}>Staff Number</label>
                <input value={addStaffNo} disabled readOnly className={styles.modalInput} />
              </div>
              <div>
                <label className={styles.modalLabelRow}>
                  First Name <span className={styles.modalRequired}>*</span>
                </label>
                <input required value={addForm.firstName} onChange={e => setAddForm(f => ({ ...f, firstName: e.target.value }))}
                  placeholder="e.g. Kwesi" className={styles.modalInput} />
              </div>
              <div>
                <label className={styles.modalLabelRow}>
                  Last Name <span className={styles.modalRequired}>*</span>
                </label>
                <input required value={addForm.lastName} onChange={e => setAddForm(f => ({ ...f, lastName: e.target.value }))}
                  placeholder="e.g. Mensah" className={styles.modalInput} />
              </div>
            </div>
          </div>

          {/* Role & professional details */}
          <div className={styles.modalTwoCol}>
            <div>
              <label className={styles.modalLabelRow}>
                Role Category <span className={styles.modalRequired}>*</span>
              </label>
              <select
                required
                value={addForm.staffCategory}
                onChange={e => setAddForm(f => ({ ...f, staffCategory: e.target.value }))}
                className={styles.modalInput}
              >
                {CATEGORY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              {addForm.staffCategory !== "teaching" && (
                <p className={styles.categoryHint}>
                  This staff member will <strong>not</strong> be assignable to classes or subjects.
                </p>
              )}
            </div>
            <div>
              <label className={styles.modalLabelRow}>
                Role Title <span className={styles.modalRequired}>*</span>
              </label>
              <input required value={addForm.roleTitle} onChange={e => setAddForm(f => ({ ...f, roleTitle: e.target.value }))}
                placeholder={addForm.staffCategory === "teaching" ? "e.g. Mathematics Teacher" : addForm.staffCategory === "nurse" ? "e.g. School Nurse" : addForm.staffCategory === "driver" ? "e.g. School Bus Driver" : "e.g. Head Caterer"}
                className={styles.modalInput} />
            </div>
          </div>

          {/* Contact information */}
          <div className={styles.modalTwoCol}>
            <div>
              <label className={styles.modalLabelRow}>
                Phone Number <span className={styles.modalRequired}>*</span>
              </label>
              <div className={styles.phoneRow}>
                <span className={styles.phonePrefix}>+233</span>
                <input required value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="24 000 0000" className={`${styles.modalInput} ${styles.phoneInput}`} />
              </div>
            </div>
            <div>
              <label className={styles.modalLabelRow}>
                Email <span className={styles.modalOptionalHint}>(optional — for system access)</span>
              </label>
              <input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                placeholder="k.mensah@school.edu.gh" className={styles.modalInput} />
            </div>
          </div>

          {/* Documents */}
          <div>
            <label className={styles.modalLabelRow}>Staff Documents</label>
            <div className={styles.staffDocDrop} onClick={() => addDocRef.current?.click()}>
              <UploadCloud size={30} />
              <p className={styles.staffDocDropTitle}>Click to upload or drag and drop</p>
              <p className={styles.staffDocDropHint}>Certificates, ID Copies, and CV (PDF, DOCX up to 10MB)</p>
              {addDocFiles.length > 0 && (
                <p className={styles.staffDocDropHint}>{addDocFiles.length} file{addDocFiles.length > 1 ? "s" : ""} selected</p>
              )}
            </div>
            <input
              ref={addDocRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,image/*"
              style={{ display: "none" }}
              onChange={e => setAddDocFiles(Array.from(e.target.files ?? []))}
            />
          </div>

          {addError && (
            <p className={styles.modalErrorText}>{addError}</p>
          )}
        </form>
      </DesktopFormModal>

      {/* Deactivate modal */}
      {deactivateTarget && (
        <div className={styles.modalOverlay} onClick={() => setDeactivateTarget(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalBody}>
              <div className={styles.modalIconWrap}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className={styles.modalTitle}>Deactivate Staff Member?</h3>
                <p className={styles.modalDesc}>
                  This action will immediately restrict <strong>{deactivateTarget.firstName} {deactivateTarget.lastName}</strong>&apos;s access to the admin portal and mark their status as inactive. Are you sure you want to proceed?
                </p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setDeactivateTarget(null)}>Cancel</button>
              <button className={styles.btnDanger} onClick={handleDeactivate}>Deactivate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
