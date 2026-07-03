"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Activity, Loader2, Plus, Syringe } from "lucide-react";

type HealthRecord = {
  id: string; bloodGroup: string | null; allergies: string | null;
  conditions: string | null; emergencyContact: string | null; emergencyPhone: string | null;
  visits: { id: string; date: string | Date; complaint: string; treatment: string | null; notes: string | null }[];
  vaccinations: { id: string; vaccineName: string; date: string | Date; nextDue: string | Date | null; notes: string | null }[];
} | null;

const BLOOD_GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-","Unknown"];

export function HealthRecordClient({
  studentId, student, initialRecord
}: {
  studentId: string;
  student: { firstName: string; lastName: string; class: { name: string } };
  initialRecord: HealthRecord;
}) {
  const [record, setRecord]   = useState<HealthRecord>(initialRecord);
  const [tab, setTab]         = useState<"info"|"visits"|"vaccinations">("info");
  const [busy, setBusy]       = useState<string | null>(null);
  const [flash, setFlash]     = useState<{ msg: string; ok: boolean } | null>(null);
  const [infoForm, setInfoForm] = useState({
    bloodGroup:       record?.bloodGroup ?? "",
    allergies:        record?.allergies ?? "",
    conditions:       record?.conditions ?? "",
    emergencyContact: record?.emergencyContact ?? "",
    emergencyPhone:   record?.emergencyPhone ?? ""
  });
  const [visitForm, setVisitForm]   = useState({ complaint: "", treatment: "", notes: "", date: new Date().toISOString().split("T")[0] });
  const [vaxForm, setVaxForm]       = useState({ vaccineName: "", date: "", nextDue: "", notes: "" });

  const notify = (msg: string, ok = true) => { setFlash({ msg, ok }); setTimeout(() => setFlash(null), 3000); };
  const reload = async () => { const r = await fetch(`/api/health/${studentId}`); if (r.ok) setRecord(await r.json()); };

  const saveInfo = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy("info");
    const res = await fetch(`/api/health/${studentId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(infoForm) });
    setBusy(null);
    if (res.ok) { notify("Health info saved"); reload(); } else notify("Failed", false);
  };

  const addVisit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy("visit");
    const res = await fetch(`/api/health/${studentId}/visits`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...visitForm, date: new Date(visitForm.date).toISOString() })
    });
    setBusy(null);
    if (res.ok) { setVisitForm({ complaint: "", treatment: "", notes: "", date: new Date().toISOString().split("T")[0] }); notify("Visit recorded"); reload(); }
    else notify("Failed", false);
  };

  const addVax = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy("vax");
    const res = await fetch(`/api/health/${studentId}/vaccinations`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...vaxForm, date: new Date(vaxForm.date).toISOString(), nextDue: vaxForm.nextDue ? new Date(vaxForm.nextDue).toISOString() : undefined })
    });
    setBusy(null);
    if (res.ok) { setVaxForm({ vaccineName: "", date: "", nextDue: "", notes: "" }); notify("Vaccination added"); reload(); }
    else notify("Failed", false);
  };

  const fmt = (d: string | Date) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div>
      {flash && <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${flash.ok ? "bg-emerald/10 text-emerald" : "bg-rose-50 text-rose-600"}`}>{flash.msg}</div>}

      <div className="mb-6 rounded-2xl border border-line bg-white px-6 py-4 flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-rose-500"><Plus size={20} /></div>
        <div><p className="font-heading font-semibold text-navy">{student.firstName} {student.lastName}</p><p className="text-sm text-muted">{student.class.name}</p></div>
        {record?.bloodGroup && <span className="ml-auto rounded-full bg-rose-50 px-3 py-1.5 text-sm font-bold text-rose-600">{record.bloodGroup}</span>}
      </div>

      <div className="mb-6 flex gap-3">
        {(["info","visits","vaccinations"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-5 py-2 text-sm font-semibold capitalize transition ${tab === t ? "bg-navy text-white" : "border border-line text-muted hover:border-navy"}`}>{t}</button>
        ))}
      </div>

      {tab === "info" && (
        <Card className="max-w-xl">
          <h2 className="mb-4 font-heading text-base font-semibold text-navy">Medical Information</h2>
          <form onSubmit={saveInfo} className="grid gap-4">
            <div><label className="mb-1 block text-xs font-semibold text-muted">Blood Group</label>
              <select value={infoForm.bloodGroup} onChange={(e) => setInfoForm({ ...infoForm, bloodGroup: e.target.value })} className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm">
                <option value="">Not recorded</option>{BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}</select></div>
            <div><label className="mb-1 block text-xs font-semibold text-muted">Allergies</label>
              <textarea rows={2} value={infoForm.allergies} onChange={(e) => setInfoForm({ ...infoForm, allergies: e.target.value })} placeholder="List any known allergies" className="focus-ring w-full resize-none rounded-lg border border-line px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-semibold text-muted">Chronic Conditions</label>
              <textarea rows={2} value={infoForm.conditions} onChange={(e) => setInfoForm({ ...infoForm, conditions: e.target.value })} placeholder="e.g. Asthma, Diabetes" className="focus-ring w-full resize-none rounded-lg border border-line px-3 py-2 text-sm" /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="mb-1 block text-xs font-semibold text-muted">Emergency Contact</label>
                <input value={infoForm.emergencyContact} onChange={(e) => setInfoForm({ ...infoForm, emergencyContact: e.target.value })} className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
              <div><label className="mb-1 block text-xs font-semibold text-muted">Emergency Phone</label>
                <input value={infoForm.emergencyPhone} onChange={(e) => setInfoForm({ ...infoForm, emergencyPhone: e.target.value })} className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
            </div>
            <button type="submit" disabled={!!busy} className="flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white w-fit disabled:opacity-50">
              {busy === "info" ? <Loader2 size={14} className="animate-spin" /> : null} Save Info</button>
          </form>
        </Card>
      )}

      {tab === "visits" && (
        <div className="space-y-4">
          <Card>
            <h2 className="mb-4 font-heading text-base font-semibold text-navy">Log Sick Visit</h2>
            <form onSubmit={addVisit} className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="mb-1 block text-xs font-semibold text-muted">Date</label>
                  <input type="date" required value={visitForm.date} onChange={(e) => setVisitForm({ ...visitForm, date: e.target.value })} className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
                <div><label className="mb-1 block text-xs font-semibold text-muted">Complaint</label>
                  <input required value={visitForm.complaint} onChange={(e) => setVisitForm({ ...visitForm, complaint: e.target.value })} placeholder="e.g. Headache, Fever" className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="mb-1 block text-xs font-semibold text-muted">Treatment</label>
                <input value={visitForm.treatment} onChange={(e) => setVisitForm({ ...visitForm, treatment: e.target.value })} placeholder="e.g. Paracetamol administered" className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
              <button type="submit" disabled={!!busy} className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white w-fit disabled:opacity-50">
                {busy === "visit" ? <Loader2 size={13} className="animate-spin" /> : <Activity size={13} />} Record Visit</button>
            </form>
          </Card>
          <div className="space-y-2">{(record?.visits ?? []).map((v) => (
            <div key={v.id} className="rounded-xl border border-line bg-white p-4">
              <div className="flex items-center justify-between"><p className="font-semibold text-navy">{v.complaint}</p><p className="text-xs text-muted">{fmt(v.date)}</p></div>
              {v.treatment && <p className="mt-1 text-sm text-muted">Treatment: {v.treatment}</p>}
            </div>
          ))}</div>
        </div>
      )}

      {tab === "vaccinations" && (
        <div className="space-y-4">
          <Card>
            <h2 className="mb-4 font-heading text-base font-semibold text-navy">Add Vaccination</h2>
            <form onSubmit={addVax} className="grid gap-3 sm:grid-cols-2">
              <div><label className="mb-1 block text-xs font-semibold text-muted">Vaccine Name</label>
                <input required value={vaxForm.vaccineName} onChange={(e) => setVaxForm({ ...vaxForm, vaccineName: e.target.value })} placeholder="e.g. BCG, Polio, Measles" className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
              <div><label className="mb-1 block text-xs font-semibold text-muted">Date Given</label>
                <input type="date" required value={vaxForm.date} onChange={(e) => setVaxForm({ ...vaxForm, date: e.target.value })} className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
              <div><label className="mb-1 block text-xs font-semibold text-muted">Next Due (optional)</label>
                <input type="date" value={vaxForm.nextDue} onChange={(e) => setVaxForm({ ...vaxForm, nextDue: e.target.value })} className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
              <div className="flex items-end"><button type="submit" disabled={!!busy} className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {busy === "vax" ? <Loader2 size={13} className="animate-spin" /> : <Syringe size={13} />} Add</button></div>
            </form>
          </Card>
          <div className="space-y-2">{(record?.vaccinations ?? []).map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3">
              <div><p className="font-semibold text-navy">{v.vaccineName}</p><p className="text-xs text-muted">Given: {fmt(v.date)}{v.nextDue ? ` · Next due: ${fmt(v.nextDue)}` : ""}</p></div>
            </div>
          ))}</div>
        </div>
      )}
    </div>
  );
}
