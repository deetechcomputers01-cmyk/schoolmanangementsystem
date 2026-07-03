"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { currency } from "@/lib/utils";
import { Banknote, CheckCircle2, Loader2, Plus } from "lucide-react";

type Num = { toString(): string } | number | string;

type Staff = {
  id: string; firstName: string; lastName: string; roleTitle: string; staffNo: string;
  salary: { id: string; basicSalary: Num; allowances: Num; deductions: Num } | null;
  payslips: { id: string; month: string; netPay: Num; status: string }[];
};

type Payslip = {
  id: string; month: string; basicSalary: Num; allowances: Num;
  deductions: Num; netPay: Num; status: string; paidAt: Date | string | null;
  staff: { firstName: string; lastName: string; roleTitle: string };
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-navy", approved: "bg-amber/10 text-amber", paid: "bg-emerald/10 text-emerald"
};

export function PayrollClient({ staffList, initialPayslips }: { staffList: Staff[]; initialPayslips: Payslip[] }) {
  const [payslips, setPayslips] = useState<Payslip[]>(initialPayslips);
  const [tab, setTab]           = useState<"staff" | "payslips">("staff");
  const [busy, setBusy]         = useState<string | null>(null);
  const [flash, setFlash]       = useState<{ msg: string; ok: boolean } | null>(null);
  const [salaryForm, setSalaryForm] = useState<Record<string, { basic: string; allow: string; deduct: string; from: string }>>({});
  const [genMonth, setGenMonth] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const notify = (msg: string, ok = true) => { setFlash({ msg, ok }); setTimeout(() => setFlash(null), 3000); };
  const reloadPayslips = async () => { const r = await fetch("/api/payroll/payslips/all" ).catch(() => null); /* noop — page will reload */ };

  const saveSalary = async (staffId: string) => {
    const f = salaryForm[staffId];
    if (!f) return;
    setBusy(`salary-${staffId}`);
    const res = await fetch(`/api/payroll/salaries/${staffId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ basicSalary: parseFloat(f.basic), allowances: parseFloat(f.allow || "0"), deductions: parseFloat(f.deduct || "0"), effectiveFrom: new Date(f.from).toISOString() })
    });
    setBusy(null);
    if (res.ok) { notify("Salary saved"); window.location.reload(); }
    else notify("Failed to save salary", false);
  };

  const generatePayslip = async (staffId: string) => {
    setBusy(`gen-${staffId}`);
    const res = await fetch(`/api/payroll/salaries/${staffId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate-payslip", month: genMonth })
    });
    setBusy(null);
    if (res.ok) { notify("Payslip generated"); window.location.reload(); }
    else { const j = await res.json(); notify(j.error ?? "Failed", false); }
  };

  const updateStatus = async (id: string, status: string) => {
    setBusy(`status-${id}`);
    const res = await fetch(`/api/payroll/payslips/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    setBusy(null);
    if (res.ok) { notify(`Payslip ${status}`); window.location.reload(); }
    else notify("Failed", false);
  };

  return (
    <div>
      {flash && <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${flash.ok ? "bg-emerald/10 text-emerald" : "bg-rose-50 text-rose-600"}`}>{flash.msg}</div>}

      {/* Tabs */}
      <div className="mb-6 flex gap-3">
        {(["staff", "payslips"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-xl px-5 py-2 text-sm font-semibold capitalize transition ${tab === t ? "bg-navy text-white" : "border border-line text-muted hover:border-navy hover:text-navy"}`}>
            {t === "staff" ? "Salary Setup" : "Payslips"}
          </button>
        ))}
        {tab === "payslips" && (
          <div className="ml-auto flex items-center gap-2">
            <label className="text-xs font-semibold text-muted">Month:</label>
            <input type="month" value={genMonth} onChange={(e) => setGenMonth(e.target.value)}
              className="focus-ring rounded-lg border border-line px-3 py-1.5 text-sm" />
          </div>
        )}
      </div>

      {/* Salary Setup tab */}
      {tab === "staff" && (
        <div className="grid gap-4">
          {staffList.map((s) => {
            const f = salaryForm[s.id] ?? { basic: String(s.salary?.basicSalary ?? ""), allow: String(s.salary?.allowances ?? "0"), deduct: String(s.salary?.deductions ?? "0"), from: "" };
            return (
              <Card key={s.id} className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-navy text-sm font-bold text-white">{s.firstName[0]}{s.lastName[0]}</div>
                    <div>
                      <p className="font-heading font-semibold text-navy">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-muted">{s.roleTitle} · {s.staffNo}</p>
                    </div>
                    {s.salary && <span className="ml-auto text-xs font-semibold text-emerald">{currency(Number(s.salary.basicSalary))}/mo</span>}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div><label className="mb-1 block text-xs font-semibold text-muted">Basic (GHS)</label>
                      <input type="number" placeholder="0.00" value={f.basic}
                        onChange={(e) => setSalaryForm({ ...salaryForm, [s.id]: { ...f, basic: e.target.value } })}
                        className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
                    <div><label className="mb-1 block text-xs font-semibold text-muted">Allowances</label>
                      <input type="number" placeholder="0.00" value={f.allow}
                        onChange={(e) => setSalaryForm({ ...salaryForm, [s.id]: { ...f, allow: e.target.value } })}
                        className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
                    <div><label className="mb-1 block text-xs font-semibold text-muted">Deductions</label>
                      <input type="number" placeholder="0.00" value={f.deduct}
                        onChange={(e) => setSalaryForm({ ...salaryForm, [s.id]: { ...f, deduct: e.target.value } })}
                        className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
                    <div><label className="mb-1 block text-xs font-semibold text-muted">Effective From</label>
                      <input type="date" value={f.from}
                        onChange={(e) => setSalaryForm({ ...salaryForm, [s.id]: { ...f, from: e.target.value } })}
                        className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
                  </div>
                </div>
                <div className="flex flex-col justify-end gap-2 sm:min-w-[140px]">
                  <button onClick={() => saveSalary(s.id)} disabled={!!busy || !f.basic || !f.from}
                    className="flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy/80 disabled:opacity-40">
                    {busy === `salary-${s.id}` ? <Loader2 size={12} className="animate-spin" /> : <Banknote size={12} />} Save Salary
                  </button>
                  {s.salary && (
                    <button onClick={() => generatePayslip(s.id)} disabled={!!busy}
                      className="flex items-center justify-center gap-2 rounded-xl border border-emerald/40 px-4 py-2 text-xs font-semibold text-emerald hover:bg-emerald/10 disabled:opacity-40">
                      {busy === `gen-${s.id}` ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Gen {genMonth}
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Payslips tab */}
      {tab === "payslips" && (
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Staff</th>
                <th className="px-5 py-3">Month</th>
                <th className="px-5 py-3 text-right">Basic</th>
                <th className="px-5 py-3 text-right">Allowances</th>
                <th className="px-5 py-3 text-right">Deductions</th>
                <th className="px-5 py-3 text-right">Net Pay</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {payslips.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-muted">No payslips yet. Generate from the Salary Setup tab.</td></tr>
              )}
              {payslips.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3"><p className="font-semibold text-navy">{p.staff.firstName} {p.staff.lastName}</p><p className="text-xs text-muted">{p.staff.roleTitle}</p></td>
                  <td className="font-data px-5 py-3 text-muted">{p.month}</td>
                  <td className="font-data px-5 py-3 text-right">{currency(Number(p.basicSalary))}</td>
                  <td className="font-data px-5 py-3 text-right text-emerald">+{currency(Number(p.allowances))}</td>
                  <td className="font-data px-5 py-3 text-right text-rose-500">-{currency(Number(p.deductions))}</td>
                  <td className="font-data px-5 py-3 text-right font-bold text-navy">{currency(Number(p.netPay))}</td>
                  <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${STATUS_COLORS[p.status]}`}>{p.status}</span></td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      {p.status === "draft" && <button onClick={() => updateStatus(p.id, "approved")} disabled={!!busy} className="rounded-lg border border-amber/40 px-2.5 py-1.5 text-xs font-semibold text-amber hover:bg-amber/10 disabled:opacity-40">Approve</button>}
                      {p.status === "approved" && <button onClick={() => updateStatus(p.id, "paid")} disabled={!!busy} className="rounded-lg border border-emerald/40 px-2.5 py-1.5 text-xs font-semibold text-emerald hover:bg-emerald/10 disabled:opacity-40"><CheckCircle2 size={11} className="inline mr-1" />Mark Paid</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
