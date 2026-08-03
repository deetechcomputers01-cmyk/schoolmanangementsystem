"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Wallet, Clock, CheckCircle, CheckCircle2, Banknote, Search, ChevronDown, Download, X, Plus,
} from "lucide-react";
import { currency } from "@backend/utils";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import styles from "./PayrollScreen.module.css";

type Num = { toString(): string } | number | string;

interface StaffRow {
  id: string; firstName: string; lastName: string; roleTitle: string; staffNo: string;
  salary: { id: string; basicSalary: Num; allowances: Num; deductions: Num } | null;
  payslips: { id: string; month: string; netPay: Num; status: string }[];
}
interface PayslipRow {
  id: string; month: string; basicSalary: Num; allowances: Num;
  deductions: Num; netPay: Num; status: string; paidAt: Date | string | null;
  staff: { firstName: string; lastName: string; roleTitle: string; staffNo: string };
}

interface Props {
  staffList: StaffRow[];
  initialPayslips: PayslipRow[];
}

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function currentMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function downloadSlip(p: PayslipRow) {
  const lines = [
    `ScholarSphere — Payslip`,
    `Staff: ${p.staff.firstName} ${p.staff.lastName} (${p.staff.staffNo})`,
    `Role: ${p.staff.roleTitle}`,
    `Month: ${p.month}`,
    ``,
    `Basic Salary:  ${currency(Number(p.basicSalary))}`,
    `Allowances:    ${currency(Number(p.allowances))}`,
    `Deductions:    -${currency(Number(p.deductions))}`,
    `--------------------------------`,
    `Net Pay:       ${currency(Number(p.netPay))}`,
    ``,
    `Status: ${p.status.toUpperCase()}`,
    p.paidAt ? `Paid at: ${new Date(p.paidAt).toLocaleString("en-GB")}` : "",
  ].filter(Boolean);
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `payslip-${p.staff.staffNo}-${p.month}.txt`; a.click();
  URL.revokeObjectURL(url);
}

