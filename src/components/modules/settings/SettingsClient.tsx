"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { CheckCircle2, Loader2, Save, School } from "lucide-react";

const TIMEZONES = [
  "Africa/Accra", "Africa/Lagos", "Africa/Nairobi", "Africa/Cairo",
  "Europe/London", "America/New_York", "America/Chicago", "Asia/Dubai"
];

const DEFAULT_SCALE = [
  { grade: "A1", min: 80, max: 100, remark: "Excellent" },
  { grade: "B2", min: 70, max: 79,  remark: "Very Good" },
  { grade: "B3", min: 60, max: 69,  remark: "Good" },
  { grade: "C4", min: 50, max: 59,  remark: "Credit" },
  { grade: "C5", min: 45, max: 49,  remark: "Credit" },
  { grade: "C6", min: 40, max: 44,  remark: "Credit" },
  { grade: "D7", min: 35, max: 39,  remark: "Pass" },
  { grade: "E8", min: 30, max: 34,  remark: "Pass" },
  { grade: "F9", min: 0,  max: 29,  remark: "Fail" }
];

type Settings = {
  id: string; name: string; address: string; motto: string;
  phone: string; email: string; logoUrl: string | null;
  reportFooter: string; timezone: string; gradingScale: unknown;
};

export function SettingsClient({ settings: initial }: { settings: Settings }) {
  const [form, setForm] = useState({
    name:         initial.name,
    address:      initial.address,
    motto:        initial.motto,
    phone:        initial.phone,
    email:        initial.email,
    logoUrl:      initial.logoUrl ?? "",
    reportFooter: initial.reportFooter,
    timezone:     initial.timezone
  });

  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const set = (field: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setSaving(false);
    if (res.ok) setSaved(true);
    else { const j = await res.json(); setError(j.error ?? "Failed to save"); }
  };

  const gradingScale = Array.isArray(initial.gradingScale)
    ? initial.gradingScale as typeof DEFAULT_SCALE
    : DEFAULT_SCALE;

  return (
    <div className="max-w-3xl space-y-6">
      {/* School identity */}
      <Card>
        <div className="mb-5 flex items-center gap-3">
          <School size={20} className="text-navy" />
          <h2 className="font-heading text-base font-semibold text-navy">School Identity</h2>
        </div>
        <form onSubmit={save} className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">School Name</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)}
                className="focus-ring w-full rounded-lg border border-line px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">School Motto</label>
              <input placeholder="e.g. Knowledge is Power" value={form.motto} onChange={(e) => set("motto", e.target.value)}
                className="focus-ring w-full rounded-lg border border-line px-3 py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Address</label>
            <input placeholder="School physical address" value={form.address} onChange={(e) => set("address", e.target.value)}
              className="focus-ring w-full rounded-lg border border-line px-3 py-2.5 text-sm" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Phone</label>
              <input type="tel" placeholder="+233…" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                className="focus-ring w-full rounded-lg border border-line px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Email</label>
              <input type="email" placeholder="school@example.edu.gh" value={form.email} onChange={(e) => set("email", e.target.value)}
                className="focus-ring w-full rounded-lg border border-line px-3 py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Logo URL (optional)</label>
            <input type="url" placeholder="https://…" value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)}
              className="focus-ring w-full rounded-lg border border-line px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Report Card Footer Text</label>
            <textarea rows={2} placeholder="e.g. Produced by ScholarSphere | BECE Centre No: 0001"
              value={form.reportFooter} onChange={(e) => set("reportFooter", e.target.value)}
              className="focus-ring w-full resize-none rounded-lg border border-line px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Timezone</label>
            <select value={form.timezone} onChange={(e) => set("timezone", e.target.value)}
              className="focus-ring w-full rounded-lg border border-line px-3 py-2.5 text-sm">
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>

          {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}

          <div className="flex items-center gap-4">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-navy px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy/80 disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Settings
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald">
                <CheckCircle2 size={16} /> Settings saved
              </span>
            )}
          </div>
        </form>
      </Card>

      {/* Grading scale (read-only, info card) */}
      <Card>
        <h2 className="mb-1 font-heading text-base font-semibold text-navy">Grading Scale (Ghana GES)</h2>
        <p className="mb-4 text-xs text-muted">The system uses the standard Ghana GES grading scale for all report cards.</p>
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-2.5">Grade</th>
                <th className="px-4 py-2.5">Score Range</th>
                <th className="px-4 py-2.5">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {gradingScale.map((row) => (
                <tr key={row.grade}>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      ["A1","B2","B3"].includes(row.grade) ? "bg-emerald/10 text-emerald"
                      : ["C4","C5","C6"].includes(row.grade) ? "bg-amber/10 text-amber"
                      : "bg-rose-50 text-rose-600"
                    }`}>{row.grade}</span>
                  </td>
                  <td className="px-4 py-2.5 font-data text-muted">{row.min} – {row.max}</td>
                  <td className="px-4 py-2.5 text-muted">{row.remark}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
