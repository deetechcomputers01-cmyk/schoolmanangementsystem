"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Loader2, Trash2, UserCog } from "lucide-react";

const ROLES = ["super_admin", "principal", "teacher", "staff", "student", "guardian"] as const;
type Role = typeof ROLES[number];

type User = {
  id: string; name: string; email: string;
  role: Role; isActive: boolean; createdAt: string | Date;
  staff?:    { staffNo: string; roleTitle: string } | null;
  student?:  { admissionNo: string } | null;
  guardian?: { id: string; relation: string } | null;
};

export function UserManagementClient({ users: initial, currentUserId }: { users: User[]; currentUserId: string }) {
  const [users, setUsers]   = useState<User[]>(initial);
  const [busy, setBusy]     = useState<string | null>(null);
  const [flash, setFlash]   = useState<{ msg: string; ok: boolean } | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const notify = (msg: string, ok = true) => { setFlash({ msg, ok }); setTimeout(() => setFlash(null), 3000); };

  const reload = async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
  };

  const changeRole = async (id: string, role: string) => {
    setBusy(`role-${id}`);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    });
    setBusy(null);
    if (res.ok) { notify("Role updated"); reload(); }
    else { const j = await res.json(); notify(j.error ?? "Failed", false); }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    setBusy(`active-${id}`);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive })
    });
    setBusy(null);
    if (res.ok) { notify(`User ${isActive ? "activated" : "deactivated"}`); reload(); }
    else { const j = await res.json(); notify(j.error ?? "Failed", false); }
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setBusy(`del-${id}`);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) { notify("User deleted"); reload(); }
    else { const j = await res.json(); notify(j.error ?? "Failed", false); }
  };

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div>
      {flash && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${flash.ok ? "bg-emerald/10 text-emerald" : "bg-rose-50 text-rose-600"}`}>
          {flash.msg}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="focus-ring flex-1 rounded-xl border border-line px-4 py-2.5 text-sm min-w-[200px]" />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="focus-ring rounded-xl border border-line px-4 py-2.5 text-sm">
          <option value="all">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
        <div className="flex items-center gap-3 border-b border-line px-6 py-4">
          <UserCog size={18} className="text-navy" />
          <h2 className="font-heading text-lg font-semibold text-navy">System Users</h2>
          <span className="ml-auto label-sm text-muted">{filtered.length} of {users.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Details</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((u) => (
                <tr key={u.id} className={`transition hover:bg-slate-50 ${!u.isActive ? "opacity-50" : ""}`}>
                  <td className="px-5 py-3 font-semibold text-navy">{u.name}</td>
                  <td className="px-5 py-3 text-muted">{u.email}</td>
                  <td className="px-5 py-3">
                    {u.id === currentUserId ? (
                      <Badge roleName={u.role}>{u.role.replace("_", " ")}</Badge>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        disabled={!!busy}
                        className="focus-ring rounded-lg border border-line px-2 py-1 text-xs font-semibold"
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                      </select>
                    )}
                    {busy === `role-${u.id}` && <Loader2 size={12} className="ml-1 inline animate-spin" />}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={u.isActive ? "success" : "danger"}>
                      {u.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted">
                    {u.staff?.roleTitle ?? u.student?.admissionNo ?? u.guardian?.relation ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    {u.id !== currentUserId && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleActive(u.id, !u.isActive)} disabled={!!busy}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40 ${
                            u.isActive
                              ? "border border-amber/40 text-amber hover:bg-amber/10"
                              : "border border-emerald/40 text-emerald hover:bg-emerald/10"
                          }`}
                        >
                          {busy === `active-${u.id}` ? <Loader2 size={11} className="animate-spin" /> : u.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => deleteUser(u.id, u.name)} disabled={!!busy}
                          className="grid h-7 w-7 place-items-center rounded-lg border border-line text-muted hover:border-rose-200 hover:text-rose-500 disabled:opacity-40"
                        >
                          {busy === `del-${u.id}` ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-muted">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