export function PayrollContent({ staffList, initialPayslips }: Props) {
  const router = useRouter();
  const [payslips] = useState<PayslipRow[]>(initialPayslips);
  const [tab, setTab] = useState<"payslips" | "setup">("payslips");
  const [busy, setBusy] = useState<string | null>(null);
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [salaryForm, setSalaryForm] = useState<Record<string, { basic: string; allow: string; deduct: string; from: string }>>({});
  const [genMonth, setGenMonth] = useState(currentMonthStr());

  function notify(msg: string, ok = true) { showToast(msg, ok ? "success" : "error"); }

  async function saveSalary(staffId: string) {
    const f = salaryForm[staffId];
    if (!f) return;
    setBusy(`salary-${staffId}`);
    const res = await fetch(`/api/payroll/salaries/${staffId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ basicSalary: parseFloat(f.basic), allowances: parseFloat(f.allow || "0"), deductions: parseFloat(f.deduct || "0"), effectiveFrom: new Date(f.from).toISOString() }),
    });
    setBusy(null);
    if (res.ok) { notify("Salary saved"); router.refresh(); } else notify("Failed to save salary", false);
  }

  async function generatePayslip(staffId: string) {
    setBusy(`gen-${staffId}`);
    const res = await fetch(`/api/payroll/salaries/${staffId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate-payslip", month: genMonth }),
    });
    setBusy(null);
    if (res.ok) { notify("Payslip generated"); router.refresh(); }
    else { const j = await res.json().catch(() => ({})); notify(j.error ?? "Failed", false); }
  }

  async function updateStatus(id: string, status: string) {
    setBusy(`status-${id}`);
    const res = await fetch(`/api/payroll/payslips/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    if (res.ok) { notify(`Payslip ${status}`); router.refresh(); } else notify("Failed", false);
  }

  const totalPayroll = staffList.filter((s) => s.salary).reduce((sum, s) => sum + Number(s.salary!.basicSalary) + Number(s.salary!.allowances), 0);
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

  const selected = payslips.find((p) => p.id === selectedId) ?? null;

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Payroll Management</h1>
          <p className={styles.subtitle}>Manage staff salaries, deductions, and monthly payouts.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnPrimary} onClick={() => setTab("setup")}>
            <Wallet size={15} /> Salary Setup
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabelRow}><span className={styles.statLabel}>Total Staff on Payroll</span><Users size={16} color="var(--clr-app-muted)" /></div>
          <span className={styles.statValue}>{staffWithSalary}</span>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabelRow}><span className={styles.statLabel}>{genMonth}&apos;s Net Pay Total</span><Wallet size={16} color="var(--clr-app-accent)" /></div>
          <span className={`${styles.statValue} ${styles.statValueAccent}`}>{currency(netPayThisMonth)}</span>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabelRow}>
            <span className={styles.statLabel}>Draft Payslips</span>
            {draftCount > 0 && <span className={styles.statActionTag}>Action Required</span>}
          </div>
          <span className={styles.statValue}>{draftCount}</span>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabelRow}><span className={styles.statLabel}>Paid This Month</span><CheckCircle size={16} color="var(--clr-success)" /></div>
          <div className={styles.statValueRow}>
            <span className={styles.statValue}>{paidThisMonthCount}</span>
            <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${paidPct}%` }} /></div>
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === "payslips" ? styles.tabActive : ""}`} onClick={() => setTab("payslips")}>Payslips</button>
        <button className={`${styles.tab} ${tab === "setup" ? styles.tabActive : ""}`} onClick={() => setTab("setup")}>Salary Setup</button>
      </div>

      {tab === "payslips" && (
        <div className={styles.body}>
          <div className={styles.tablePanel}>
            <div className={styles.filterBar}>
              <div className={styles.selectWrap}>
                <select className={styles.select} value={genMonth} onChange={(e) => setGenMonth(e.target.value)}>
                  {Array.from(new Set([genMonth, ...payslips.map((p) => p.month)])).sort().reverse().map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown size={12} className={styles.selectChevron} />
              </div>
              <div className={styles.selectWrap}>
                <select className={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                </select>
                <ChevronDown size={12} className={styles.selectChevron} />
              </div>
              <div className={styles.searchWrap}>
                <Search size={14} className={styles.searchIcon} />
                <input className={styles.searchInput} placeholder="Search staff name or ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>

            {filteredPayslips.length === 0 ? (
              <div className={styles.emptyState}><Banknote size={32} className={styles.emptyIcon} /><p>{payslips.length === 0 ? "No payslips yet. Generate from Salary Setup." : "No payslips match your search."}</p></div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Staff Member</th>
                      <th className={styles.right}>Basic</th>
                      <th className={styles.right}>Allowances</th>
                      <th className={styles.right}>Deductions</th>
                      <th className={`${styles.right} ${styles.netCol}`}>Net Pay (GHS)</th>
                      <th className={styles.center}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayslips.map((p) => (
                      <tr key={p.id} className={`${styles.dataRow} ${p.id === selectedId ? styles.dataRowSelected : ""}`} onClick={() => setSelectedId(p.id)}>
                        <td>
                          <div className={styles.staffCell}>
                            <div className={styles.avatar}>{initials(p.staff.firstName, p.staff.lastName)}</div>
                            <div>
                              <div className={styles.staffName}>{p.staff.firstName} {p.staff.lastName}</div>
                              <div className={styles.staffRole}>{p.staff.roleTitle}</div>
                            </div>
                          </div>
                        </td>
                        <td className={`${styles.right} ${styles.tdMono}`}>{Number(p.basicSalary).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className={`${styles.right} ${styles.allowanceCell}`}>{Number(p.allowances).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className={`${styles.right} ${styles.deductionCell}`}>{Number(p.deductions).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className={`${styles.right} ${styles.netCell}`}>{Number(p.netPay).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className={styles.center}>
                          <span className={`${styles.badge} ${p.status === "paid" ? styles.badgePaid : p.status === "approved" ? styles.badgeApproved : styles.badgeDraft}`}>
                            <span className={styles.badgeDot} />{p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {filteredPayslips.length > 0 && <div className={styles.footerNote}>Showing {filteredPayslips.length} of {payslips.length} payslips</div>}
          </div>

          <aside className={styles.detailPanel}>
            <div className={styles.detailHeader}>
              <span className={styles.detailTitle}>Salary Structure</span>
              {selected && <button className={styles.detailClose} onClick={() => setSelectedId(null)}><X size={16} /></button>}
            </div>
            {selected ? (
              <>
                <div className={styles.detailBody}>
                  <div className={styles.detailUserRow}>
                    <div className={styles.detailAvatar}>{initials(selected.staff.firstName, selected.staff.lastName)}</div>
                    <div>
                      <div className={styles.detailName}>{selected.staff.firstName} {selected.staff.lastName}</div>
                      <div className={styles.detailSub}>{selected.staff.staffNo} · {selected.staff.roleTitle} · {selected.month}</div>
                    </div>
                  </div>

                  <div className={styles.breakdownSection}>
                    <div className={styles.breakdownTitle}>Earnings</div>
                    <div className={styles.breakdownRow}><span className={styles.breakdownLabel}>Basic Salary</span><span className={styles.breakdownValue}>{Number(selected.basicSalary).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                    <div className={styles.breakdownRow}><span className={styles.breakdownLabel}>Allowances</span><span className={styles.breakdownValue}>{Number(selected.allowances).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                    <div className={styles.breakdownRowTotal}><span>Gross Total</span><span>{(Number(selected.basicSalary) + Number(selected.allowances)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                  </div>

                  <div className={styles.breakdownSection}>
                    <div className={styles.breakdownTitle}>Deductions</div>
                    <div className={styles.breakdownRow}><span className={styles.breakdownLabel}>Total Deductions</span><span className={`${styles.breakdownValue} ${styles.breakdownValueError}`}>- {Number(selected.deductions).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                  </div>
                </div>
                <div className={styles.detailFooter}>
                  <div className={styles.netPayableRow}>
                    <span className={styles.netPayableLabel}>Net Payable</span>
                    <span className={styles.netPayableValue}>{currency(Number(selected.netPay))}</span>
                  </div>
                  <div className={styles.detailActions}>
                    <button className={styles.btnOutline} onClick={() => downloadSlip(selected)}><Download size={13} /> Slip</button>
                    {selected.status === "draft" && (
                      <button className={`${styles.btnOutline} ${styles.btnApproveOutline}`} disabled={!!busy} onClick={() => updateStatus(selected.id, "approved")}>Approve</button>
                    )}
                    {selected.status === "approved" && (
                      <button className={`${styles.btnOutline} ${styles.btnPaidOutline}`} disabled={!!busy} onClick={() => updateStatus(selected.id, "paid")}><CheckCircle2 size={13} /> Mark Paid</button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className={styles.noSelection}>
                <Banknote size={28} color="var(--clr-app-border)" />
                <p>Select a payslip to view its salary structure.</p>
              </div>
            )}
          </aside>
        </div>
      )}

      {tab === "setup" && (
        <div className={styles.tablePanel}>
          <div className={styles.filterBar}>
            <div className={styles.searchWrap}>
              <Search size={14} className={styles.searchIcon} />
              <input className={styles.searchInput} placeholder="Search staff by name, ID, or role…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <span className={styles.monthLabel}>Generate for:</span>
            <input type="month" value={genMonth} onChange={(e) => setGenMonth(e.target.value)} className={styles.formInput} style={{ width: 160 }} />
          </div>

          <div className={styles.staffList}>
            {filteredStaff.length === 0 && <div className={styles.emptyState}>No staff match your search.</div>}
            {filteredStaff.map((s) => {
              const f = salaryForm[s.id] ?? { basic: String(s.salary?.basicSalary ?? ""), allow: String(s.salary?.allowances ?? "0"), deduct: String(s.salary?.deductions ?? "0"), from: "" };
              return (
                <div key={s.id} className={styles.staffCard}>
                  <div className={styles.staffCardTop}>
                    <div className={styles.avatar}>{initials(s.firstName, s.lastName)}</div>
                    <div>
                      <div className={styles.staffName}>{s.firstName} {s.lastName}</div>
                      <div className={styles.staffRole}>{s.roleTitle} · {s.staffNo}</div>
                    </div>
                    {s.salary && <span className={styles.staffCardMoRate}>{currency(Number(s.salary.basicSalary))}/mo</span>}
                  </div>
                  <div className={styles.salaryFormGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Basic (GHS)</label>
                      <input className={styles.formInput} type="number" placeholder="0.00" value={f.basic} onChange={(e) => setSalaryForm({ ...salaryForm, [s.id]: { ...f, basic: e.target.value } })} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Allowances</label>
                      <input className={styles.formInput} type="number" placeholder="0.00" value={f.allow} onChange={(e) => setSalaryForm({ ...salaryForm, [s.id]: { ...f, allow: e.target.value } })} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Deductions</label>
                      <input className={styles.formInput} type="number" placeholder="0.00" value={f.deduct} onChange={(e) => setSalaryForm({ ...salaryForm, [s.id]: { ...f, deduct: e.target.value } })} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Effective From</label>
                      <input className={styles.formInput} type="date" value={f.from} onChange={(e) => setSalaryForm({ ...salaryForm, [s.id]: { ...f, from: e.target.value } })} />
                    </div>
                  </div>
                  <div className={styles.salaryFormActions}>
                    <button className={styles.btnOutline} disabled={!!busy || !f.basic || !f.from} onClick={() => saveSalary(s.id)}>
                      <Banknote size={13} /> Save Salary
                    </button>
                    {s.salary && (
                      <button className={`${styles.btnOutline} ${styles.btnPaidOutline}`} disabled={!!busy} onClick={() => generatePayslip(s.id)}>
                        <Plus size={13} /> Generate {genMonth}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
