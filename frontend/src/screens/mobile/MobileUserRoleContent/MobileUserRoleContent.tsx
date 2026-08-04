"use client";

/**
 * MobileUserRoleContent — bespoke mobile view for the Roles & Users screen.
 *
 * Every field/action traces back to UserRoleContent.tsx (the real desktop
 * component) and the real /api/admin/users endpoints — same
 * submitRoleChange()/toggleActive()/removeUser() (all PATCH/DELETE
 * /api/admin/users/:id) handlers.
 *
 * The real app has no "Role" model with a stored permission count — roles
 * are a fixed 6-value enum, and "Roles Overview" on desktop is just a
 * role→user-count tag row, not per-role cards. The Stitch mockup's role
 * cards showing e.g. "42 Permissions" per role had no real backing data
 * anywhere in the frontend — `permissions: Record<Role, string[]>` exists
 * but only in `backend/auth/rbac.ts`, used solely for server-side
 * authorization checks, never exposed to any UI. Rather than fabricate a
 * number, `UserRoleScreen.tsx` now exports it once (`permissionCounts`,
 * `perms.length` or `"all"` for super_admin's `["*"]`) — real backend data,
 * just newly surfaced, not invented.
 *
 * The mockup's FAB "Add User" has no real backing either — there is no
 * create-user endpoint anywhere (accounts are created via Student/Staff/
 * Guardian registration flows, not a standalone "add user" admin action) —
 * omitted.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Search, Download, Pencil, Power, Trash2, ShieldCheck, GraduationCap,
  UsersRound, Wallet, User as UserIcon,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import { SwipeRow } from "@/components/mobile/ui/SwipeRow/SwipeRow";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import { ROLE_OPTIONS, ROLE_LABEL, initials, relTime } from "@/screens/desktop/UserRoleScreen/UserRoleContent";
import type { UserRoleContentProps, UserRow } from "@/screens/desktop/UserRoleScreen/UserRoleContent";
import styles from "./MobileUserRoleContent.module.css";

const ROLE_ICON: Record<string, typeof ShieldCheck> = {
  super_admin: ShieldCheck, principal: ShieldCheck, teacher: GraduationCap,
  staff: Wallet, student: UserIcon, guardian: UsersRound,
};

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

export function MobileUserRoleContent({ users, currentUserId, permissionCounts }: UserRoleContentProps & { permissionCounts: Record<string, number | "all"> }) {
  const router = useRouter();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [tab, setTab] = useState<"roles" | "users">("roles");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const totalUsers = users.length;
  const activeCount = users.filter((u) => u.isActive).length;
  const activePct = totalUsers > 0 ? Math.round((activeCount / totalUsers) * 1000) / 10 : 0;
  const inactiveCount = totalUsers - activeCount;
  const roleCounts = ROLE_OPTIONS.map((r) => ({ role: r, count: users.filter((u) => u.role === r).length }));

  const filtered = useMemo(() => users.filter((u) =>
    (roleFilter === "" || u.role === roleFilter) &&
    (search === "" || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || (ROLE_LABEL[u.role] ?? u.role).toLowerCase().includes(search.toLowerCase()))
  ), [users, roleFilter, search]);

  async function toggleActive(u: UserRow) {
    setBusyId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast(`${u.name} ${u.isActive ? "deactivated" : "activated"}`);
      router.refresh();
    } catch {
      showToast("Failed to update status", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function removeUser(u: UserRow) {
    const sure = await confirm({ message: `Delete ${u.name}'s account? This cannot be undone.`, confirmLabel: "Delete" });
    if (!sure) return;
    setBusyId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      showToast(`${u.name} deleted`);
      router.refresh();
    } catch {
      showToast("Failed to delete user", "error");
    } finally {
      setBusyId(null);
    }
  }

  // ── Change Role sheet ─────────────────────────────────────────────────
  const [roleModalUser, setRoleModalUser] = useState<UserRow | null>(null);
  const [newRole, setNewRole] = useState("");
  const [savingRole, setSavingRole] = useState(false);

  function openRoleModal(u: UserRow) {
    setRoleModalUser(u);
    setNewRole(u.role);
  }

  async function submitRoleChange() {
    if (!roleModalUser || newRole === roleModalUser.role) { setRoleModalUser(null); return; }
    setSavingRole(true);
    try {
      const res = await fetch(`/api/admin/users/${roleModalUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast(`${roleModalUser.name}'s role updated to ${ROLE_LABEL[newRole]}`);
      setRoleModalUser(null);
      router.refresh();
    } catch {
      showToast("Failed to update role", "error");
    } finally {
      setSavingRole(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Users</span>
          <strong className={styles.kpiValue}>{totalUsers}</strong>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Active Users</span>
          <strong className={styles.kpiValue}>{activeCount} <span className={styles.kpiSub}>({activePct}%)</span></strong>
        </div>
        <div className={`${styles.kpiCard} ${inactiveCount > 0 ? styles.kpiCardWarn : ""}`} style={{ gridColumn: "span 2" }}>
          <span className={styles.kpiLabel}>Inactive Accounts</span>
          <strong className={inactiveCount > 0 ? styles.kpiValueWarn : styles.kpiValue}>{inactiveCount}</strong>
        </div>
      </div>

      <button type="button" className={styles.exportBtn} onClick={() => exportCsv(filtered)} disabled={filtered.length === 0}>
        <Download size={14} /> Export CSV
      </button>

      <div className={kit.segmented}>
        <button type="button" className={`${kit.segBtn} ${tab === "roles" ? kit.segBtnActive : ""}`} onClick={() => setTab("roles")}>Roles</button>
        <button type="button" className={`${kit.segBtn} ${tab === "users" ? kit.segBtnActive : ""}`} onClick={() => setTab("users")}>Users</button>
      </div>

      {tab === "roles" ? (
        <div className={styles.list}>
          {roleCounts.map(({ role, count }) => {
            const Icon = ROLE_ICON[role] ?? UserIcon;
            const perm = permissionCounts[role];
            return (
              <button key={role} type="button" className={styles.roleCard} onClick={() => { setTab("users"); setRoleFilter(role); }}>
                <div className={`${styles.roleIcon} ${styles[`roleIcon_${role}`] ?? ""}`}><Icon size={20} /></div>
                <div className={styles.roleInfo}>
                  <span className={styles.roleName}>{ROLE_LABEL[role]}</span>
                  <span className={styles.roleMeta}>{perm === "all" ? "All Permissions" : `${perm} Permission${perm === 1 ? "" : "s"}`} • {count} User{count === 1 ? "" : "s"}</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <label className={kit.searchWrap}>
            <Search size={16} className={kit.searchIcon} />
            <input className={`${kit.input} ${kit.searchInput}`} placeholder="Search by name, email, or role" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>

          <div className={styles.chipRow}>
            <button type="button" className={`${styles.chip} ${roleFilter === "" ? styles.chipActive : ""}`} onClick={() => setRoleFilter("")}>All Roles</button>
            {ROLE_OPTIONS.map((r) => (
              <button key={r} type="button" className={`${styles.chip} ${roleFilter === r ? styles.chipActive : ""}`} onClick={() => setRoleFilter(roleFilter === r ? "" : r)}>{ROLE_LABEL[r]}</button>
            ))}
          </div>

          <div className={styles.list}>
            {filtered.length === 0 ? (
              <div className={styles.emptyState}>
                <Users size={28} style={{ opacity: 0.3 }} />
                <p>{users.length === 0 ? "No users yet." : "No users match your filters."}</p>
              </div>
            ) : filtered.map((u) => {
              const isSelf = u.id === currentUserId;
              return (
                <SwipeRow
                  key={u.id}
                  rightActions={isSelf ? [] : [
                    { key: "role", icon: Pencil, label: "Change Role", tone: "primary", onClick: () => openRoleModal(u) },
                  ]}
                  leftActions={isSelf ? [] : [
                    { key: "toggle", icon: Power, label: u.isActive ? "Deactivate" : "Activate", tone: "soft", onClick: () => toggleActive(u) },
                    { key: "delete", icon: Trash2, label: "Delete", tone: "danger", onClick: () => removeUser(u) },
                  ]}
                >
                  <div className={`${styles.userCard} ${!u.isActive ? styles.userCardInactive : ""}`}>
                    <span className={kit.pickAvatar}>{initials(u.name)}</span>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{u.name}{busyId === u.id ? " …" : ""}</span>
                      <span className={styles.userEmail}>{u.email}</span>
                      <span className={styles.userMeta}>{u.linkedEntity ?? "—"} • {relTime(u.lastActivity)}</span>
                    </div>
                    <div className={styles.userRight}>
                      <span className={styles.roleBadge}>{ROLE_LABEL[u.role] ?? u.role}</span>
                      <span className={`${styles.statusPill} ${u.isActive ? styles.statusActive : styles.statusInactive}`}>{u.isActive ? "Active" : "Disabled"}</span>
                    </div>
                  </div>
                </SwipeRow>
              );
            })}
          </div>
        </>
      )}

      <MobileSheet
        open={!!roleModalUser}
        onClose={() => !savingRole && setRoleModalUser(null)}
        title="Change Role"
        subtitle={roleModalUser ? `${roleModalUser.name} · ${roleModalUser.email}` : undefined}
        compact
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => setRoleModalUser(null)} disabled={savingRole}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={submitRoleChange} disabled={savingRole || !roleModalUser || newRole === roleModalUser.role}>
            {savingRole ? "Saving…" : "Update Role"}
          </button>
        </>}
      >
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
  );
}
