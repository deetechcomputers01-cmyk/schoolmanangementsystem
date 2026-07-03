"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Bell, Loader2, Pin, PinOff, Plus, Trash2, X } from "lucide-react";

const ROLES = ["super_admin","principal","teacher","staff","student","guardian"] as const;

type Announcement = {
  id: string; title: string; body: string; audience: string[];
  isPinned: boolean; publishedAt: string | Date; expiresAt: string | Date | null;
  author: { name: string; role: string };
};

type Props = {
  initialList: Announcement[];
  canManage:   boolean;
  currentRole: string;
};

const AUDIENCE_LABELS: Record<string, string> = {
  super_admin: "Super Admin", principal: "Principal",
  teacher: "Teacher", staff: "Staff", student: "Student", guardian: "Guardian"
};

function fmt(d: string | Date) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const BLANK = { title: "", body: "", audience: [] as string[], isPinned: false, expiresAt: "" };

export function AnnouncementsClient({ initialList, canManage, currentRole }: Props) {
  const [list, setList]       = useState<Announcement[]>(initialList);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ ...BLANK });
  const [busy, setBusy]         = useState<string | null>(null);
  const [flash, setFlash]       = useState<{ msg: string; ok: boolean } | null>(null);

  const notify = (msg: string, ok = true) => { setFlash({ msg, ok }); setTimeout(() => setFlash(null), 3500); };

  const reload = async () => {
    const res = await fetch("/api/announcements");
    if (res.ok) setList(await res.json());
  };

  const toggleAudience = (role: string) => {
    setForm((f) => ({
      ...f,
      audience: f.audience.includes(role)
        ? f.audience.filter((r) => r !== role)
        : [...f.audience, role]
    }));
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("create");
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title:     form.title,
        body:      form.body,
        audience:  form.audience,
        isPinned:  form.isPinned,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined
      })
    });
    setBusy(null);
    if (res.ok) {
      setShowForm(false); setForm({ ...BLANK });
      notify("Announcement published"); reload();
    } else notify("Failed to publish", false);
  };

  const togglePin = async (id: string, isPinned: boolean) => {
    setBusy(`pin-${id}`);
    const res = await fetch(`/api/announcements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !isPinned })
    });
    setBusy(null);
    if (res.ok) { notify(isPinned ? "Unpinned" : "Pinned"); reload(); }
    else notify("Failed", false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    setBusy(`del-${id}`);
    const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) { notify("Deleted"); reload(); }
    else notify("Failed to delete", false);
  };

  const pinned  = list.filter((a) => a.isPinned);
  const regular = list.filter((a) => !a.isPinned);

  return (
    <div>
      {flash && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${flash.ok ? "bg-emerald/10 text-emerald" : "bg-rose-50 text-rose-600"}`}>
          {flash.msg}
        </div>
      )}

      {/* Create form */}
      {canManage && (
        <div className="mb-6">
          {!showForm ? (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy/80">
              <Plus size={16} /> New Announcement
            </button>
          ) : (
            <Card className="border-2 border-emerald/30">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-heading text-base font-semibold text-navy">New Announcement</h3>
                <button onClick={() => setShowForm(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-slate-100">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={create} className="grid gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Title</label>
                  <input required placeholder="Announcement title"
                    value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Message</label>
                  <textarea required rows={4} placeholder="Write your message here…"
                    value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
                    className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm resize-none" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-muted">
                    Audience (leave all unchecked = everyone)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map((role) => (
                      <button key={role} type="button"
                        onClick={() => toggleAudience(role)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          form.audience.includes(role)
                            ? "bg-navy text-white"
                            : "border border-line text-muted hover:border-navy hover:text-navy"
                        }`}>
                        {AUDIENCE_LABELS[role]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted">Expires At (optional)</label>
                    <input type="datetime-local"
                      value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                      className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" />
                  </div>
                  <div className="flex items-end">
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-navy">
                      <input type="checkbox" checked={form.isPinned}
                        onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                        className="h-4 w-4 rounded" />
                      Pin to top
                    </label>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={!!busy}
                    className="flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy/80 disabled:opacity-50">
                    {busy === "create" ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
                    Publish
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="text-sm text-muted hover:text-navy">Cancel</button>
                </div>
              </form>
            </Card>
          )}
        </div>
      )}

      {/* Empty */}
      {list.length === 0 && (
        <Card className="py-16 text-center">
          <Bell size={40} className="mx-auto mb-3 text-muted/30" />
          <p className="font-heading text-lg font-semibold text-navy">No announcements yet</p>
          <p className="mt-1 text-sm text-muted">Announcements from the school will appear here.</p>
        </Card>
      )}

      {/* Pinned */}
      {pinned.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
            <Pin size={12} /> Pinned
          </p>
          <div className="grid gap-4">
            {pinned.map((a) => (
              <AnnouncementCard key={a.id} ann={a} canManage={canManage} busy={busy}
                onPin={() => togglePin(a.id, a.isPinned)} onDelete={() => remove(a.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Regular */}
      {regular.length > 0 && (
        <div className="grid gap-4">
          {regular.map((a) => (
            <AnnouncementCard key={a.id} ann={a} canManage={canManage} busy={busy}
              onPin={() => togglePin(a.id, a.isPinned)} onDelete={() => remove(a.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function AnnouncementCard({
  ann, canManage, busy, onPin, onDelete
}: {
  ann: Announcement; canManage: boolean;
  busy: string | null; onPin: () => void; onDelete: () => void;
}) {
  const expired = ann.expiresAt ? new Date(ann.expiresAt) < new Date() : false;

  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-soft transition ${
      ann.isPinned ? "border-amber/30 bg-amber/5" : "border-line"
    } ${expired ? "opacity-50" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {ann.isPinned && <Pin size={14} className="text-amber" />}
            <h3 className="font-heading text-base font-semibold text-navy">{ann.title}</h3>
            {expired && <Badge tone="danger">Expired</Badge>}
          </div>
          <p className="mt-2 text-sm text-muted leading-relaxed">{ann.body}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted">
              By <span className="font-semibold text-navy">{ann.author.name}</span> · {fmt(ann.publishedAt)}
            </span>
            {ann.expiresAt && !expired && (
              <span className="text-xs text-muted">Expires {fmt(ann.expiresAt)}</span>
            )}
            {ann.audience.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {ann.audience.map((r) => (
                  <span key={r} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-navy capitalize">
                    {r.replace("_", " ")}
                  </span>
                ))}
              </div>
            )}
            {ann.audience.length === 0 && (
              <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-[11px] font-semibold text-emerald">Everyone</span>
            )}
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <button onClick={onPin} disabled={!!busy}
              title={ann.isPinned ? "Unpin" : "Pin"}
              className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:border-amber hover:text-amber disabled:opacity-40">
              {busy === `pin-${ann.id}` ? <Loader2 size={13} className="animate-spin" /> : ann.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
            <button onClick={onDelete} disabled={!!busy}
              className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:border-rose-200 hover:text-rose-500 disabled:opacity-40">
              {busy === `del-${ann.id}` ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
