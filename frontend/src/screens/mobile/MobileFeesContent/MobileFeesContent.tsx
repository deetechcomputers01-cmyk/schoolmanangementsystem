"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, Plus, FileText, Wallet, CheckCircle2, AlertCircle, AlertTriangle,
  Eye, Printer, Bell, X, Smartphone, Banknote, CreditCard, Landmark, Receipt, MoreVertical,
} from "lucide-react";
import { currency } from "@backend/utils";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { SwipeRow } from "@/components/mobile/ui/SwipeRow/SwipeRow";
import type { FeesInvoiceRow } from "@/screens/desktop/FeesScreen/FeesPaymentsContent";
import styles from "./MobileFeesContent.module.css";

export interface MobileRecentPayment {
  id: string;
  amount: number;
  reference: string;
  timeAgo: string;
}

interface Props {
  rows: FeesInvoiceRow[];
  stats: {
    expectedGHS: number;
    collectedGHS: number;
    outstandingGHS: number;
    overdueCount: number;
  };
  classes: { id: string; name: string }[];
  recentPayments: MobileRecentPayment[];
  initialStudentId?: string;
  initialFeeRecordId?: string;
  recordPaymentOnLoad?: boolean;
}

const METHOD_ICON = { cash: Banknote, mobile_money: Smartphone, bank_transfer: Landmark, card: CreditCard } as const;
const METHOD_LABEL: Record<string, string> = { cash: "Cash", mobile_money: "Mobile Money", bank_transfer: "Bank Transfer", card: "Card" };

