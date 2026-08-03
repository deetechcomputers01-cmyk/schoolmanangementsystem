"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Search, ChevronDown, Download,
  Pencil, Power, Trash2, X,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import styles from "./UserRoleScreen.module.css";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastActivity: string | null;
  linkedEntity: string | null;
};

interface Props {
  users: UserRow[];
  currentUserId: string;
}

const ROLE_OPTIONS = ["super_admin", "principal", "teacher", "staff", "student", "guardian"] as const;

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  principal: "Principal",
  teacher: "Teacher",
  staff: "Staff",
  student: "Student",
  guardian: "Guardian",
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function relTime(iso: string | null) {
  if (!iso) return "Never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function roleBadgeClass(role: string) {
  if (role === "super_admin" || role === "principal") return styles.roleBadgeAdmin;
  if (role === "teacher") return styles.roleBadgeTeacher;
  return styles.roleBadgeOther;
}

function exportCsv(rows: UserRow[]) {
  const headers = ["Name", "Email", "Role", "Linked Entity", "Status", "Last Activity"];
  const csvRows = [
    headers.join(","),
    ...rows.map((u) => [u.name, u.email, ROLE_LABEL[u.role] ?? u.role, u.linkedEntity ?? "", u.isActive ? "Active" : "Disabled", relTime(u.lastActivity)]
      .map((v) => `"${v.replace(/"/g, '""')}"`).join(",")),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "users.csv"; a.click();
  URL.revokeObjectURL(url);
}

export function UserRoleContent({ users, currentUserId }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [roleModalUser, setRoleModalUser] = useState<UserRow | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  function notify(msg: string, ok = true) { showToast(msg, ok ? "success" : "error"); }

  const totalUsers = users.length;
  const activeCount = users.filter((u) => u.isActive).length;
  const activePct = totalUsers > 0 ? Math.round((activeCount / totalUsers) * 1000) / 10 : 0;
  const inactiveCount = totalUsers - activeCount;
  const roleCounts = ROLE_OPTIONS.map((r) => ({ role: r, count: users.filter((u) => u.role === r).length })).filter((r) => r.count > 0);

  const filtered = useMemo(() => users.filter((u) =>
    (roleFilter === "" || u.role === roleFilter) &&
    (statusFilter === "" || (statusFilter === "active" ? u.isActive : !u.isActive)) &&
    (search === "" || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || (ROLE_LABEL[u.role] ?? u.role).toLowerCase().includes(search.toLowerCase()))
  ), [users, roleFilter, statusFilter, search]);

  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageUsers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectablePageUsers = pageUsers.filter((u) => u.id !== currentUserId);

  const allOnPageSelected = selectablePageUsers.length > 0 && selectablePageUsers.every((u) => selectedIds.has(u.id));
  function toggleSelectAll() {
    const next = new Set(selectedIds);
    if (allOnPageSelected) selectablePageUsers.forEach((u) => next.delete(u.id));
    else selectablePageUsers.forEach((u) => next.add(u.id));
    setSelectedIds(next);
  }
  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  }

  function openRoleModal(u: UserRow) {
    setRoleModalUser(u);
    setNewRole(u.role);
    setError("");
  }

  async function submitRoleChange() {
    if (!roleModalUser || newRole === roleModalUser.role) { setRoleModalUser(null); return; }
    setBusyId(roleModalUser.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${roleModalUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        notify(`${roleModalUser.name}'s role updated to ${ROLE_LABEL[newRole]}`);
        setRoleModalUser(null);
        router.refresh();
      } else {
        const err = await res.json().catch(() => null);
        setError(err?.error ?? "Failed to update role.");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(u: UserRow) {
    setBusyId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      if (res.ok) {
        notify(`${u.name} ${u.isActive ? "deactivated" : "activated"}`);
        router.refresh();
      } else {
        notify("Failed to update status", false);
      }
    } finally {
      setBusyId(null);
    }
  }

  async function removeUser(u: UserRow) {
    if (!(await confirm({ message: `Delete ${u.name}'s account? This cannot be undone.`, tone: "danger", confirmLabel: "Delete" }))) return;
    setBusyId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
      if (res.ok) {
        notify(`${u.name} deleted`);
        router.refresh();
      } else {
        notify("Failed to delete user", false);
      }
    } finally {
      setBusyId(null);
    }
  }

  async function bulkDeactivate() {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    try {
      const results = await Promise.allSettled(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/admin/users/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: false }),
          })
        )
      );
      const succeeded = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;
      const failed = results.length - succeeded;
      notify(`${succeeded} user${succeeded !== 1 ? "s" : ""} deactivated${failed ? `, ${failed} failed` : ""}.`, failed === 0);
      setSelectedIds(new Set());
      router.refresh();
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkDelete() {
    if (selectedIds.size === 0) return;
    const confirmed = await confirm({
      message: `Delete ${selectedIds.size} selected user account${selectedIds.size !== 1 ? "s" : ""}? This cannot be undone.`,
      tone: "danger",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;
    setBulkBusy(true);
    try {
      const results = await Promise.allSettled(
        Array.from(selectedIds).map((id) => fetch(`/api/admin/users/${id}`, { method: "DELETE" }))
      );
      const succeeded = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;
      const failed = results.length - succeeded;
      notify(`${succeeded} user${succeeded !== 1 ? "s" : ""} deleted${failed ? `, ${failed} failed` : ""}.`, failed === 0);
      setSelectedIds(new Set());
      router.refresh();
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Roles &amp; Users Management</h1>
          <p className={styles.subtitle}>Manage institutional roles, permissions, and user access across the academy.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnOutline} onClick={() => exportCsv(filtered)} disabled={filtered.length === 0}>
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Users</p>
          <div className={styles.statValueRow}><span className={styles.statValue}>{totalUsers}</span></div>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Active Users</p>
          <div className={styles.statValueRow}>
            <span className={styles.statValue}>{activeCount}</span>
            <span className={styles.statSub}>{activePct}%</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Roles Overview</p>
          <div className={styles.roleBadgeRow}>
            {roleCounts.map(({ role, count }) => (
              <span key={role} className={`${styles.roleTag} ${role === "super_admin" || role === "principal" ? styles.roleTagAdmin : role === "teacher" ? styles.roleTagTeacher : role === "staff" ? styles.roleTagStaff : styles.roleTagStudent}`}>
                {ROLE_LABEL[role].slice(0, 3).toUpperCase()}: {count}
              </span>
            ))}
          </div>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Inactive Accounts</p>
          <div className={styles.statValueRow}>
            <span className={styles.statValue}>{inactiveCount}</span>
            {inactiveCount > 0 && <span className={styles.statDelta}>Review</span>}
          </div>
        </div>
      </div>

      <div className={styles.mainCard}>
        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input className={styles.searchInput} placeholder="Search by name, email or role…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className={styles.filterRight}>
            <div className={styles.selectWrap}>
              <select className={styles.select} value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
                <option value="">All Roles</option>
                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
              <ChevronDown size={14} className={styles.selectChevron} />
            </div>
            <div className={styles.selectWrap}>
              <select className={styles.select} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
              <ChevronDown size={14} className={styles.selectChevron} />
            </div>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className={styles.filterBar} style={{ background: "var(--clr-success-bg)", borderBottom: "1px solid var(--clr-success-border)" }}>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--clr-success)" }}>{selectedIds.size} selected</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className={styles.btnOutline} onClick={bulkDeactivate} disabled={bulkBusy}>
                <Power size={14} /> Deactivate
              </button>
              <button className={styles.btnOutline} style={{ background: "var(--clr-error)", borderColor: "var(--clr-error)", color: "#fff" }} onClick={bulkDelete} disabled={bulkBusy}>
                <Trash2 size={14} /> {bulkBusy ? "Working…" : "Delete"}
              </button>
              <button className={styles.btnOutline} onClick={() => setSelectedIds(new Set())}>Clear</button>
            </div>
          </div>
        )}

        {pageUsers.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={32} className={styles.emptyIcon} />
            <p>{users.length === 0 ? "No users yet." : "No users match your filters."}</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAll} />
                  </th>
                  <th>User Profile</th>
                  <th>Assigned Role</th>
                  <th>Linked Entity</th>
                  <th>Status</th>
                  <th>Last Activity</th>
                  <th className={styles.right}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageUsers.map((u) => {
                  const isSelf = u.id === currentUserId;
                  return (
                    <tr key={u.id} className={`${styles.dataRow} ${!u.isActive ? styles.dataRowInactive : ""}`}>
                      <td>
                        <input type="checkbox" checked={selectedIds.has(u.id)} disabled={isSelf} onChange={() => toggleSelect(u.id)} />
                      </td>
                      <td>
                        <div className={styles.userCell}>
                          <div className={`${styles.avatar} ${u.role === "super_admin" ? styles.avatarAdmin : ""}`}>{initials(u.name)}</div>
                          <div>
                            <div className={styles.userName}>{u.name}</div>
                            <div className={styles.userEmail}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={`${styles.roleBadge} ${roleBadgeClass(u.role)}`}>{ROLE_LABEL[u.role] ?? u.role}</span></td>
                      <td className={styles.tdMuted}>{u.linkedEntity ?? "—"}</td>
                      <td>
                        <span className={`${styles.statusPill} ${u.isActive ? styles.statusActive : styles.statusInactive}`}>
                          <span className={styles.statusDot} />{u.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className={styles.tdMuted}>{relTime(u.lastActivity)}</td>
                      <td className={styles.right}>
                        <div className={styles.rowActions}>
                          <button className={styles.iconBtn} title="Change role" disabled={isSelf || busyId === u.id} onClick={() => openRoleModal(u)}><Pencil size={14} /></button>
                          <button className={styles.iconBtn} title={u.isActive ? "Deactivate" : "Activate"} disabled={isSelf || busyId === u.id} onClick={() => toggleActive(u)}><Power size={14} /></button>
                          <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} title="Delete user" disabled={isSelf || busyId === u.id} onClick={() => removeUser(u)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className={styles.paginationBar}>
            <span>Showing {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} entries</span>
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

      {roleModalUser && (
        <div className={`${styles.modalOverlay} desktopOnly`} onClick={() => !busyId && setRoleModalUser(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Change Role</h2>
                <p className={styles.modalSub}>{roleModalUser.name} · {roleModalUser.email}</p>
              </div>
              <button className={styles.modalClose} onClick={() => setRoleModalUser(null)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              {error && <p className={styles.errorText}>{error}</p>}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Role</label>
                <select className={styles.formSelect} value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                  {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setRoleModalUser(null)} disabled={!!busyId}>Cancel</button>
              <button className={styles.btnPrimary} onClick={submitRoleChange} disabled={!!busyId || newRole === roleModalUser.role}>
                {busyId ? "Saving…" : "Save Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mobileOnly">
        <MobileSheet
          open={!!roleModalUser}
          onClose={() => !busyId && setRoleModalUser(null)}
          title="Change Role"
          subtitle={roleModalUser ? `${roleModalUser.name} · ${roleModalUser.email}` : undefined}
          compact
          footer={<>
            <button type="button" className={kit.btnOutline} onClick={() => setRoleModalUser(null)} disabled={!!busyId}>Cancel</button>
            <button
              type="button"
              className={kit.btnPrimary}
              onClick={submitRoleChange}
              disabled={!!busyId || !roleModalUser || newRole === roleModalUser.role}
            >
              {busyId ? "Saving…" : "Update Role"}
            </button>
          </>}
        >
          {error && <p className={kit.errorText}>{error}</p>}
          <div className={kit.field}>
            <label>Role</label>
            <select className={kit.select} value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </div>
          <div className={`${kit.banner} ${kit.bannerWarn}`}>
            Changing this user&apos;s role immediately updates their access permissions.
          </div>
        </MobileSheet>
      </div>
    </div>
  );
}
