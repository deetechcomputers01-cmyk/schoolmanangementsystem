"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, MoreVertical, Bell, AlertTriangle,
  CheckCircle, Banknote, Smartphone, Building2,
  CreditCard, X,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import styles from "./AccountantPortalScreen.module.css";

type Payment = {
  id: string;
  receiptNo: string;
  studentName: string;
  studentInitials: string;
  className: string;
  amount: number;
  method: string;
  status: string;
  date: string;
};

export type AccountantPortalProps = {
  feesExpected: number;
  collected: number;
  outstanding: number;
  paymentsToday: number;
  overdueStudents: number;
  cashBreakdown: { method: string; amount: number }[];
  recentPayments: Payment[];
};

function fmtGHS(n: number) {
  return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 0 })}`;
}

function fmtAmt(n: number) {
  return n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function AccountantPortalContent(props: AccountantPortalProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [methodFilter,    setMethodFilter]    = useState("");
  const [statusFilter,    setStatusFilter]    = useState("");
  const [classFilter,     setClassFilter]     = useState("");
  const [showPayModal,    setShowPayModal]    = useState(false);
  const [payFeeRecordId,  setPayFeeRecordId]  = useState("");
  const [payAmount,       setPayAmount]       = useState("");
  const [payMethod,       setPayMethod]       = useState<"cash" | "mobile_money" | "bank_transfer" | "card">("cash");
  const [payReference,    setPayReference]    = useState("");
  const [payLoading,      setPayLoading]      = useState(false);
  const [payError,        setPayError]        = useState<string | null>(null);

  const allPayments: Payment[] = props.recentPayments;

  const uniqueClasses = useMemo(() =>
    [...new Set(allPayments.map(p => p.className).filter(Boolean))].sort(),
    [allPayments]
  );

  const filteredPayments = useMemo(() => allPayments.filter(p => {
    if (methodFilter && p.method !== methodFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    if (classFilter  && p.className !== classFilter) return false;
    return true;
  }), [allPayments, methodFilter, statusFilter, classFilter]);

  const cashMap   = new Map(props.cashBreakdown.map((c) => [c.method, c.amount]));
  const cashAmt   = cashMap.get("cash") ?? 0;
  const momoAmt   = cashMap.get("mobile_money") ?? 0;
  const bankAmt   = cashMap.get("bank_transfer") ?? 0;
  const cardAmt   = cashMap.get("card") ?? 0;
  const totalToday = cashAmt + momoAmt + bankAmt + cardAmt;

  async function submitPayment() {
    if (!payFeeRecordId.trim()) { setPayError("Fee Record ID is required."); return; }
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) { setPayError("Enter a valid amount."); return; }
    if (!payReference.trim()) { setPayError("Reference is required."); return; }
    setPayLoading(true);
    setPayError(null);
    try {
      const res = await fetch("/api/fees/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeRecordId: payFeeRecordId, amount: amt, method: payMethod, reference: payReference }),
      });
      if (res.ok) {
        setShowPayModal(false);
        setPayFeeRecordId(""); setPayAmount(""); setPayReference("");
        showToast("Payment recorded successfully.");
        router.refresh();
      } else {
        const err = await res.json().catch(() => null);
        setPayError(err?.error ?? "Failed to record payment.");
      }
    } catch {
      setPayError("Network error. Please try again.");
    } finally {
      setPayLoading(false);
    }
  }

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.breadcrumb}>
            <span>Portal</span>
            <span className={styles.breadcrumbSep}>›</span>
            <span className={styles.breadcrumbActive}>Accountant</span>
          </div>
          <h1 className={styles.pageTitle}>Accountant Portal</h1>
          <p className={styles.pageSubtitle}>Manage fee records, payments, invoices, arrears, and daily reconciliation</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnPrimary} onClick={() => setShowPayModal(true)}>
            <Plus size={14} /> Record Payment
          </button>
          <button className={styles.btnOutline} onClick={() => router.push("/fees")}>
            Generate Invoice
          </button>
          <button className={styles.kebabBtn} onClick={() => router.push("/fees")}><MoreVertical size={16} /></button>
        </div>
      </div>

      {/* Stats strip */}
      <div className={styles.statsStrip}>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Fees Expected</div>
          <div className={styles.statValue}>{fmtGHS(props.feesExpected)}</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Collected</div>
          <div className={styles.statValueGreen}>{fmtGHS(props.collected)}</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Outstanding</div>
          <div className={styles.statValue}>{fmtGHS(props.outstanding)}</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Payments Today</div>
          <div className={styles.statValue}>{fmtGHS(props.paymentsToday || totalToday)}</div>
        </div>
        <div className={`${styles.statItem} ${styles.statItemError}`}>
          <div className={styles.statLabelError}>Overdue Students</div>
          <div className={styles.statValueError}>
            <AlertTriangle size={16} />
            {props.overdueStudents}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* Left: Daily Cash Summary + Quick Filters */}
        <aside className={styles.leftPanel}>
          <div>
            <div className={styles.sectionTitle}>Daily Cash Summary</div>
            <div className={styles.cashRow}>
              <div className={styles.cashRowMethod}><Banknote size={13} className={styles.cashRowIcon} />Cash</div>
              <div className={styles.cashRowAmount}>{fmtAmt(cashAmt)}</div>
            </div>
            <div className={styles.cashRow}>
              <div className={styles.cashRowMethod}><Smartphone size={13} className={styles.cashRowIcon} />Mobile Money</div>
              <div className={styles.cashRowAmount}>{fmtAmt(momoAmt)}</div>
            </div>
            <div className={styles.cashRow}>
              <div className={styles.cashRowMethod}><Building2 size={13} className={styles.cashRowIcon} />Bank Transfer</div>
              <div className={styles.cashRowAmount}>{fmtAmt(bankAmt)}</div>
            </div>
            <div className={styles.cashRow}>
              <div className={styles.cashRowMethod}><CreditCard size={13} className={styles.cashRowIcon} />Card / Cheque</div>
              <div className={styles.cashRowAmount}>{fmtAmt(cardAmt)}</div>
            </div>
            <div className={styles.cashDivider} />
            <div className={styles.cashTotal}>
              <span>Total</span>
              <span>{fmtAmt(totalToday)}</span>
            </div>
          </div>

          <div>
            <div className={styles.sectionTitle}>Quick Filters</div>
            <div className={styles.filterGroup}>
              <div className={styles.filterLabel}>Class</div>
              <select
                className={styles.filterSelect}
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
              >
                <option value="">All Classes</option>
                {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.filterGroup} style={{ marginTop: 10 }}>
              <div className={styles.filterLabel}>Payment Method</div>
              <select
                className={styles.filterSelect}
                value={methodFilter}
                onChange={e => setMethodFilter(e.target.value)}
              >
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Card / Cheque</option>
              </select>
            </div>
            <div className={styles.filterGroup} style={{ marginTop: 10 }}>
              <div className={styles.filterLabel}>Status</div>
              <select
                className={styles.filterSelect}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Center: Recent Payments */}
        <div className={styles.centerPanel}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle} style={{ margin: 0 }}>
              Recent Payments {filteredPayments.length !== allPayments.length && `(${filteredPayments.length} filtered)`}
            </div>
            <button className={styles.viewAllLink} onClick={() => router.push("/fees")}>View All →</button>
          </div>
          <div className={styles.tableWrap}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Receipt No</th>
                    <th className={styles.th}>Student</th>
                    <th className={styles.th}>Amount (GHS)</th>
                    <th className={styles.th}>Method</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "32px 16px", color: "#71787b", fontSize: "var(--text-xs)" }}>
                      {allPayments.length === 0
                        ? 'No payments recorded yet. Use "Record Payment" to add the first entry.'
                        : "No payments match the current filters."}
                    </td></tr>
                  )}
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className={styles.tr}>
                      <td className={`${styles.td} ${styles.tdMono}`}>{p.receiptNo}</td>
                      <td className={styles.td}>
                        <div className={styles.studentCell}>
                          <div className={styles.avatar}>{p.studentInitials}</div>
                          <div>
                            <div className={styles.studentName}>{p.studentName}</div>
                            <div className={styles.studentClass}>{p.className}</div>
                          </div>
                        </div>
                      </td>
                      <td className={`${styles.td} ${styles.tdMono}`} style={{ fontWeight: 600 }}>
                        {fmtAmt(p.amount)}
                      </td>
                      <td className={styles.td}>
                        {p.method === "mobile_money" && <span className={styles.methodMoMo}><Smartphone size={10} /> MoMo</span>}
                        {p.method === "cash"         && <span className={styles.methodCash}><Banknote size={10} /> Cash</span>}
                        {p.method === "bank_transfer"&& <span className={styles.methodBank}><Building2 size={10} /> Bank</span>}
                        {p.method === "card"         && <span className={styles.methodCash}><CreditCard size={10} /> Card</span>}
                      </td>
                      <td className={styles.td}>
                        {p.status === "paid"    && <span className={styles.statusPaid}>Paid</span>}
                        {p.status === "pending" && <span className={styles.statusPending}>Pending</span>}
                        {p.status === "failed"  && <span className={styles.statusFailed}>Failed</span>}
                      </td>
                      <td className={`${styles.td} ${styles.tdMono}`}>{p.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Reconciliation & Alerts */}
        <aside className={styles.rightPanel}>
          <div className={styles.rightPanelHead}>
            <div className={styles.rightPanelTitle}>Reconciliation &amp; Alerts</div>
            <Bell size={15} style={{ color: "#41484b" }} />
          </div>
          {props.overdueStudents > 0 ? (
            <div style={{ padding: "12px 16px" }}>
              <div style={{ background: "#ffdad6", borderRadius: 6, padding: "10px 12px", fontSize: "var(--text-xs)", color: "#ba1a1a", display: "flex", gap: 8, alignItems: "flex-start" }}>
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <strong>{props.overdueStudents} students</strong> have outstanding fees. Review the{" "}
                  <button
                    onClick={() => router.push("/fees")}
                    style={{ background: "none", border: "none", color: "#ba1a1a", textDecoration: "underline", cursor: "pointer", padding: 0, fontSize: "var(--text-xs)" }}
                  >
                    fees page
                  </button>{" "}
                  to send reminders.
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 16px", gap: 8, color: "#71787b" }}>
              <CheckCircle size={32} style={{ opacity: 0.25 }} />
              <p style={{ fontSize: "var(--text-xs)", margin: 0, textAlign: "center" }}>No reconciliation alerts</p>
            </div>
          )}
        </aside>
      </div>

      {/* Record Payment Modal */}
      {showPayModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
             onClick={() => setShowPayModal(false)}>
          <div style={{ background: "#fff", borderRadius: 8, width: 420, maxWidth: "90vw", padding: 24, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
               onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: "var(--text-md)", fontWeight: 700, margin: 0 }}>Record Payment</h2>
              <button onClick={() => setShowPayModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            {payError && (
              <div style={{ background: "#ffdad6", color: "#ba1a1a", borderRadius: 4, padding: "8px 12px", fontSize: "var(--text-xs)", marginBottom: 16 }}>{payError}</div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "#41484b", display: "block", marginBottom: 4 }}>Fee Record ID *</label>
                <input
                  value={payFeeRecordId}
                  onChange={e => setPayFeeRecordId(e.target.value)}
                  placeholder="Paste fee record ID from Fees page"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #c1c7cb", borderRadius: 4, fontSize: "var(--text-xs)", boxSizing: "border-box" }}
                />
                <p style={{ fontSize: "var(--text-xs)", color: "#71787b", margin: "4px 0 0" }}>
                  Find the ID in <button onClick={() => router.push("/fees")} style={{ background: "none", border: "none", color: "#073543", cursor: "pointer", padding: 0, fontSize: "var(--text-xs)", textDecoration: "underline" }}>Fees → Students</button>
                </p>
              </div>
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "#41484b", display: "block", marginBottom: 4 }}>Amount (GHS) *</label>
                <input
                  type="number" min="0" step="0.01"
                  value={payAmount} onChange={e => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #c1c7cb", borderRadius: 4, fontSize: "var(--text-xs)", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "#41484b", display: "block", marginBottom: 4 }}>Payment Method *</label>
                <select
                  value={payMethod} onChange={e => setPayMethod(e.target.value as typeof payMethod)}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #c1c7cb", borderRadius: 4, fontSize: "var(--text-xs)", boxSizing: "border-box" }}
                >
                  <option value="cash">Cash</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card / Cheque</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "#41484b", display: "block", marginBottom: 4 }}>Reference / Receipt No *</label>
                <input
                  value={payReference} onChange={e => setPayReference(e.target.value)}
                  placeholder="e.g. PMT-2026-001 or MoMo transaction ID"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #c1c7cb", borderRadius: 4, fontSize: "var(--text-xs)", boxSizing: "border-box" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setShowPayModal(false)}
                style={{ padding: "8px 18px", border: "1px solid #c1c7cb", borderRadius: 4, background: "#fff", fontSize: "var(--text-xs)", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={submitPayment} disabled={payLoading}
                style={{ padding: "8px 18px", background: "#073543", color: "#fff", border: "none", borderRadius: 4, fontSize: "var(--text-xs)", fontWeight: 600, cursor: "pointer" }}
              >
                {payLoading ? "Recording…" : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
