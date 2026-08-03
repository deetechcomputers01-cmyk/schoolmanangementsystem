"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap, UserPlus, Users, CheckCircle2,
  Search, SlidersHorizontal, MoreVertical,
  Upload, ChevronDown, FileText, Printer, FolderDown,
  Plus, Copy, Camera, ArrowUpCircle, AlertTriangle, X, Trash2,
} from "lucide-react";
import type { StudentRow } from "./StudentsScreen";
import { DesktopFormModal } from "@/components/desktop/ui/DesktopFormModal/DesktopFormModal";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import styles from "./StudentsScreen.module.css";

function downloadCSV(rows: StudentRow[], filename: string) {
  const headers = ["Admission No", "Name", "Class", "Guardian", "Fee Status", "Attendance"];
  const csvRows = [
    headers.join(","),
    ...rows.map(s => [
      s.admissionNo,
      `"${s.name}"`,
      `"${s.className}"`,
      `"${s.guardianName}"`,
      s.feeStatus,
      s.attendance,
    ].join(","))
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const PAGE_SIZE = 10;

interface PromotePreviewRow {
  studentId: string;
  name: string;
  currentClass: string;
  targetClass: string | null;
  action: "promote" | "graduate" | "blocked";
  gradeAvg: number | null;
  attendanceRate: number | null;
  outstandingFees: number;
  reasons: string[];
}

interface Props {
  students: StudentRow[];
  totalStudents: number;
  guardiansLinked: number;
  newAdmissions: number;
  canManageGuardians: boolean;
  genderSummary?: { boys: number; girls: number };
  classes?: { id: string; name: string }[];
}

export function StudentsContent({ students, totalStudents, guardiansLinked, newAdmissions, canManageGuardians }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ top: number; right: number } | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [bulkDeleting, setBulkDeleting] = useState(false);
  // Promotion
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promotePreview, setPromotePreview] = useState<PromotePreviewRow[] | null>(null);
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [promoteApplying, setPromoteApplying] = useState(false);
  const [promoteError, setPromoteError] = useState("");
  // Guardian modal
  const [gStudentId, setGStudentId] = useState("");
  const [gOpen, setGOpen] = useState(false);
  const [gStep, setGStep] = useState<"form" | "created">("form");
  const [gName, setGName] = useState("");
  const [gRelation, setGRelation] = useState("Father");
  const [gPhone, setGPhone] = useState("");
  const [gEmail, setGEmail] = useState("");
  const [gCreateLogin, setGCreateLogin] = useState(false);
  const [gSaving, setGSaving] = useState(false);
  const [gError, setGError] = useState("");
  const [gCreds, setGCreds] = useState<{ email: string; password: string } | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  // Add Student modal
  const [addOpen, setAddOpen] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [classOptions, setClassOptions] = useState<{ id: string; name: string }[]>([]);
  const [aFullName, setAFullName] = useState("");
  const [aGender, setAGender] = useState("");
  const [aDob, setADob] = useState("");
  const [aAddress, setAAddress] = useState("");
  const [aClassId, setAClassId] = useState("");
  const [aRelation, setARelation] = useState("");
  const [aGuardianName, setAGuardianName] = useState("");
  const [aPhone, setAPhone] = useState("");
  const [aEmail, setAEmail] = useState("");
  const [aPhotoFile, setAPhotoFile] = useState<File | null>(null);
  const [aPhotoPreview, setAPhotoPreview] = useState<string | null>(null);
  const aFileRef = useRef<HTMLInputElement>(null);

  function openAddStudentModal() {
    setAFullName(""); setAGender(""); setADob(""); setAAddress("");
    setAClassId(""); setARelation("");
    setAGuardianName(""); setAPhone(""); setAEmail("");
    setAPhotoFile(null); setAPhotoPreview(null); setAddError(null);
    setAddOpen(true);
    if (classOptions.length === 0) {
      fetch("/api/classes").then(r => r.json()).then(data => {
        setClassOptions(Array.isArray(data) ? data : (data.classes ?? []));
      }).catch(() => {});
    }
  }

  function handleAddPhoto(file?: File) {
    if (!file) { setAPhotoFile(null); setAPhotoPreview(null); return; }
    setAPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setAPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function submitAddStudent() {
    if (!aFullName.trim()) { setAddError("Full name is required."); return; }
    setAddSaving(true); setAddError(null);
    try {
      const [firstName, ...rest] = aFullName.trim().split(" ");
      const lastName = rest.join(" ") || firstName;

      let body: BodyInit;
      let headers: Record<string, string> | undefined;

      if (aPhotoFile) {
        const formData = new FormData();
        formData.append("firstName", firstName);
        formData.append("lastName", lastName);
        formData.append("gender", aGender);
        formData.append("dateOfBirth", aDob);
        formData.append("address", aAddress);
        formData.append("classId", aClassId);
        if (aGuardianName) {
          formData.append("guardianName", aGuardianName);
          formData.append("guardianPhone", `+233${aPhone}`);
          formData.append("guardianEmail", aEmail);
          formData.append("relation", aRelation.toLowerCase());
        }
        formData.append("photo", aPhotoFile);
        body = formData;
      } else {
        headers = { "Content-Type": "application/json" };
        body = JSON.stringify({
          firstName,
          lastName,
          gender: aGender,
          dateOfBirth: aDob,
          address: aAddress,
          classId: aClassId || undefined,
          guardian: aGuardianName
            ? { name: aGuardianName, phone: `+233${aPhone}`, email: aEmail, relation: aRelation.toLowerCase() }
            : undefined,
        });
      }

      const response = await fetch("/api/students", { method: "POST", headers, body });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setAddError(payload?.message ?? payload?.error ?? "Failed to save. Please check all fields.");
        setAddSaving(false);
        return;
      }
      setAddOpen(false);
      setAddSaving(false);
      router.refresh();
    } catch {
      setAddError("Network error. Please try again.");
      setAddSaving(false);
    }
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n").slice(1).filter(Boolean);
      showToast(`${lines.length} student record${lines.length !== 1 ? "s" : ""} imported from ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const classNames = useMemo(() => {
    const names = new Set(students.map((s) => s.className));
    return Array.from(names).sort();
  }, [students]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter((s) => {
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        s.guardianName.toLowerCase().includes(q);
      const matchClass = !classFilter || s.className === classFilter;
      const matchStatus =
        !statusFilter ||
        (statusFilter === "active" && s.feeStatus !== "None") ||
        (statusFilter === "inactive" && s.feeStatus === "None");
      return matchSearch && matchClass && matchStatus;
    });
  }, [students, search, classFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(safePage * PAGE_SIZE, filtered.length);

  const pageNums = useMemo(() => {
    const nums: number[] = [];
    const start = Math.max(1, safePage - 2);
    const end = Math.min(totalPages, start + 4);
    for (let index = start; index <= end; index += 1) nums.push(index);
    return nums;
  }, [safePage, totalPages]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      const target = e.target as Element;
      if (exportRef.current && !exportRef.current.contains(target)) {
        setShowExport(false);
      }
      if (!target.closest("[data-action-menu]") && !target.closest("[data-menu-btn]")) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const clearFilters = () => {
    setSearch("");
    setClassFilter("");
    setStatusFilter("");
    setPage(1);
  };

  function openGuardianModal(studentId: string) {
    setGStudentId(studentId);
    setGName(""); setGRelation("Father"); setGPhone(""); setGEmail("");
    setGCreateLogin(false); setGError(""); setGCreds(null); setGStep("form");
    setGOpen(true);
  }

  async function submitGuardian() {
    if (!gName.trim() || !gPhone.trim()) { setGError("Name and phone are required."); return; }
    if (gCreateLogin && !gEmail.trim()) { setGError("Email is required to create a login."); return; }
    setGSaving(true); setGError("");
    try {
      const res = await fetch(`/api/students/${gStudentId}/guardians`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: gName.trim(), relation: gRelation, phone: gPhone.trim(), email: gEmail.trim() || undefined, createLogin: gCreateLogin }),
      });
      const data = await res.json();
      if (!res.ok) { setGError(data.error ?? "Failed to save."); return; }
      if (data.tempPassword) {
        setGCreds({ email: gEmail.trim(), password: data.tempPassword });
        setGStep("created");
      } else {
        setGOpen(false);
        router.refresh();
      }
    } catch { setGError("Network error. Please try again."); }
    finally { setGSaving(false); }
  }

  const allOnPageSelected = paged.length > 0 && paged.every((s) => selectedIds.has(s.id));

  const toggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (allOnPageSelected) {
      paged.forEach((s) => next.delete(s.id));
    } else {
      paged.forEach((s) => next.add(s.id));
    }
    setSelectedIds(next);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  async function openPromoteModal() {
    if (selectedIds.size === 0) return;
    setPromoteOpen(true);
    setPromoteLoading(true);
    setPromoteError("");
    setPromotePreview(null);
    try {
      const res = await fetch("/api/students/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: Array.from(selectedIds) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setPromoteError(data?.message ?? "Failed to load promotion preview."); return; }
      setPromotePreview(data.preview);
    } catch {
      setPromoteError("Network error. Please try again.");
    } finally {
      setPromoteLoading(false);
    }
  }

  async function confirmPromote() {
    setPromoteApplying(true);
    setPromoteError("");
    try {
      const res = await fetch("/api/students/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: Array.from(selectedIds), apply: true }),
      });
      if (!res.ok) { setPromoteError("Failed to apply promotion."); return; }
      setPromoteOpen(false);
      setSelectedIds(new Set());
      router.refresh();
    } catch {
      setPromoteError("Network error. Please try again.");
    } finally {
      setPromoteApplying(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    const ok = await confirm({
      message: `Delete ${selectedIds.size} selected student${selectedIds.size !== 1 ? "s" : ""}? This permanently removes their records, including attendance, fees, and grades. This cannot be undone.`,
      tone: "danger",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    setBulkDeleting(true);
    try {
      const res = await fetch("/api/students/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        showToast("Failed to delete students.", "error");
        return;
      }
      showToast(`${data.deleted} student${data.deleted !== 1 ? "s" : ""} deleted${data.failed ? `, ${data.failed} failed` : ""}.`, data.failed ? "error" : "success");
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
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/students" className={styles.breadcrumbCurrent}>Students</Link>
        <span className={styles.breadcrumbSep}>›</span>
        <span className={styles.breadcrumbCurrent}>Student Directory</span>
      </nav>

      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Student Directory</h1>
          <p className={styles.pageSubtitle}>Manage enrolment, guardians, attendance, and student records.</p>
        </div>
        <div className={styles.headerActions}>
          {/* Import */}
          <input ref={importRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleImport} />
          <button className={styles.exportBtn} onClick={() => importRef.current?.click()}>
            <FolderDown size={16} /> Import
          </button>
          {/* Export dropdown */}
          <div ref={exportRef} className={styles.exportWrapper}>
            <button
              className={styles.exportBtn}
              onClick={(e) => { e.stopPropagation(); setShowExport((v) => !v); }}
            >
              <Upload size={16} />
              Export
              <ChevronDown size={14} />
            </button>
            {showExport && (
              <div className={styles.exportDropdown}>
                <button className={styles.dropdownItem} onClick={() => { downloadCSV(filtered, "students.csv"); setShowExport(false); }}>
                  <FileText size={16} /> CSV Document
                </button>
                <button className={styles.dropdownItem} onClick={() => { downloadCSV(filtered, "students_selected.csv"); setShowExport(false); }}>
                  <FileText size={16} /> Selected Only ({selectedIds.size || filtered.length})
                </button>
                <div className={styles.dropdownDivider} />
                <button className={styles.dropdownItem} onClick={() => { setShowExport(false); window.print(); }}>
                  <Printer size={16} /> Print View
                </button>
              </div>
            )}
          </div>
          <button className={styles.addBtn} onClick={openAddStudentModal} type="button">
            <Users size={16} />
            Add Student
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className={styles.statsGrid}>
        <StatCard label="Total Students" value={totalStudents.toLocaleString()} Icon={GraduationCap} variant="statIconPurple" />
        <StatCard label="New Admissions" value={newAdmissions.toLocaleString()} subtext="last 30 days" Icon={UserPlus} variant="statIconInfo" />
        <StatCard label="Guardians Linked" value={Math.round((guardiansLinked / 100) * totalStudents).toLocaleString()} Icon={Users} variant="statIconPurple" />
        <StatCard label="With Guardian" value={`${guardiansLinked}%`} Icon={CheckCircle2} variant="statIconGreen" />
      </div>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search by name, ID, or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className={styles.filterControls}>
          <select
            className={styles.filterSelect}
            value={classFilter}
            onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Classes</option>
            {classNames.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">Any Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className={styles.filterIconBtn} title="Filter Options">
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className={styles.filterBar} style={{ background: "#f0f7f4", border: "1px solid #c9ecc5" }}>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "#1b5e1b" }}>{selectedIds.size} student{selectedIds.size !== 1 ? "s" : ""} selected</span>
          <div className={styles.filterControls}>
            <button className={styles.addBtn} onClick={openPromoteModal} type="button">
              <ArrowUpCircle size={16} /> Promote to Next Class
            </button>
            <button className={styles.addBtn} style={{ background: "var(--clr-error)", borderColor: "var(--clr-error)" }} onClick={handleBulkDelete} disabled={bulkDeleting} type="button">
              <Trash2 size={16} /> {bulkDeleting ? "Deleting…" : "Delete"}
            </button>
            <button className={styles.filterIconBtn} onClick={() => setSelectedIds(new Set())} title="Clear selection">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableContainer}>
        {filtered.length === 0 ? (
          <EmptyState onClear={clearFilters} />
        ) : (
          <>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.thead}>
                    <th className={styles.thCheck}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={allOnPageSelected}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className={styles.thAvatar} />
                    <th className={styles.th}>Student Name</th>
                    <th className={styles.th}>Admission No.</th>
                    <th className={styles.th}>Class</th>
                    <th className={styles.th}>Guardian</th>
                    <th className={styles.th}>Fee Status</th>
                    <th className={styles.th}>Attendance</th>
                    <th className={styles.thAction} />
                  </tr>
                </thead>
                <tbody>
                  {paged.map((student) => (
                    <tr
                      key={student.id}
                      className={`${styles.tr} ${selectedIds.has(student.id) ? styles.trSelected : ""}`}
                    >
                      <td className={styles.tdCheck}>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={selectedIds.has(student.id)}
                          onChange={() => toggleSelect(student.id)}
                        />
                      </td>
                      <td className={styles.tdAvatar}>
                        {student.photoUrl ? (
                          <img src={student.photoUrl} alt="" className={styles.avatarImage} />
                        ) : (
                          <span className={`${styles.avatar} ${styles[`avatar${student.id.charCodeAt(0) % 6}`]}`}>{student.initials}</span>
                        )}
                      </td>
                      <td className={`${styles.td} ${styles.tdName}`}>
                        <Link href={`/students/${student.id}`} className={styles.nameLink}>{student.name}</Link>
                      </td>
                      <td className={`${styles.td} ${styles.tdMono}`}>{student.admissionNo}</td>
                      <td className={styles.td}>{student.className}</td>
                      <td className={styles.td}>{student.guardianName}</td>
                      <td className={styles.td}>
                        <FeeStatusBadge status={student.feeStatus} />
                      </td>
                      <td className={styles.td}>{student.attendance}</td>
                      <td className={styles.tdAction}>
                        <div className={styles.actionCell}>
                          <button
                            data-menu-btn
                            className={styles.menuBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openMenu === student.id) {
                                setOpenMenu(null); setMenuAnchor(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setMenuAnchor({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                                setOpenMenu(student.id);
                              }
                            }}
                          >
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                Showing <strong>{from}</strong> to <strong>{to}</strong> of{" "}
                <strong>{filtered.length.toLocaleString()}</strong> students
              </span>
              <div className={styles.paginationBtns}>
                <button
                  className={styles.paginationBtn}
                  disabled={safePage === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                {pageNums.map((num) => (
                  <button
                    key={num}
                    className={`${styles.paginationBtn} ${num === safePage ? styles.paginationBtnActive : ""}`}
                    onClick={() => setPage(num)}
                  >
                    {num}
                  </button>
                ))}
                <button
                  className={styles.paginationBtn}
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Fixed-position row action menu — pops out of any overflow container */}
      {openMenu && menuAnchor && (() => {
        const s = paged.find(r => r.id === openMenu);
        if (!s) return null;
        return (
          <div
            data-action-menu
            className={styles.actionMenuFixed}
            style={{ top: menuAnchor.top, right: menuAnchor.right }}
          >
            <Link href={`/students/${s.id}`} className={styles.menuItem}>View Profile</Link>
            <Link href={`/students/${s.id}?edit=1`} className={styles.menuItem}>Edit</Link>
            <Link href={`/fees?studentId=${s.id}&recordPayment=1`} className={styles.menuItem}>Record Payment</Link>
            {canManageGuardians && (
              <>
                <div className={styles.menuDivider} />
                <button
                  className={styles.menuItem}
                  onClick={() => { openGuardianModal(s.id); setOpenMenu(null); setMenuAnchor(null); }}
                >
                  <Plus size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />
                  Add Guardian
                </button>
              </>
            )}
            <div className={styles.menuDivider} />
            <button className={`${styles.menuItem} ${styles.menuItemDanger}`}>Archive</button>
          </div>
        );
      })()}

      <DesktopFormModal
        open={gOpen}
        title={gStep === "form" ? "Add Guardian" : "Guardian Created"}
        subtitle={gStep === "form"
          ? "Create a guardian contact for this student and optionally issue a parent portal login with clearer onboarding details."
          : "Share these credentials with the guardian now. The temporary password is shown only once after creation."}
        eyebrow="Student Directory"
        width={700}
        canClose={!gSaving}
        onClose={() => { if (!gSaving) { setGOpen(false); if (gStep === "created") router.refresh(); } }}
        footer={gStep === "form" ? (
          <>
            <button className={styles.gCancelBtn} onClick={() => setGOpen(false)} disabled={gSaving} type="button">Cancel</button>
            <button className={styles.gSaveBtn} onClick={submitGuardian} disabled={gSaving} type="button">
              {gSaving ? "Saving…" : "Save Guardian"}
            </button>
          </>
        ) : (
          <button className={styles.gSaveBtn} onClick={() => { setGOpen(false); router.refresh(); }} type="button">Done</button>
        )}
      >
        {gStep === "form" && (
          <div className={styles.gModalBody}>
            <div className={styles.gModalRow}>
              <div className={styles.gModalField}>
                <label className={styles.gModalLabel}>Full Name *</label>
                <input className={styles.gModalInput} value={gName} onChange={e => setGName(e.target.value)} placeholder="e.g. Kofi Mensah" />
              </div>
              <div className={styles.gModalField}>
                <label className={styles.gModalLabel}>Relation *</label>
                <select className={styles.gModalSelect} value={gRelation} onChange={e => setGRelation(e.target.value)}>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Uncle">Uncle</option>
                  <option value="Aunt">Aunt</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className={styles.gModalField}>
              <label className={styles.gModalLabel}>Phone Number *</label>
              <input className={styles.gModalInput} value={gPhone} onChange={e => setGPhone(e.target.value)} placeholder="e.g. 0244000000" />
            </div>
            <div className={styles.gModalField}>
              <label className={styles.gModalLabel}>Email Address</label>
              <input className={styles.gModalInput} type="email" value={gEmail} onChange={e => setGEmail(e.target.value)} placeholder="optional" />
            </div>
            <label className={styles.gModalCheckRow}>
              <input type="checkbox" checked={gCreateLogin} onChange={e => setGCreateLogin(e.target.checked)} />
              <div>
                <span className={styles.gModalCheckLabel}>Create parent portal login</span>
                <span className={styles.gModalCheckSub}>Email required. Temporary password shown once after saving.</span>
              </div>
            </label>
            {gError && <p className={styles.gModalError}>{gError}</p>}
          </div>
        )}

        {gStep === "created" && gCreds && (
          <div className={styles.gModalBody}>
            <p className={styles.gModalSuccess}>Guardian profile created with portal login.</p>
            <p className={styles.gModalCheckSub} style={{ marginBottom: 8 }}>Share these credentials once — they cannot be retrieved again.</p>
            <div className={styles.gCredBox}>
              <div className={styles.gCredRow}>
                <span className={styles.gCredLabel}>Email</span>
                <span className={styles.gCredValue}>{gCreds.email}</span>
                <button className={styles.gCopyBtn} onClick={() => navigator.clipboard.writeText(gCreds!.email)} title="Copy" type="button"><Copy size={13} /></button>
              </div>
              <div className={styles.gCredRow}>
                <span className={styles.gCredLabel}>Password</span>
                <span className={styles.gCredValue}>{gCreds.password}</span>
                <button className={styles.gCopyBtn} onClick={() => navigator.clipboard.writeText(gCreds!.password)} title="Copy" type="button"><Copy size={13} /></button>
              </div>
            </div>
          </div>
        )}
      </DesktopFormModal>

      <DesktopFormModal
        open={addOpen}
        title="Add New Student"
        subtitle="Enter student details to enrol them in the system."
        eyebrow="Student Directory"
        width={720}
        canClose={!addSaving}
        onClose={() => { if (!addSaving) setAddOpen(false); }}
        footer={
          <>
            <button className={styles.gCancelBtn} onClick={() => setAddOpen(false)} disabled={addSaving} type="button">Cancel</button>
            <button className={styles.gSaveBtn} onClick={submitAddStudent} disabled={addSaving} type="button">
              {addSaving ? "Saving…" : "Save Student"}
            </button>
          </>
        }
      >
        <div className={styles.addModalBody}>
          <div className={styles.addModalSidebar}>
            <div className={styles.addPhotoDrop} onClick={() => aFileRef.current?.click()}>
              {aPhotoPreview ? (
                <img src={aPhotoPreview} alt="" />
              ) : (
                <>
                  <Camera size={22} />
                  <span className={styles.addPhotoDropText}>Upload</span>
                </>
              )}
            </div>
            <input ref={aFileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={e => handleAddPhoto(e.target.files?.[0])} />
            <p className={styles.gModalLabel} style={{ width: "100%", margin: 0 }}>Admission number is generated automatically on save.</p>
          </div>

          <div className={styles.addSections}>
            <section>
              <p className={styles.gSectionLabel}>Personal Information</p>
              <div className={styles.gModalRow}>
                <div className={styles.gModalField} style={{ gridColumn: "1 / -1" }}>
                  <label className={styles.gModalLabel}>Full Name *</label>
                  <input className={styles.gModalInput} value={aFullName} onChange={e => setAFullName(e.target.value)} placeholder="e.g. Michael Osei" />
                </div>
                <div className={styles.gModalField}>
                  <label className={styles.gModalLabel}>Gender</label>
                  <select className={styles.gModalSelect} value={aGender} onChange={e => setAGender(e.target.value)}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className={styles.gModalField}>
                  <label className={styles.gModalLabel}>Date of Birth</label>
                  <input className={styles.gModalInput} type="date" value={aDob} onChange={e => setADob(e.target.value)} />
                </div>
                <div className={styles.gModalField} style={{ gridColumn: "1 / -1" }}>
                  <label className={styles.gModalLabel}>Residential Address</label>
                  <textarea className={styles.gModalTextarea} rows={2} value={aAddress} onChange={e => setAAddress(e.target.value)} placeholder="Street name, City, Region..." />
                </div>
              </div>
            </section>

            <section>
              <p className={styles.gSectionLabel}>Academic Details</p>
              <div className={styles.gModalRow}>
                <div className={styles.gModalField}>
                  <label className={styles.gModalLabel}>Class / Grade</label>
                  <select className={styles.gModalSelect} value={aClassId} onChange={e => setAClassId(e.target.value)}>
                    <option value="">Select Grade</option>
                    {classOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </section>

            <section>
              <p className={styles.gSectionLabel}>Guardian Information</p>
              <div className={styles.gModalRow}>
                <div className={styles.gModalField} style={{ gridColumn: "1 / -1" }}>
                  <label className={styles.gModalLabel}>Guardian Name</label>
                  <input className={styles.gModalInput} value={aGuardianName} onChange={e => setAGuardianName(e.target.value)} placeholder="Full name of parent or guardian" />
                </div>
                <div className={styles.gModalField}>
                  <label className={styles.gModalLabel}>Guardian Phone Number</label>
                  <div className={styles.phoneRow}>
                    <span className={styles.phonePrefix}>+233</span>
                    <input className={`${styles.gModalInput} ${styles.phoneInput}`} value={aPhone} onChange={e => setAPhone(e.target.value)} placeholder="24 123 4567" />
                  </div>
                </div>
                <div className={styles.gModalField}>
                  <label className={styles.gModalLabel}>Guardian Email Address</label>
                  <input className={styles.gModalInput} type="email" value={aEmail} onChange={e => setAEmail(e.target.value)} placeholder="guardian@example.com" />
                </div>
                <div className={styles.gModalField} style={{ gridColumn: "1 / -1" }}>
                  <label className={styles.gModalLabel}>Relationship to Student</label>
                  <select className={styles.gModalSelect} value={aRelation} onChange={e => setARelation(e.target.value)}>
                    <option value="">Select Relationship</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Uncle">Uncle</option>
                    <option value="Aunt">Aunt</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </section>

            {addError && <p className={styles.gModalError}>{addError}</p>}
          </div>
        </div>
      </DesktopFormModal>

      {/* Promote to Next Class modal */}
      {promoteOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => !promoteApplying && setPromoteOpen(false)}>
          <div style={{ background: "#fff", borderRadius: 8, width: 560, maxWidth: "92vw", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.22)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #e4e4ec" }}>
              <h2 style={{ fontSize: "var(--text-md)", fontWeight: 700, margin: 0 }}>Promote to Next Class</h2>
              <button onClick={() => setPromoteOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#71787b" }}><X size={18} /></button>
            </div>
            <div style={{ padding: "16px 24px", overflowY: "auto", flex: 1 }}>
              {promoteLoading && <p style={{ fontSize: "var(--text-xs)", color: "#71787b" }}>Checking eligibility…</p>}
              {promoteError && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#fff7f5", border: "1px solid #f2c5bf", borderRadius: 4, color: "#b24738", fontSize: "var(--text-xs)", marginBottom: 12 }}>
                  <AlertTriangle size={15} /> {promoteError}
                </div>
              )}
              {promotePreview && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {promotePreview.map((row) => (
                    <div key={row.studentId} style={{ border: "1px solid #e4e4ec", borderRadius: 4, padding: "10px 12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "var(--text-xs)" }}>{row.name}</strong>
                        {row.action === "blocked" ? (
                          <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "#b24738" }}>Cannot promote</span>
                        ) : row.action === "graduate" ? (
                          <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "#653e00" }}>{row.currentClass} → Graduating</span>
                        ) : (
                          <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "#1b5e1b" }}>{row.currentClass} → {row.targetClass}</span>
                        )}
                      </div>
                      {row.reasons.length > 0 && (
                        <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: "var(--text-xs)", color: "#71787b" }}>
                          {row.reasons.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "16px 24px", borderTop: "1px solid #e4e4ec" }}>
              <button className={styles.filterIconBtn} style={{ width: "auto", padding: "0 16px" }} onClick={() => setPromoteOpen(false)} disabled={promoteApplying}>Cancel</button>
              <button className={styles.addBtn} onClick={confirmPromote} disabled={promoteApplying || promoteLoading || !promotePreview || promotePreview.every((r) => r.action === "blocked")}>
                {promoteApplying ? "Applying…" : "Confirm Promotion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  Icon,
  variant,
}: {
  label: string;
  value: string;
  subtext?: string;
  Icon: React.ElementType;
  variant: "statIconInfo" | "statIconPurple" | "statIconGreen";
}) {
  return (
    <div className={styles.statCard}>
      <Icon size={22} className={`${styles.statIcon} ${styles[variant]}`} />
      <div className={styles.statCopy}>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statValue}>{value}</span>
        {subtext && <span className={styles.statSubtext}>{subtext}</span>}
      </div>
    </div>
  );
}

function FeeStatusBadge({ status }: { status: "Paid" | "Pending" | "None" }) {
  if (status === "None") return <span className={`${styles.badge} ${styles.badgeNone}`}>—</span>;
  if (status === "Paid") return <span className={`${styles.badge} ${styles.badgePaid}`}>Paid</span>;
  return <span className={`${styles.badge} ${styles.badgePending}`}>Pending</span>;
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <Search size={32} />
      </div>
      <h3 className={styles.emptyTitle}>No students found</h3>
      <p className={styles.emptyText}>Try adjusting your search or filters.</p>
      <button className={styles.clearBtn} onClick={onClear}>
        Clear Filters
      </button>
    </div>
  );
}