function fmtGHS(v: number) {
  return v.toLocaleString("en-GH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}
function scholarshipLabel(scholarship: FeesInvoiceRow["scholarship"], discountApplied: number) {
  if (!scholarship || discountApplied <= 0) return null;
  const off = scholarship.type === "percent" ? `${scholarship.value}% off` : `GHS ${scholarship.value.toLocaleString()} off`;
  return scholarship.reason ? `${off} · ${scholarship.reason}` : off;
}

export function MobileFeesContent({
  rows, stats, classes, recentPayments,
  initialStudentId, initialFeeRecordId, recordPaymentOnLoad = false,
}: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const [payOpen, setPayOpen] = useState(false);
  const [payTargetId, setPayTargetId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<"cash" | "mobile_money" | "bank_transfer" | "card">("cash");
  const [payReference, setPayReference] = useState("");
  const [paySaving, setPaySaving] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const [viewTarget, setViewTarget] = useState<FeesInvoiceRow | null>(null);

  const unpaidRows = useMemo(() => rows.filter((r) => r.status !== "paid"), [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = search.trim().toLowerCase();
      if (q && !r.studentName.toLowerCase().includes(q) && !r.invoiceNo.toLowerCase().includes(q)) return false;
      if (filter === "all") return true;
      if (filter === "Paid") return r.status === "paid";
      if (filter === "Pending") return r.status === "pending";
      if (filter === "Overdue") return r.status === "overdue";
      return r.classId === filter;
    });
  }, [rows, search, filter]);

  function openPaySheet(row?: FeesInvoiceRow) {
    const target = row ?? unpaidRows[0];
    setPayTargetId(target?.id ?? "");
    setPayAmount(target ? (target.balance > 0 ? target.balance : target.amountDue).toFixed(2) : "");
    setPayMethod("cash");
    setPayReference(`RCT-${Date.now()}`);
    setPayError(null);
    setPayOpen(true);
  }

  // Arriving here from another screen's "Record Payment" link (Students
  // list, Student Detail, Dashboard) via ?studentId=&recordPayment=1 should
  // open straight into that student's payment sheet, not just land on the
  // plain list — same behaviour as the desktop Fees screen.
  useEffect(() => {
    if (!recordPaymentOnLoad) return;

    const targetRow =
      (initialFeeRecordId ? rows.find((row) => row.id === initialFeeRecordId) : null) ??
      (initialStudentId
        ? rows.find((row) => row.studentId === initialStudentId && row.balance > 0)
        : rows.find((row) => row.balance > 0));

    if (!targetRow) return;
    openPaySheet(targetRow);
    // The URL's ?recordPayment=1 is a one-time "open this" instruction, not
    // persistent state — clear it immediately so the signal can't linger.
    // This component never remounts across client-side navigations within
    // /fees (only its props change), so a ref/flag meant to say "already
    // handled" would itself become stale state, including for retrying the
    // very same student. Consuming the URL means there's nothing to get out
    // of sync: no recordPayment=1 left in the URL, no re-trigger, and a
    // fresh link (even for the same student) always carries a fresh signal.
    router.replace("/fees", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFeeRecordId, initialStudentId, recordPaymentOnLoad, rows]);

  function handleTargetChange(id: string) {
    setPayTargetId(id);
    const target = rows.find((r) => r.id === id);
    if (target) setPayAmount((target.balance > 0 ? target.balance : target.amountDue).toFixed(2));
  }

  async function submitPayment() {
    const amount = Number(payAmount);
    if (!payTargetId) { setPayError("Select an invoice."); return; }
    if (!Number.isFinite(amount) || amount <= 0) { setPayError("Enter a valid amount."); return; }
    setPaySaving(true); setPayError(null);
    try {
      const res = await fetch("/api/fees/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeRecordId: payTargetId, amount, method: payMethod, reference: payReference.trim() || `RCT-${Date.now()}` }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setPayError(payload?.message ?? payload?.error ?? "Failed to record payment.");
        setPaySaving(false);
        return;
      }
      setPayOpen(false);
      setPaySaving(false);
      showToast("Payment recorded and receipt generated.");
      router.refresh();
    } catch {
      setPayError("Network error. Please try again.");
      setPaySaving(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}><span className={styles.kpiLabel}>Total Due</span><Wallet size={16} className={styles.kpiIconMuted} /></div>
          <strong className={styles.kpiValue}>GHS {fmtGHS(stats.expectedGHS)}</strong>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}><span className={styles.kpiLabel}>Collected</span><CheckCircle2 size={16} className={styles.kpiIconGood} /></div>
          <strong className={`${styles.kpiValue} ${styles.kpiValueGood}`}>GHS {fmtGHS(stats.collectedGHS)}</strong>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}><span className={styles.kpiLabel}>Outstanding</span><AlertCircle size={16} className={styles.kpiIconWarn} /></div>
          <strong className={`${styles.kpiValue} ${styles.kpiValueWarn}`}>GHS {fmtGHS(stats.outstandingGHS)}</strong>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}><span className={styles.kpiLabel}>Overdue</span><AlertTriangle size={16} className={styles.kpiIconBad} /></div>
          <strong className={`${styles.kpiValue} ${styles.kpiValueBad}`}>{stats.overdueCount}</strong>
        </div>
      </div>

      <label className={styles.searchWrap}>
        <Search size={16} className={styles.searchIcon} />
        <input className={styles.searchInput} placeholder="Search student, invoice, or receipt" value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>

      <div className={styles.actionRow}>
        <button type="button" className={styles.btnPrimary} onClick={() => openPaySheet()}>
          <Plus size={16} /> Record Payment
        </button>
        <Link href="/fees" className={styles.btnOutline}>
          <FileText size={16} /> Generate Invoice
        </Link>
      </div>

      <div className={styles.chipRow}>
        {["all", "Paid", "Pending", "Overdue"].map((f) => (
          <button key={f} type="button" className={`${styles.chip} ${filter === f ? styles.chipActive : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f}
          </button>
        ))}
        {classes.map((c) => (
          <button key={c.id} type="button" className={`${styles.chip} ${filter === c.id ? styles.chipActive : ""}`} onClick={() => setFilter(c.id)}>{c.name}</button>
        ))}
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <p className={styles.emptyText}>{search ? "No results match your search." : "No invoices yet."}</p>
        ) : filtered.map((r) => {
          const isOpen = openId === r.id;
          const progressPct = r.amountDue > 0 ? Math.min(100, Math.round((r.amountPaid / r.amountDue) * 100)) : 0;
          return (
            <SwipeRow
              key={r.id}
              rightActions={[
                ...(r.status !== "paid" ? [{ key: "pay", icon: Wallet, label: "Record Payment", tone: "primary" as const, onClick: () => openPaySheet(r) }] : []),
                { key: "view", icon: Eye, label: "View Invoice", tone: "soft" as const, onClick: () => setViewTarget(r) },
              ]}
              leftActions={[
                { key: "print", icon: Printer, label: "Print Receipt", onClick: () => showToast("Print Receipt is not available yet.") },
                ...(r.status !== "paid" ? [{ key: "remind", icon: Bell, label: "Send Reminder", onClick: () => showToast("Send Reminder is not available yet.") }] : []),
              ]}
            >
              <div
                className={`${styles.card} ${r.status === "overdue" ? styles.cardOverdue : ""} ${isOpen ? styles.cardOpen : ""}`}
                role="button"
                tabIndex={0}
                onClick={() => setOpenId(isOpen ? null : r.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenId(isOpen ? null : r.id); } }}
              >
                <div className={styles.cardTop}>
                  <div className={styles.cardLeft}>
                    <span className={styles.avatar}>{initials(r.studentName)}</span>
                    <div className={styles.cardInfo}>
                      <h4 className={styles.cardName}>{r.studentName}</h4>
                      <p className={styles.cardSub}>{r.className} • {r.invoiceNo}</p>
                    </div>
                  </div>
                  <div className={styles.cardTopRight}>
                    <span className={`${styles.statusPill} ${styles[`status_${r.status}`]}`}>
                      {r.status === "paid" ? "Paid" : r.status === "overdue" ? "Overdue" : "Pending"}
                    </span>
                    <button
                      type="button"
                      className={styles.moreBtn}
                      onClick={(e) => { e.stopPropagation(); setOpenId(isOpen ? null : r.id); }}
                      aria-label="More actions"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>

                {r.status === "paid" ? (
                  <div className={styles.cardRow}>
                    <div><p className={styles.cardLabel}>Total Amount</p><p className={styles.cardAmount}>{currency(r.amountDue)}</p></div>
                  </div>
                ) : (
                  <>
                    <div className={styles.cardRow}>
                      <div><p className={styles.cardLabel}>Invoice Total</p><p className={styles.cardAmountSm}>{currency(r.amountDue)}</p></div>
                      <div className={styles.cardRowRight}><p className={styles.cardLabel}>Balance Due</p><p className={`${styles.cardAmount} ${r.status === "overdue" ? styles.textBad : styles.textWarn}`}>{currency(r.balance)}</p></div>
                    </div>
                    {r.amountPaid > 0 && (
                      <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${progressPct}%` }} /></div>
                    )}
                  </>
                )}

                {isOpen && (
                  <div className={styles.cardActionRow} onClick={(e) => e.stopPropagation()}>
                    {r.status !== "paid" && (
                      <button type="button" className={styles.cardActionBtn} onClick={() => openPaySheet(r)}>
                        <Wallet size={15} /> Record Payment
                      </button>
                    )}
                    <button type="button" className={styles.cardActionBtn} onClick={() => setViewTarget(r)}><Eye size={15} /> View Invoice</button>
                    <button type="button" className={styles.cardActionBtn} onClick={() => showToast("Print Receipt is not available yet.")}><Printer size={15} /> Print Receipt</button>
                    {r.status !== "paid" && (
                      <button type="button" className={styles.cardActionBtn} onClick={() => showToast("Send Reminder is not available yet.")}>
                        <Bell size={15} /> Send Reminder
                      </button>
                    )}
                  </div>
                )}
              </div>
            </SwipeRow>
          );
        })}
      </div>

      <section className={styles.recentSection}>
        <h3 className={styles.sectionTitle}>Recent Payments</h3>
        <div className={styles.recentCard}>
          {recentPayments.length === 0 ? (
            <p className={styles.emptyText}>No payments recorded yet.</p>
          ) : recentPayments.map((p) => (
            <div key={p.id} className={styles.recentRow}>
              <span className={styles.recentIcon}><Receipt size={16} /></span>
              <div>
                <p className={styles.recentAmount}>{currency(p.amount)}</p>
                <p className={styles.recentMeta}>{p.reference} • {p.timeAgo}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {payOpen && (
        <div className={styles.sheetBackdrop} onClick={() => !paySaving && setPayOpen(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHeader}>
              <div>
                <p className={styles.sheetEyebrow}>Fee Invoices</p>
                <h3 className={styles.sheetTitle}>Record Payment</h3>
                <p className={styles.sheetSubtitle}>Log a payment against an outstanding invoice.</p>
              </div>
              <button type="button" className={styles.sheetClose} onClick={() => setPayOpen(false)} aria-label="Close"><X size={20} /></button>
            </div>
            <div className={styles.sheetBody}>
              {payError && <p className={styles.errorText}>{payError}</p>}
              <div className={styles.field}>
                <label>Invoice *</label>
                <select className={styles.input} value={payTargetId} onChange={(e) => handleTargetChange(e.target.value)}>
                  <option value="" disabled>Select an invoice</option>
                  {unpaidRows.map((r) => (
                    <option key={r.id} value={r.id}>{r.studentName} — {r.invoiceNo} — Bal {currency(r.balance)}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label>Amount (GHS) *</label>
                <input className={styles.input} type="number" min="0" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>Payment Method</label>
                <div className={styles.methodGrid}>
                  {(["cash", "mobile_money", "bank_transfer", "card"] as const).map((m) => {
                    const Icon = METHOD_ICON[m];
                    return (
                      <button key={m} type="button" className={`${styles.methodBtn} ${payMethod === m ? styles.methodBtnActive : ""}`} onClick={() => setPayMethod(m)}>
                        <Icon size={16} /> {METHOD_LABEL[m]}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className={styles.field}>
                <label>Reference</label>
                <input className={styles.input} value={payReference} onChange={(e) => setPayReference(e.target.value)} />
              </div>
            </div>
            <div className={styles.sheetFooter}>
              <button type="button" className={styles.btnOutline} onClick={() => setPayOpen(false)} disabled={paySaving}>Cancel</button>
              <button type="button" className={styles.btnPrimary} onClick={submitPayment} disabled={paySaving}>{paySaving ? "Saving…" : "Save Payment"}</button>
            </div>
          </div>
        </div>
      )}

      {viewTarget && (
        <div className={styles.sheetBackdrop} onClick={() => setViewTarget(null)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHeader}>
              <div>
                <p className={styles.sheetEyebrow}>Fee Invoices</p>
                <h3 className={styles.sheetTitle}>{viewTarget.invoiceNo}</h3>
                <p className={styles.sheetSubtitle}>{viewTarget.studentName} • {viewTarget.className}</p>
              </div>
              <button type="button" className={styles.sheetClose} onClick={() => setViewTarget(null)} aria-label="Close"><X size={20} /></button>
            </div>
            <div className={styles.sheetBody}>
              <div className={styles.viewStatusRow}>
                <span className={`${styles.statusPill} ${styles[`status_${viewTarget.status}`]}`}>
                  {viewTarget.status === "paid" ? (viewTarget.paidByScholarship ? "Paid (Scholarship)" : "Paid") : viewTarget.status === "overdue" ? "Overdue" : "Pending"}
                </span>
                {scholarshipLabel(viewTarget.scholarship, viewTarget.discountApplied) && (
                  <span className={styles.viewScholarshipBadge}>{scholarshipLabel(viewTarget.scholarship, viewTarget.discountApplied)}</span>
                )}
              </div>

              <div className={styles.viewSummaryBox}>
                {viewTarget.discountApplied > 0 && (
                  <div className={styles.viewSummaryRow}><span>Scholarship Discount</span><strong className={styles.textGood}>- {currency(viewTarget.discountApplied)}</strong></div>
                )}
                <div className={styles.viewSummaryRow}><span>Total Due</span><strong>{currency(viewTarget.amountDue)}</strong></div>
                <div className={styles.viewSummaryRow}><span>Amount Paid</span><strong className={styles.textGood}>{currency(viewTarget.amountPaid)}</strong></div>
                {viewTarget.latePenalty > 0 && (
                  <div className={styles.viewSummaryRow}><span className={styles.textBad}>Late Payment Penalty</span><strong className={styles.textBad}>{currency(viewTarget.latePenalty)}</strong></div>
                )}
                <div className={styles.viewSummaryDivider} />
                <div className={styles.viewSummaryRow}><span className={styles.viewBalanceLabel}>Balance</span><strong className={styles.viewBalanceValue}>{currency(viewTarget.balance)}</strong></div>
              </div>

              <div className={styles.field}>
                <label>Fee Breakdown</label>
                <ul className={styles.viewBreakdownList}>
                  {viewTarget.description.split(",").map((s) => s.trim()).filter(Boolean).length > 0
                    ? viewTarget.description.split(",").map((part) => part.trim()).filter(Boolean).map((part) => <li key={part}>{part}</li>)
                    : <li>{viewTarget.description}</li>}
                </ul>
              </div>

              <div className={styles.field}>
                <label>Primary Contact</label>
                <p className={styles.viewGuardianName}>{viewTarget.guardianName}</p>
                <p className={styles.viewGuardianPhone}>{viewTarget.guardianPhone}</p>
              </div>
            </div>
            <div className={styles.sheetFooter}>
              <button type="button" className={styles.btnOutline} onClick={() => setViewTarget(null)}>Close</button>
              {viewTarget.balance > 0 && (
                <button type="button" className={styles.btnPrimary} onClick={() => { const target = viewTarget; setViewTarget(null); openPaySheet(target); }}>
                  <Wallet size={15} /> Record Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
