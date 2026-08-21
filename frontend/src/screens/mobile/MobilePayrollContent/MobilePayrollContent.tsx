"use client";

/**
 * MobilePayrollContent — bespoke mobile view for the Payroll screen.
 *
 * Every field/action traces back to PayrollContent.tsx (the real desktop
 * component) and the real /api/payroll endpoints — same saveSalary(),
 * generatePayslip(), updateStatus(), downloadSlip() logic. No prior mobile
 * work existed for this screen at all (no `.mobileOnly` sheet to port).
 *
 * Deviations from the Stitch mockup (mobile_payroll_scholarsphere_pro):
 *   - "Exceptions" KPI + "Missing bank details" alert card have no backing
 *     field anywhere (Staff has no bank-details model) — omitted. Real KPI
 *     grid maps to the actual 4: Staff on Payroll, {month}'s Net Pay Total,
 *     Draft Payslips, Paid This Month (+progress).
 *   - "Department: All" in the period card — Staff has no department field
 *     (only roleTitle/staffCategory) — omitted; kept the real month picker.
 *   - Single "Run Payroll" bulk CTA doesn't exist — the real flow is
 *     per-staff "Generate Payslip" (Setup tab), matching desktop exactly.
 *     "Export Payslips" has no handler in PayrollContent.tsx either — omitted.
 *   - Payslip status badges use the real 3 statuses (draft/approved/paid),
 *     not the mockup's extra "Exceptions" state.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Wallet, Banknote, CheckCircle, CheckCircle2, Search, Download, Plus, Lock,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { currency } from "@backend/utils";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import { initials, currentMonthStr, downloadSlip } from "@/screens/desktop/PayrollScreen/PayrollContent";
import type { PayrollContentProps, PayslipRow } from "@/screens/desktop/PayrollScreen/PayrollContent";
import styles from "./MobilePayrollContent.module.css";

export function MobilePayrollContent({ staffList, initialPayslips, schoolName }: PayrollContentProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [payslips] = useState<PayslipRow[]>(initialPayslips);
  const [tab, setTab] = useState<"payslips" | "setup">("payslips");
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [salaryForm, setSalaryForm] = useState<Record<string, { basic: string; allow: string; deduct: string; from: string }>>({});
  const [genMonth, setGenMonth] = useState(currentMonthStr());

  function notify(msg: string, ok = true) { showToast(msg, ok ? "success" : "error"); }

  async function saveSalary(staffId: string) {
    const f = salaryForm[staffId];
    if (!f) return;
    setBusy(`salary-${staffId}`);
    try {
      const res = await fetch(`/api/payroll/salaries/${staffId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ basicSalary: parseFloat(f.basic), allowances: parseFloat(f.allow || "0"), deductions: parseFloat(f.deduct || "0"), effectiveFrom: new Date(f.from).toISOString() }),
      });
      if (!res.ok) throw new Error("Failed");
      notify("Salary saved");
      router.refresh();
    } catch {
      notify("Failed to save salary", false);
    } finally {
      setBusy(null);
    }
  }

  async function generatePayslip(staffId: string) {
    setBusy(`gen-${staffId}`);
    try {
      const res = await fetch(`/api/payroll/salaries/${staffId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-payslip", month: genMonth }),
      });
      if (!res.ok) throw new Error("Failed");
      notify("Payslip generated");
      router.refresh();
    } catch {
      notify("Failed to generate payslip", false);
    } finally {
      setBusy(null);
    }
  }

  async function updateStatus(id: string, status: string) {
    setBusy(`status-${id}`);
    try {
      const res = await fetch(`/api/payroll/payslips/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      notify(`Payslip ${status}`);
      router.refresh();
    } catch {
      notify("Failed to update payslip", false);
    } finally {
      setBusy(null);
    }
  }

  const staffWithSalary = staffList.filter((s) => s.salary).length;
  const draftCount = payslips.filter((p) => p.status === "draft").length;
  const netPayThisMonth = payslips.filter((p) => p.month === genMonth).reduce((s, p) => s + Number(p.netPay), 0);
  const paidThisMonthCount = payslips.filter((p) => p.status === "paid" && p.month === genMonth).length;
  const paidPct = staffWithSalary > 0 ? Math.min(100, Math.round((paidThisMonthCount / staffWithSalary) * 100)) : 0;

  const filteredPayslips = useMemo(() => payslips.filter((p) =>
    (statusFilter === "" || p.status === statusFilter) &&
    (search === "" || `${p.staff.firstName} ${p.staff.lastName}`.toLowerCase().includes(search.toLowerCase()) || p.month.includes(search))
  ), [payslips, statusFilter, search]);

  const filteredStaff = useMemo(() => {
    if (!search) return staffList;
    const q = search.toLowerCase();
    return staffList.filter((s) => `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.staffNo.toLowerCase().includes(q) || s.roleTitle.toLowerCase().includes(q));
  }, [staffList, search]);

  return (
    <div className={styles.root}>
      <div className={styles.securityChip}><Lock size={13} /> Payroll access restricted</div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Staff on Payroll</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValue}>{staffWithSalary}</strong><Users size={18} className={styles.kpiIcon} /></div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>{genMonth}&apos;s Net Pay</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValueSm}>{currency(netPayThisMonth)}</strong><Wallet size={18} className={styles.kpiIcon} /></div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Draft Payslips</span>
          <div className={styles.kpiBottom}><strong className={draftCount > 0 ? styles.kpiValueWarn : styles.kpiValue}>{draftCount}</strong></div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Paid This Month</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValue}>{paidThisMonthCount}</strong><CheckCircle size={18} className={styles.kpiIcon} /></div>
        </div>
      </div>

      <div className={styles.periodCard}>
        <span className={styles.periodLabel}>Period</span>
        <input className={styles.periodInput} type="month" value={genMonth} onChange={(e) => setGenMonth(e.target.value)} />
        <div className={styles.progressWrap}>
          <span>Paid progress</span>
          <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${paidPct}%` }} /></div>
        </div>
      </div>

      <div className={kit.segmented}>
        <button type="button" className={`${kit.segBtn} ${tab === "payslips" ? kit.segBtnActive : ""}`} onClick={() => setTab("payslips")}>Payslips</button>
        <button type="button" className={`${kit.segBtn} ${tab === "setup" ? kit.segBtnActive : ""}`} onClick={() => setTab("setup")}>Salary Setup</button>
      </div>

      <label className={kit.searchWrap}>
        <Search size={16} className={kit.searchIcon} />
        <input className={`${kit.input} ${kit.searchInput}`} placeholder={tab === "payslips" ? "Search staff name or month" : "Search staff by name, ID, or role"} value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>

      {tab === "payslips" ? (
        <>
          <div className={styles.chipRow}>
            {[["", "All Status"], ["draft", "Draft"], ["approved", "Approved"], ["paid", "Paid"]].map(([v, l]) => (
              <button key={v} type="button" className={`${styles.chip} ${statusFilter === v ? styles.chipActive : ""}`} onClick={() => setStatusFilter(v)}>{l}</button>
            ))}
          </div>

          <div className={styles.list}>
            {filteredPayslips.length === 0 ? (
              <p className={kit.emptyText}>{payslips.length === 0 ? "No payslips yet. Generate from Salary Setup." : "No payslips match your search."}</p>
            ) : filteredPayslips.map((p) => {
              const isOpen = openId === p.id;
              return (
                <article key={p.id} className={styles.card}>
                  <button type="button" className={styles.cardHeader} onClick={() => setOpenId(isOpen ? null : p.id)}>
                    <span className={kit.pickAvatar}>{initials(p.staff.firstName, p.staff.lastName)}</span>
                    <div className={styles.cardHeaderText}>
                      <span className={styles.staffName}>{p.staff.firstName} {p.staff.lastName}</span>
                      <span className={styles.staffMeta}>{p.staff.roleTitle} · {p.month}</span>
                    </div>
                    <div className={styles.cardHeaderRight}>
                      <span className={styles.netAmount}>{currency(Number(p.netPay))}</span>
                      <span className={`${styles.statusPill} ${styles[`status_${p.status}`]}`}>{p.status}</span>
                    </div>
                    {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>

                  {isOpen && (
                    <div className={styles.cardDetail}>
                      <div className={styles.breakdownRow}><span>Basic Salary</span><strong>{Number(p.basicSalary).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                      <div className={styles.breakdownRow}><span>Allowances</span><strong>{Number(p.allowances).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                      <div className={styles.breakdownRow}><span>Deductions</span><strong className={styles.deductVal}>- {Number(p.deductions).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                      <div className={styles.breakdownRowTotal}><span>Net Payable</span><strong>{currency(Number(p.netPay))}</strong></div>

                      <div className={styles.actionRow}>
                        <button type="button" className={styles.actionBtn} onClick={() => downloadSlip(p, schoolName)}><Download size={13} /> Slip</button>
                        {p.status === "draft" && (
                          <button type="button" className={styles.actionBtnPrimary} disabled={!!busy} onClick={() => updateStatus(p.id, "approved")}>Approve</button>
                        )}
                        {p.status === "approved" && (
                          <button type="button" className={styles.actionBtnPrimary} disabled={!!busy} onClick={() => updateStatus(p.id, "paid")}><CheckCircle2 size={13} /> Mark Paid</button>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <div className={styles.list}>
          {filteredStaff.length === 0 && <p className={kit.emptyText}>No staff match your search.</p>}
          {filteredStaff.map((s) => {
            const f = salaryForm[s.id] ?? { basic: String(s.salary?.basicSalary ?? ""), allow: String(s.salary?.allowances ?? "0"), deduct: String(s.salary?.deductions ?? "0"), from: "" };
            return (
              <article key={s.id} className={styles.setupCard}>
                <div className={styles.setupTop}>
                  <span className={kit.pickAvatar}>{initials(s.firstName, s.lastName)}</span>
                  <div className={styles.cardHeaderText}>
                    <span className={styles.staffName}>{s.firstName} {s.lastName}</span>
                    <span className={styles.staffMeta}>{s.roleTitle} · {s.staffNo}</span>
                  </div>
                  {s.salary && <span className={styles.moRate}>{currency(Number(s.salary.basicSalary))}/mo</span>}
                </div>
                <div className={kit.fieldRow}>
                  <div className={kit.field}>
                    <label>Basic (GHS)</label>
                    <input className={kit.input} type="number" placeholder="0.00" value={f.basic} onChange={(e) => setSalaryForm({ ...salaryForm, [s.id]: { ...f, basic: e.target.value } })} />
                  </div>
                  <div className={kit.field}>
                    <label>Allowances</label>
                    <input className={kit.input} type="number" placeholder="0.00" value={f.allow} onChange={(e) => setSalaryForm({ ...salaryForm, [s.id]: { ...f, allow: e.target.value } })} />
                  </div>
                </div>
                <div className={kit.fieldRow}>
                  <div className={kit.field}>
                    <label>Deductions</label>
                    <input className={kit.input} type="number" placeholder="0.00" value={f.deduct} onChange={(e) => setSalaryForm({ ...salaryForm, [s.id]: { ...f, deduct: e.target.value } })} />
                  </div>
                  <div className={kit.field}>
                    <label>Effective From</label>
                    <input className={kit.input} type="date" value={f.from} onChange={(e) => setSalaryForm({ ...salaryForm, [s.id]: { ...f, from: e.target.value } })} />
                  </div>
                </div>
                <div className={styles.actionRow}>
                  <button type="button" className={styles.actionBtn} disabled={!!busy || !f.basic || !f.from} onClick={() => saveSalary(s.id)}>
                    <Banknote size={13} /> Save Salary
                  </button>
                  {s.salary && (
                    <button type="button" className={styles.actionBtnPrimary} disabled={!!busy} onClick={() => generatePayslip(s.id)}>
                      <Plus size={13} /> Generate {genMonth}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
