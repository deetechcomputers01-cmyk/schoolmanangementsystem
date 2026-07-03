"use client";

import { useState } from "react";
import { Loader2, Plus, ShieldAlert, Trash2 } from "lucide-react";

type BlockedIP = {
  id: string; ip: string; reason: string | null; expiresAt: string | Date | null;
  createdAt: string | Date;
  blockedBy: { name: string; email: string };
};

export function BlockedIPClient({ initialList }: { initialList: BlockedIP[] }) {
  const [list, setList]     = useState<BlockedIP[]>(initialList);
  const [busy, setBusy]     = useState<string | null>(null);
  const [flash, setFlash]   = useState<{ msg: string; ok: boolean } | null>(null);
  const [form, setForm]     = useState({ ip: "", reason: "", expiresAt: "" });
  const [showForm, setShowForm] = useState(false);

  const notify = (msg: string, ok = true) => { setFlash({ msg, ok }); setTimeout(() => setFlash(null), 3000); };

  const reload = async () => {
    const res = await fetch("/api/admin/blocked-ips");
    if (res.ok) setList(await res.json());
  };

  const blockIP = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("block");
    const res = await fetch("/api/admin/blocked-ips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ip:        form.ip,
        reason:    form.reason || undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined
      })
    });
    setBusy(null);
    if (res.ok) {
      notify("IP blocked");
      setForm({ ip: "", reason: "", expiresAt: "" });
      setShowForm(false);
      reload();
    } else {
      const j = await res.json();
      notify(j.error ?? "Failed", false);
    }
  };

  const unblock = async (id: string, ip: string) => {
    if (!confirm(`Unblock IP ${ip}?`)) return;
    setBusy(`del-${id}`);
    const res = await fetch(`/api/admin/blocked-ips/${id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) { notify("IP unblocked"); reload(); }
    else notify("Failed", false);
  };

  const fmt = (d: string | Date) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      {flash && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${flash.ok ? "bg-emerald/10 text-emerald" : "bg-rose-50 text-rose-600"}`}>
          {flash.msg}
        </div>
      )}

      {/* Block IP form */}
      <div className="mb-6 rounded-2xl border border-line bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-base font-semibold text-navy flex items-center gap-2">
            <ShieldAlert size={16} /> Block an IP Address
          </h2>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-sm font-semibold text-navy hover:border-navy">
            <Plus size={14} /> {showForm ? "Cancel" : "Add Block"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={blockIP} className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">IPv4 Address</label>
              <input required placeholder="e.g. 192.168.1.100"
                value={form.ip} onChange={(e) => setForm({ ...form, ip: e.target.value })}
                className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Reason (optional)</label>
              <input placeholder="e.g. Suspicious login attempts"
                value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Expires At (optional)</label>
              <input type="datetime-local"
                value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
            <div className="flex items-center gap-3 sm:col-span-3">
              <button type="submit" disabled={!!busy}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
                {busy === "block" ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
                Block IP
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Blocked list */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
        <div className="border-b border-line px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-navy">
            Currently Blocked ({list.length})
          </h2>
        </div>
        {list.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <ShieldAlert size={36} className="mb-3 text-muted/30" />
            <p className="font-heading font-semibold text-navy">No blocked IPs</p>
            <p className="text-sm text-muted">Block an IP above when suspicious activity is detected.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-6 py-3">IP Address</th>
                <th className="px-6 py-3">Reason</th>
                <th className="px-6 py-3">Blocked By</th>
                <th className="px-6 py-3">Blocked On</th>
                <th className="px-6 py-3">Expires</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-data font-semibold text-rose-600">{item.ip}</td>
                  <td className="px-6 py-3 text-muted">{item.reason ?? "—"}</td>
                  <td className="px-6 py-3 font-semibold text-navy">{item.blockedBy.name}</td>
                  <td className="px-6 py-3 text-xs text-muted">{fmt(item.createdAt)}</td>
                  <td className="px-6 py-3 text-xs text-muted">{item.expiresAt ? fmt(item.expiresAt) : "Never"}</td>
                  <td className="px-6 py-3">
                    <button onClick={() => unblock(item.id, item.ip)} disabled={!!busy}
                      className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:border-emerald hover:text-emerald disabled:opacity-40">
                      {busy === `del-${item.id}` ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      Unblock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
