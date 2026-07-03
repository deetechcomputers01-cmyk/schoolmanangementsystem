"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CheckCircle2, Loader2, Plus, UserPlus, X, XCircle } from "lucide-react";

type Application = {
  id: string; firstName: string; lastName: string; gender: string;
  dateOfBirth: string | Date; address: string; applyingForClass: string;
  guardianName: string; guardianPhone: string; guardianEmail: string | null;
  guardianRelation: string; status: string; admissionNo: string | null;
  notes: string | null; reviewedAt: string | Date | null;
  reviewedBy: { name: string } | null; createdAt: string | Date;
};

type Props = {
  initialList: Application[]; classes: { id: string; name: string }[];
  canReview: boolean; canCreate: boolean;
};

const STATUS_COLORS: Record<string, string> = {
  pending:  "bg-amber/10 text-amber",
  approved: "bg-emerald/10 text-emerald",
  rejected: "bg-rose-50 text-rose-600",
  enrolled: "bg-sky-100 text-sky-700"
};

const BLANK = {
  firstName: "", lastName: "", gender: "Female", dateOfBirth: "",
  address: "", applyingForClass: "",
  guardianName: "", guardianPhone: "", guardianEmail: "", guardianRelation: "Parent"
};

export function AdmissionsClient({ initialList, classes, canReview, canCreate }: Props) {
  const [list, setList]     = useState<Application[]>(initialList);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]     = useState({ ...BLANK });
  const [busy, setBusy]     = useState<string | null>(null);
  const [flash, setFlash]   = useState<{ msg: string; ok: boolean } | null>(null);
  const [filter, setFilter] = useState("all");

  const notify = (msg: string, ok = true) => { setFlash({ msg, ok }); setTimeout(() => setFlash(null), 3500); };
  const reload = async () => { const r = await fetch("/api/admissions"); if (r.ok) setList(await r.json()); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy("create");
    const res = await fetch("/api/admissions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, dateOfBirth: new Date(form.dateOfBirth).toISOString() })
    });
    setBusy(null);
    if (res.ok) { setShowForm(false); setForm({ ...BLANK }); notify("Application submitted"); reload(); }
    else notify("Failed to submit", false);
  };

  const review = async (id: string, status: string, notes?: string) => {
    setBusy(`review-${id}`);
    const res = await fetch(`/api/admissions/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes })
    });
    setBusy(null);
    if (res.ok) { notify(`Application ${status}`); reload(); }
    else { const j = await res.json(); notify(j.error ?? "Failed", false); }
  };

  const enroll = async (id: string) => {
    if (!confirm("Create a student record from this application?")) return;
    setBusy(`enroll-${id}`);
    const res = await fetch(`/api/admissions/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "enroll" })
    });
    setBusy(null);
    if (res.ok) { notify("Student enrolled successfully!"); reload(); }
    else { const j = await res.json(); notify(j.error ?? "Enrollment failed", false); }
  };

  const filtered = filter === "all" ? list : list.filter((a) => a.status === filter);
  const counts = { pending: 0, approved: 0, rejected: 0, enrolled: 0 };
  list.forEach((a) => { if (a.status in counts) counts[a.status as keyof typeof counts]++; });

  return (
    <div>
      {flash && <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${flash.ok ? "bg-emerald/10 text-emerald" : "bg-rose-50 text-rose-600"}`}>{flash.msg}</div>}

      {/* Stats + filter */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-3">
          {(["all","pending","approved","rejected","enrolled"] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${filter === s ? "bg-navy text-white" : "border border-line text-muted hover:border-navy hover:text-navy"}`}>
              {s}{s !== "all" && ` (${counts[s as keyof typeof counts]})`}
            </button>
          ))}
        </div>
        {canCreate && !showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/80">
            <Plus size={15} /> New Application
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Card className="mb-6 border-2 border-emerald/30">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-base font-semibold text-navy">New Admission Application</h3>
            <button onClick={() => setShowForm(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-slate-100"><X size={16} /></button>
          </div>
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div><label className="mb-1 block text-xs font-semibold text-muted">First Name</label>
                <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
              <div><label className="mb-1 block text-xs font-semibold text-muted">Last Name</label>
                <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
              <div><label className="mb-1 block text-xs font-semibold text-muted">Gender</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm">
                  <option>Female</option><option>Male</option></select></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-1 block text-xs font-semibold text-muted">Date of Birth</label>
                <input required type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
              <div><label className="mb-1 block text-xs font-semibold text-muted">Applying for Class</label>
                <select required value={form.applyingForClass} onChange={(e) => setForm({ ...form, applyingForClass: e.target.value })} className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm">
                  <option value="">Select class</option>
                  {classes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
            </div>
            <div><label className="mb-1 block text-xs font-semibold text-muted">Home Address</label>
              <input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
            <div className="border-t border-line pt-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Guardian Information</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="mb-1 block text-xs font-semibold text-muted">Guardian Name</label>
                  <input required value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
                <div><label className="mb-1 block text-xs font-semibold text-muted">Phone</label>
                  <input required value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
                <div><label className="mb-1 block text-xs font-semibold text-muted">Email (optional)</label>
                  <input type="email" value={form.guardianEmail} onChange={(e) => setForm({ ...form, guardianEmail: e.target.value })} className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
                <div><label className="mb-1 block text-xs font-semibold text-muted">Relation</label>
                  <select value={form.guardianRelation} onChange={(e) => setForm({ ...form, guardianRelation: e.target.value })} className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm">
                    <option>Parent</option><option>Guardian</option><option>Sibling</option><option>Other</option></select></div>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={!!busy} className="flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {busy === "create" ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} Submit Application</button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-muted hover:text-navy">Cancel</button>
            </div>
          </form>
        </Card>
      )}

      {/* List */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
        <div className="border-b border-line px-6 py-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-navy">Applications ({filtered.length})</h2>
        </div>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <UserPlus size={36} className="mb-3 text-muted/30" />
            <p className="font-heading font-semibold text-navy">No applications yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3">Applicant</th>
                  <th className="px-5 py-3">Class</th>
                  <th className="px-5 py-3">Guardian</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Adm No</th>
                  {canReview && <th className="px-5 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-navy">{app.firstName} {app.lastName}</p>
                      <p className="text-xs text-muted">{app.gender} · {new Date(app.dateOfBirth).toLocaleDateString("en-GB")}</p>
                    </td>
                    <td className="px-5 py-3 text-muted">{app.applyingForClass}</td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-navy">{app.guardianName}</p>
                      <p className="text-xs text-muted">{app.guardianPhone}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${STATUS_COLORS[app.status] ?? "bg-slate-100 text-navy"}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="font-data px-5 py-3 text-muted">{app.admissionNo ?? "—"}</td>
                    {canReview && (
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {app.status === "pending" && (
                            <>
                              <button onClick={() => review(app.id, "approved")} disabled={!!busy}
                                className="flex items-center gap-1 rounded-lg border border-emerald/30 px-2.5 py-1.5 text-xs font-semibold text-emerald hover:bg-emerald/10 disabled:opacity-40">
                                {busy === `review-${app.id}` ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />} Approve
                              </button>
                              <button onClick={() => review(app.id, "rejected")} disabled={!!busy}
                                className="flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-40">
                                <XCircle size={11} /> Reject
                              </button>
                            </>
                          )}
                          {app.status === "approved" && (
                            <button onClick={() => enroll(app.id)} disabled={!!busy}
                              className="flex items-center gap-1 rounded-lg bg-navy px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-navy/80 disabled:opacity-40">
                              {busy === `enroll-${app.id}` ? <Loader2 size={11} className="animate-spin" /> : <UserPlus size={11} />} Enroll
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
