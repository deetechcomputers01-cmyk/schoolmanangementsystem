"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { AlertTriangle, Loader2, Plus, Trash2, X } from "lucide-react";

const CATEGORIES = ["Late Attendance", "Misconduct", "Violence", "Academic Dishonesty", "Property Damage", "Bullying", "Other"];
const ACTIONS    = ["Verbal Warning", "Written Warning", "Detention", "Parent Notification", "Suspension (1 day)", "Suspension (3 days)", "Expulsion"];

type Record_ = {
  id: string; category: string; description: string; action: string;
  date: string | Date;
  student: { firstName: string; lastName: string; admissionNo: string; class: { name: string } };
  reportedBy: { name: string; role: string };
};

type Student = { id: string; firstName: string; lastName: string; admissionNo: string; class: { name: string } };

type Props = { initialRecords: Record_[]; students: Student[]; canCreate: boolean; canDelete: boolean };

const BLANK = { studentId: "", category: CATEGORIES[0], description: "", action: ACTIONS[0], date: new Date().toISOString().split("T")[0] };

export function DisciplinaryClient({ initialRecords, students, canCreate, canDelete }: Props) {
  const [records, setRecords]   = useState<Record_[]>(initialRecords);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ ...BLANK });
  const [busy, setBusy]         = useState<string | null>(null);
  const [flash, setFlash]       = useState<{ msg: string; ok: boolean } | null>(null);

  const notify = (msg: string, ok = true) => { setFlash({ msg, ok }); setTimeout(() => setFlash(null), 3000); };
  const reload = async () => { const r = await fetch("/api/disciplinary"); if (r.ok) setRecords(await r.json()); };

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy("create");
    const res = await fetch("/api/disciplinary", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, date: new Date(form.date).toISOString() })
    });
    setBusy(null);
    if (res.ok) { setShowForm(false); setForm({ ...BLANK }); notify("Record logged"); reload(); }
    else notify("Failed", false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    setBusy(`del-${id}`);
    const res = await fetch(`/api/disciplinary/${id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) { notify("Deleted"); reload(); } else notify("Failed", false);
  };

  return (
    <div>
      {flash && <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${flash.ok ? "bg-emerald/10 text-emerald" : "bg-rose-50 text-rose-600"}`}>{flash.msg}</div>}

      {canCreate && !showForm && (
        <button onClick={() => setShowForm(true)} className="mb-6 flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/80">
          <Plus size={15} /> Log Incident
        </button>
      )}

      {showForm && (
        <Card className="mb-6 border-2 border-rose-200">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-base font-semibold text-navy">Log Disciplinary Incident</h3>
            <button onClick={() => setShowForm(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-slate-100"><X size={16} /></button>
          </div>
          <form onSubmit={create} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-1 block text-xs font-semibold text-muted">Student</label>
                <select required value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm">
                  <option value="">Select student</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.class.name})</option>)}
                </select></div>
              <div><label className="mb-1 block text-xs font-semibold text-muted">Date</label>
                <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-1 block text-xs font-semibold text-muted">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select></div>
              <div><label className="mb-1 block text-xs font-semibold text-muted">Action Taken</label>
                <select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}
                  className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm">
                  {ACTIONS.map((a) => <option key={a}>{a}</option>)}
                </select></div>
            </div>
            <div><label className="mb-1 block text-xs font-semibold text-muted">Description</label>
              <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the incident in detail..."
                className="focus-ring w-full resize-none rounded-lg border border-line px-3 py-2 text-sm" /></div>
            <div className="flex gap-3">
              <button type="submit" disabled={!!busy} className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {busy === "create" ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} />} Log Incident
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-muted hover:text-navy">Cancel</button>
            </div>
          </form>
        </Card>
      )}

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
        <div className="border-b border-line px-6 py-4"><h2 className="font-heading text-lg font-semibold text-navy">Incident Log ({records.length})</h2></div>
        {records.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center"><AlertTriangle size={36} className="mb-3 text-muted/30" /><p className="font-heading font-semibold text-navy">No disciplinary records</p></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted">
              <tr><th className="px-5 py-3">Student</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Reported By</th>{canDelete && <th className="px-5 py-3" />}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3"><p className="font-semibold text-navy">{r.student.firstName} {r.student.lastName}</p><p className="text-xs text-muted">{r.student.class.name}</p></td>
                  <td className="px-5 py-3 text-muted">{new Date(r.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="px-5 py-3"><span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">{r.category}</span></td>
                  <td className="px-5 py-3 font-semibold text-navy">{r.action}</td>
                  <td className="px-5 py-3 text-muted">{r.reportedBy.name}</td>
                  {canDelete && <td className="px-5 py-3">
                    <button onClick={() => remove(r.id)} disabled={!!busy} className="grid h-7 w-7 place-items-center rounded-lg border border-line text-muted hover:border-rose-200 hover:text-rose-500 disabled:opacity-40">
                      {busy === `del-${r.id}` ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
