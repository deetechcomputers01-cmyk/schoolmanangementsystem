"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  CalendarRange, CheckCircle2, ChevronDown, ChevronUp,
  Loader2, Plus, Star, Trash2
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Term = {
  id: string; name: string;
  startDate: string | Date; endDate: string | Date;
  isCurrent: boolean;
};

type AcademicYear = {
  id: string; name: string;
  startDate: string | Date; endDate: string | Date;
  isCurrent: boolean;
  terms: Term[];
};

type Props = { initialYears: AcademicYear[]; canManage: boolean };

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function termStatus(term: Term): "active" | "upcoming" | "ended" {
  const now = Date.now();
  const s = new Date(term.startDate).getTime();
  const e = new Date(term.endDate).getTime();
  if (now < s) return "upcoming";
  if (now > e) return "ended";
  return "active";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AcademicCalendarClient({ initialYears, canManage }: Props) {
  const [years, setYears]         = useState<AcademicYear[]>(initialYears);
  const [expanded, setExpanded]   = useState<Set<string>>(
    () => new Set(initialYears.filter((y) => y.isCurrent).map((y) => y.id))
  );
  const [busy, setBusy]           = useState<string | null>(null);
  const [flash, setFlash]         = useState<{ msg: string; ok: boolean } | null>(null);
  const [showYearForm, setShowYearForm] = useState(false);
  const [yearForm, setYearForm]   = useState({ name: "", startDate: "", endDate: "" });
  const [showTermFor, setShowTermFor]   = useState<string | null>(null);
  const [termForm, setTermForm]   = useState({ name: "", startDate: "", endDate: "" });

  const notify = (msg: string, ok = true) => {
    setFlash({ msg, ok });
    setTimeout(() => setFlash(null), 3500);
  };

  const reload = async () => {
    const res = await fetch("/api/academic/years");
    if (res.ok) setYears(await res.json());
  };

  // ── Actions ──────────────────────────────────────────────────────────────────

  const createYear = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("create-year");
    const res = await fetch("/api/academic/years", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:      yearForm.name,
        startDate: new Date(yearForm.startDate).toISOString(),
        endDate:   new Date(yearForm.endDate).toISOString()
      })
    });
    setBusy(null);
    if (res.ok) {
      setShowYearForm(false);
      setYearForm({ name: "", startDate: "", endDate: "" });
      notify("Academic year created");
      reload();
    } else {
      notify("Failed to create year", false);
    }
  };

  const activateYear = async (id: string) => {
    setBusy(`year-${id}`);
    const res = await fetch(`/api/academic/years/${id}`, { method: "PATCH" });
    setBusy(null);
    if (res.ok) { notify("Active year updated"); reload(); }
    else notify("Failed to set active year", false);
  };

  const deleteYear = async (id: string) => {
    if (!confirm("Delete this academic year and all its terms?")) return;
    setBusy(`del-year-${id}`);
    const res = await fetch(`/api/academic/years/${id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) { notify("Year deleted"); reload(); }
    else { const j = await res.json(); notify(j.error ?? "Failed to delete", false); }
  };

  const createTerm = async (e: React.FormEvent, yearId: string) => {
    e.preventDefault();
    setBusy(`create-term-${yearId}`);
    const res = await fetch("/api/academic/terms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:           termForm.name,
        academicYearId: yearId,
        startDate:      new Date(termForm.startDate).toISOString(),
        endDate:        new Date(termForm.endDate).toISOString()
      })
    });
    setBusy(null);
    if (res.ok) {
      setShowTermFor(null);
      setTermForm({ name: "", startDate: "", endDate: "" });
      notify("Term added");
      reload();
    } else {
      notify("Failed to add term", false);
    }
  };

  const activateTerm = async (termId: string) => {
    setBusy(`term-${termId}`);
    const res = await fetch(`/api/academic/terms/${termId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setCurrent: true })
    });
    setBusy(null);
    if (res.ok) { notify("Active term updated"); reload(); }
    else notify("Failed to set active term", false);
  };

  const deleteTerm = async (termId: string) => {
    if (!confirm("Delete this term?")) return;
    setBusy(`del-term-${termId}`);
    const res = await fetch(`/api/academic/terms/${termId}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) { notify("Term deleted"); reload(); }
    else { const j = await res.json(); notify(j.error ?? "Failed to delete term", false); }
  };

  const toggle = (id: string) =>
    setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const currentYear = years.find((y) => y.isCurrent);
  const currentTerm = currentYear?.terms.find((t) => t.isCurrent);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Flash notification */}
      {flash && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${flash.ok ? "bg-emerald/10 text-emerald" : "bg-rose-50 text-rose-600"}`}>
          {flash.msg}
        </div>
      )}

      {/* Current context banner */}
      <Card className="mb-6 flex flex-wrap items-center justify-between gap-4 !bg-navy text-white">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/10">
            <CalendarRange size={22} className="text-emerald" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Current Academic Context</p>
            <p className="font-heading text-lg font-bold">
              {currentYear ? currentYear.name : "No active year"}
              {currentTerm ? ` · ${currentTerm.name}` : " · No active term"}
            </p>
            {currentTerm && (
              <p className="mt-0.5 text-xs text-slate-400">
                {fmt(currentTerm.startDate)} – {fmt(currentTerm.endDate)}
              </p>
            )}
          </div>
        </div>
        {canManage && (
          <button
            onClick={() => setShowYearForm(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald/80"
          >
            <Plus size={16} /> New Academic Year
          </button>
        )}
      </Card>

      {/* Create year form */}
      {showYearForm && (
        <Card className="mb-6 border-2 border-emerald/30">
          <h3 className="mb-4 font-heading text-base font-semibold text-navy">New Academic Year</h3>
          <form onSubmit={createYear} className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Year Name</label>
              <input required placeholder="e.g. 2026/2027"
                value={yearForm.name} onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
                className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Start Date</label>
              <input type="date" required
                value={yearForm.startDate} onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })}
                className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">End Date</label>
              <input type="date" required
                value={yearForm.endDate} onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })}
                className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
            <div className="flex items-center gap-3 sm:col-span-3">
              <button type="submit" disabled={!!busy}
                className="flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy/80 disabled:opacity-50">
                {busy === "create-year" ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Create Year
              </button>
              <button type="button" onClick={() => setShowYearForm(false)} className="text-sm text-muted hover:text-navy">Cancel</button>
            </div>
          </form>
        </Card>
      )}

      {/* Empty state */}
      {years.length === 0 && (
        <Card className="py-16 text-center">
          <CalendarRange size={40} className="mx-auto mb-3 text-muted/40" />
          <p className="font-heading text-lg font-semibold text-navy">No academic years yet</p>
          <p className="mt-1 text-sm text-muted">Create your first academic year above to get started.</p>
        </Card>
      )}

      {/* Year accordion list */}
      <div className="grid gap-4">
        {years.map((year) => {
          const open = expanded.has(year.id);
          return (
            <div key={year.id}
              className={`overflow-hidden rounded-2xl border bg-white ${year.isCurrent ? "border-emerald/40 shadow-[0_0_0_3px_rgba(0,108,73,0.07)]" : "border-line"}`}>

              {/* Year header row */}
              <div
                role="button" tabIndex={0}
                onClick={() => toggle(year.id)}
                onKeyDown={(e) => e.key === "Enter" && toggle(year.id)}
                className="flex cursor-pointer items-center justify-between px-6 py-4 transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  {year.isCurrent && <CheckCircle2 size={18} className="shrink-0 text-emerald" />}
                  <div>
                    <p className="font-heading font-semibold text-navy">{year.name}</p>
                    <p className="text-xs text-muted">{fmt(year.startDate)} – {fmt(year.endDate)}</p>
                  </div>
                  {year.isCurrent && <Badge tone="success">Active Year</Badge>}
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {canManage && !year.isCurrent && (
                    <>
                      <button onClick={() => activateYear(year.id)} disabled={!!busy}
                        className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:border-emerald hover:text-emerald disabled:opacity-40">
                        {busy === `year-${year.id}` ? <Loader2 size={12} className="animate-spin" /> : <Star size={12} />}
                        Set Active
                      </button>
                      <button onClick={() => deleteYear(year.id)} disabled={!!busy}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:border-rose-200 hover:text-rose-500 disabled:opacity-40">
                        {busy === `del-year-${year.id}` ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </>
                  )}
                  {open ? <ChevronUp size={18} className="text-muted" /> : <ChevronDown size={18} className="text-muted" />}
                </div>
              </div>

              {/* Terms panel */}
              {open && (
                <div className="border-t border-line px-6 py-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Terms ({year.terms.length})
                    </p>
                    {canManage && (
                      <button
                        onClick={() => { setShowTermFor(year.id); setTermForm({ name: "", startDate: "", endDate: "" }); }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-emerald hover:underline">
                        <Plus size={13} /> Add Term
                      </button>
                    )}
                  </div>

                  {/* Inline add-term form */}
                  {showTermFor === year.id && (
                    <form onSubmit={(e) => createTerm(e, year.id)}
                      className="mb-4 grid gap-3 rounded-xl border border-emerald/20 bg-emerald/5 p-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-muted">Term Name</label>
                        <input required placeholder="e.g. Term 1"
                          value={termForm.name} onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
                          className="focus-ring w-full rounded-lg border border-line bg-white px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-muted">Start Date</label>
                        <input type="date" required
                          value={termForm.startDate} onChange={(e) => setTermForm({ ...termForm, startDate: e.target.value })}
                          className="focus-ring w-full rounded-lg border border-line bg-white px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-muted">End Date</label>
                        <input type="date" required
                          value={termForm.endDate} onChange={(e) => setTermForm({ ...termForm, endDate: e.target.value })}
                          className="focus-ring w-full rounded-lg border border-line bg-white px-3 py-2 text-sm" />
                      </div>
                      <div className="flex items-center gap-3 sm:col-span-3">
                        <button type="submit" disabled={!!busy}
                          className="flex items-center gap-2 rounded-lg bg-emerald px-4 py-2 text-xs font-semibold text-white hover:bg-emerald/80 disabled:opacity-50">
                          {busy === `create-term-${year.id}` ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                          Save Term
                        </button>
                        <button type="button" onClick={() => setShowTermFor(null)} className="text-xs text-muted hover:text-navy">Cancel</button>
                      </div>
                    </form>
                  )}

                  {year.terms.length === 0 ? (
                    <p className="rounded-xl bg-slate-50 py-6 text-center text-sm text-muted">
                      No terms yet — add one above.
                    </p>
                  ) : (
                    <div className="grid gap-2">
                      {year.terms.map((term) => {
                        const status = termStatus(term);
                        return (
                          <div key={term.id}
                            className={`flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 ${term.isCurrent ? "bg-emerald/5 ring-1 ring-emerald/20" : "bg-slate-50"}`}>
                            <div className="flex items-center gap-3">
                              {term.isCurrent && <CheckCircle2 size={15} className="text-emerald" />}
                              <div>
                                <p className="font-heading text-sm font-semibold text-navy">{term.name}</p>
                                <p className="text-xs text-muted">{fmt(term.startDate)} – {fmt(term.endDate)}</p>
                              </div>
                              <Badge tone={term.isCurrent ? "success" : status === "upcoming" ? "warning" : "neutral"}>
                                {term.isCurrent ? "Active" : status}
                              </Badge>
                            </div>
                            {canManage && (
                              <div className="flex items-center gap-2">
                                {!term.isCurrent && (
                                  <button onClick={() => activateTerm(term.id)} disabled={!!busy}
                                    className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:border-emerald hover:text-emerald disabled:opacity-40">
                                    {busy === `term-${term.id}` ? <Loader2 size={12} className="animate-spin" /> : <Star size={12} />}
                                    Set Active
                                  </button>
                                )}
                                <button onClick={() => deleteTerm(term.id)} disabled={!!busy}
                                  className="grid h-7 w-7 place-items-center rounded-lg border border-line text-muted hover:border-rose-200 hover:text-rose-500 disabled:opacity-40">
                                  {busy === `del-term-${term.id}` ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={13} />}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
