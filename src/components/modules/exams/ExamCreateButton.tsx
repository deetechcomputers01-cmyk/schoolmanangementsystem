"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";

type Props = {
  classes:  { id: string; name: string }[];
  subjects: { id: string; name: string; classId: string; class: { name: string } }[];
  terms:    { id: string; name: string }[];
};

export function ExamCreateButton({ classes, subjects, terms }: Props) {
  const [open, setOpen]     = useState(false);
  const [busy, setBusy]     = useState(false);
  const [classId, setClassId] = useState("");
  const [form, setForm]     = useState({
    title: "", subjectId: "", termId: "", scheduledAt: "", maxScore: "100"
  });

  const filteredSubjects = classId
    ? subjects.filter((s) => s.classId === classId)
    : subjects;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title:       form.title,
        subjectId:   form.subjectId,
        classId,
        termId:      form.termId || undefined,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        maxScore:    parseFloat(form.maxScore)
      })
    });
    setBusy(false);
    if (res.ok) { setOpen(false); window.location.reload(); }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/80"
      >
        <Plus size={16} /> New Exam
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-navy">Schedule New Exam</h2>
              <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit} className="grid gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Exam Title</label>
                <input required placeholder="e.g. Mid-Term Mathematics Exam"
                  value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Class</label>
                  <select required value={classId} onChange={(e) => { setClassId(e.target.value); setForm({ ...form, subjectId: "" }); }}
                    className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm">
                    <option value="">Select class</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Subject</label>
                  <select required value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                    className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" disabled={!classId}>
                    <option value="">Select subject</option>
                    {filteredSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Term (optional)</label>
                  <select value={form.termId} onChange={(e) => setForm({ ...form, termId: e.target.value })}
                    className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm">
                    <option value="">No term</option>
                    {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Max Score</label>
                  <input required type="number" min="1" max="1000"
                    value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
                    className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Exam Date</label>
                <input required type="datetime-local"
                  value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button type="submit" disabled={busy}
                  className="flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy/80 disabled:opacity-50">
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Schedule Exam
                </button>
                <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted hover:text-navy">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
