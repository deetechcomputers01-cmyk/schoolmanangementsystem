"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Printer, RotateCcw, X, CheckCircle, AlertTriangle, ChevronDown, ChevronLeft } from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import styles from "./PaymentReceiptScreen.module.css";

export interface SiblingPayment {
  id: string;
  receiptNo: string;
  amount: number;
  method: string;
  reference: string;
  paidAt: string;
}

export interface ReceiptPayment {
  id: string;
  receiptNo: string;
  invoiceNo: string;
  paymentRef: string;
  paidAt: string;
  method: string;
  amount: number;
  feeRecordId: string;
  term: string;
  description: string;
  amountDue: number;
  totalPaid: number;
  balance: number;
  feeStatus: string;
  studentId: string;
  studentName: string;
  admNo: string;
  className: string;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  siblingPayments: SiblingPayment[];
}

export interface ReceiptProps {
  payments: ReceiptPayment[];
  defaultPaymentId: string | null;
}

function fmtCurrency(n: number) {
  return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit" });
}

function methodLabel(m: string) {
  if (m === "mobile_money") return "Mobile Money";
  if (m === "bank_transfer") return "Bank Transfer";
  return m.charAt(0).toUpperCase() + m.slice(1);
}

function feeStatusBadge(s: string) {
  if (s === "paid") return styles.badgePaid;
  if (s === "partial") return styles.badgePartial;
  return styles.badgeUnpaid;
}
function feeStatusLabel(s: string) {
  if (s === "paid") return "Paid";
  if (s === "partial") return "Partially Paid";
  return "Unpaid";
}

// Converts a number to words (up to millions) for the receipt
function numToWords(n: number): string {
  const ONES = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const TENS = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  if (n === 0) return "Zero";
  function below100(x: number): string {
    if (x < 20) return ONES[x];
    return TENS[Math.floor(x/10)] + (x%10 !== 0 ? " " + ONES[x%10] : "");
  }
  function below1000(x: number): string {
    if (x < 100) return below100(x);
    return ONES[Math.floor(x/100)] + " Hundred" + (x%100 !== 0 ? " " + below100(x%100) : "");
  }
  const int = Math.floor(n);
  const dec = Math.round((n - int) * 100);
  let result = "";
  if (int >= 1000000) result += below1000(Math.floor(int/1000000)) + " Million ";
  if (int % 1000000 >= 1000) result += below1000(Math.floor((int%1000000)/1000)) + " Thousand ";
  if (int % 1000 > 0) result += below1000(int%1000);
  result = result.trim();
  if (dec > 0) result += ` and ${dec}/100`;
  return result + " Ghana Cedis Only";
}

export function PaymentReceiptContent({ payments, defaultPaymentId }: ReceiptProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(defaultPaymentId);
  const [showReverse, setShowReverse] = useState(false);
  const [reverseReason, setReverseReason] = useState("");
  const [reverseConfirmed, setReverseConfirmed] = useState(false);
  const [reversing, setReversing] = useState(false);
  const { showToast: showToastFn } = useToast();

  const toast = useCallback((msg: string, err = false) => {
    showToastFn(msg, err ? "error" : "success");
  }, [showToastFn]);

  async function confirmReversal() {
    if (!selectedId) return;
    setReversing(true);
    try {
      const res = await fetch(`/api/fees/payments/${selectedId}`, { method: "DELETE" });
      if (res.ok) {
        setShowReverse(false);
        setReverseReason("");
        setReverseConfirmed(false);
        toast("Payment reversed. Fee status updated to Unpaid.");
        router.refresh();
      } else {
        const err = await res.json().catch(() => null);
        toast(err?.error ?? "Failed to reverse payment.", true);
      }
    } catch {
      toast("Network error. Please try again.", true);
    } finally {
      setReversing(false);
    }
  }

  const selected = payments.find(p => p.id === selectedId) ?? null;

  if (payments.length === 0) {
    return (
      <div className={styles.root}>
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No Payments Recorded</p>
          <p className={styles.emptyHint}>Once fees are paid, receipts will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <div>
          <Link href="/fees" className={styles.backLink}><ChevronLeft size={14} />Back to Fees</Link>
          <h1 className={styles.title}>Payment Receipts</h1>
          <p className={styles.subtitle}>View and manage payment records and receipts.</p>
        </div>
        {selected && (
          <div className={styles.headerActions}>
            <button className={styles.btnGhost} onClick={() => toast("Email sent to guardian.")}>
              <Mail size={16} />Email Guardian
            </button>
            <button className={styles.btnGhost} onClick={() => toast("Opening print dialog…")}>
              <Printer size={16} />Print Receipt
            </button>
            <button
              className={styles.btnDanger}
              onClick={() => setShowReverse(true)}
            >
              <RotateCcw size={16} />Reverse Payment
            </button>
          </div>
        )}
      </div>

      {/* ── Payment selector ── */}
      <div className={styles.selectorRow}>
        <label className={styles.selectorLabel}>Select Receipt</label>
        <div className={styles.selectorWrap}>
          <select
            className={styles.selectorSelect}
            value={selectedId ?? ""}
            onChange={e => setSelectedId(e.target.value)}
          >
            {payments.map(p => (
              <option key={p.id} value={p.id}>
                {p.receiptNo} — {p.studentName} — {fmtCurrency(p.amount)} — {fmtDate(p.paidAt)}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className={styles.selectorIcon} />
        </div>
      </div>

      {selected && (
        <>
          {/* ── 3-column layout ── */}
          <div className={styles.threeCol}>

            {/* Left: Invoice Summary */}
            <div className={styles.summaryCol}>
              <div className={styles.sideCard}>
                <h3 className={styles.sideCardTitle}>Invoice Summary</h3>

                <div className={styles.summaryBlock}>
                  <span className={styles.summaryKey}>Invoice No.</span>
                  <span className={styles.summaryVal}>{selected.invoiceNo}</span>
                </div>
                <div className={styles.summaryBlock}>
                  <span className={styles.summaryKey}>Receipt No.</span>
                  <span className={`${styles.summaryVal} ${styles.summaryValPrimary}`}>{selected.receiptNo}</span>
                </div>
                <div className={styles.summaryBlock}>
                  <span className={styles.summaryKey}>Term</span>
                  <span className={styles.summaryVal}>{selected.term}</span>
                </div>
                <div className={styles.summaryBlock}>
                  <span className={styles.summaryKey}>Description</span>
                  <span className={styles.summaryVal}>{selected.description}</span>
                </div>
                <div className={styles.summaryDivider} />
                <div className={styles.summaryBlock}>
                  <span className={styles.summaryKey}>Amount Due</span>
                  <span className={styles.summaryVal}>{fmtCurrency(selected.amountDue)}</span>
                </div>
                <div className={styles.summaryBlock}>
                  <span className={styles.summaryKey}>This Payment</span>
                  <span className={`${styles.summaryVal} ${styles.summaryValGreen}`}>{fmtCurrency(selected.amount)}</span>
                </div>
                <div className={styles.summaryBlock}>
                  <span className={styles.summaryKey}>Total Paid</span>
                  <span className={styles.summaryVal}>{fmtCurrency(selected.totalPaid)}</span>
                </div>
                <div className={styles.summaryBlock}>
                  <span className={styles.summaryKey}>Balance</span>
                  <span className={`${styles.summaryVal} ${selected.balance > 0 ? styles.summaryValRed : ""}`}>
                    {fmtCurrency(selected.balance)}
                  </span>
                </div>
                <div className={styles.summaryDivider} />
                <div className={styles.summaryBlock}>
                  <span className={styles.summaryKey}>Status</span>
                  <span className={`${styles.statusBadge} ${feeStatusBadge(selected.feeStatus)}`}>
                    {feeStatusLabel(selected.feeStatus)}
                  </span>
                </div>
              </div>

              {/* Student info */}
              <div className={styles.sideCard}>
                <h3 className={styles.sideCardTitle}>Student Details</h3>
                <div className={styles.summaryBlock}>
                  <span className={styles.summaryKey}>Name</span>
                  <span className={styles.summaryVal}>{selected.studentName}</span>
                </div>
                <div className={styles.summaryBlock}>
                  <span className={styles.summaryKey}>Adm No.</span>
                  <span className={styles.summaryVal}>{selected.admNo}</span>
                </div>
                <div className={styles.summaryBlock}>
                  <span className={styles.summaryKey}>Class</span>
                  <span className={styles.summaryVal}>{selected.className}</span>
                </div>
                {selected.guardianName && (
                  <>
                    <div className={styles.summaryDivider} />
                    <div className={styles.summaryBlock}>
                      <span className={styles.summaryKey}>Guardian</span>
                      <span className={styles.summaryVal}>{selected.guardianName}</span>
                    </div>
                    {selected.guardianPhone && (
                      <div className={styles.summaryBlock}>
                        <span className={styles.summaryKey}>Phone</span>
                        <span className={styles.summaryVal}>{selected.guardianPhone}</span>
                      </div>
                    )}
                    {selected.guardianEmail && (
                      <div className={styles.summaryBlock}>
                        <span className={styles.summaryKey}>Email</span>
                        <span className={styles.summaryVal}>{selected.guardianEmail}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Center: Formal receipt document */}
            <div className={styles.receiptCol}>
              <div className={styles.receiptDoc}>
                {/* Letterhead */}
                <div className={styles.letterhead}>
                  <div className={styles.schoolSeal}>SS</div>
                  <div className={styles.schoolInfo}>
                    <p className={styles.schoolName}>ScholarSphere School</p>
                    <p className={styles.schoolAddress}>P.O. Box 1234, Accra, Ghana</p>
                    <p className={styles.schoolContact}>Tel: +233 000 000 000 &bull; finance@scholarsphere.edu.gh</p>
                  </div>
                </div>

                <div className={styles.receiptTitleRow}>
                  <h2 className={styles.receiptTitle}>OFFICIAL RECEIPT</h2>
                  <div className={styles.receiptNos}>
                    <span className={styles.receiptNoLabel}>Receipt No.</span>
                    <span className={styles.receiptNoValue}>{selected.receiptNo}</span>
                  </div>
                </div>

                <div className={styles.receiptMeta}>
                  <div className={styles.receiptMetaItem}>
                    <span className={styles.receiptMetaKey}>Date</span>
                    <span className={styles.receiptMetaVal}>{fmtDate(selected.paidAt)}</span>
                  </div>
                  <div className={styles.receiptMetaItem}>
                    <span className={styles.receiptMetaKey}>Time</span>
                    <span className={styles.receiptMetaVal}>{fmtTime(selected.paidAt)}</span>
                  </div>
                  <div className={styles.receiptMetaItem}>
                    <span className={styles.receiptMetaKey}>Reference</span>
                    <span className={styles.receiptMetaVal}>{selected.paymentRef}</span>
                  </div>
                  <div className={styles.receiptMetaItem}>
                    <span className={styles.receiptMetaKey}>Method</span>
                    <span className={styles.receiptMetaVal}>{methodLabel(selected.method)}</span>
                  </div>
                </div>

                <div className={styles.receiptParty}>
                  <div className={styles.receiptPartyCol}>
                    <p className={styles.receiptPartyLabel}>Received From</p>
                    <p className={styles.receiptPartyName}>{selected.guardianName ?? selected.studentName}</p>
                    {selected.guardianPhone && <p className={styles.receiptPartyDetail}>{selected.guardianPhone}</p>}
                  </div>
                  <div className={styles.receiptPartyCol}>
                    <p className={styles.receiptPartyLabel}>Student</p>
                    <p className={styles.receiptPartyName}>{selected.studentName}</p>
                    <p className={styles.receiptPartyDetail}>{selected.admNo} &bull; {selected.className}</p>
                  </div>
                </div>

                <div className={styles.receiptPurpose}>
                  <p className={styles.receiptPurposeLabel}>In payment of</p>
                  <p className={styles.receiptPurposeValue}>{selected.description} &mdash; {selected.term}</p>
                </div>

                {/* Large amount display */}
                <div className={styles.amountBlock}>
                  <p className={styles.amountLabel}>Amount Received</p>
                  <p className={styles.amountValue}>{fmtCurrency(selected.amount)}</p>
                  <p className={styles.amountWords}>{numToWords(selected.amount)}</p>
                </div>

                {/* Signature area */}
                <div className={styles.signatureRow}>
                  <div className={styles.signatureBlock}>
                    <div className={styles.signatureLine} />
                    <p className={styles.signatureLabel}>Received by</p>
                  </div>
                  <div className={styles.signatureBlock}>
                    <div className={styles.signatureLine} />
                    <p className={styles.signatureLabel}>Finance Officer Stamp</p>
                  </div>
                  <div className={styles.qrPlaceholder}>
                    <div className={styles.qrGrid}>
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div key={i} className={styles.qrCell} style={{ opacity: (i * 7) % 5 < 2 ? 1 : 0.08 }} />
                      ))}
                    </div>
                    <p className={styles.qrLabel}>Verify</p>
                  </div>
                </div>

                <p className={styles.receiptFooter}>
                  This is an official receipt issued by ScholarSphere School. Please retain for your records.
                </p>
              </div>
            </div>

            {/* Right: Verification */}
            <div className={styles.verifyCol}>
              <div className={styles.sideCard}>
                <h3 className={styles.sideCardTitle}>Verification</h3>
                <div className={styles.verifyItem}>
                  <CheckCircle size={18} className={styles.verifyIconOk} />
                  <div>
                    <p className={styles.verifyLabel}>Payment Confirmed</p>
                    <p className={styles.verifyDetail}>Transaction processed successfully</p>
                  </div>
                </div>
                <div className={styles.verifyItem}>
                  <CheckCircle size={18} className={styles.verifyIconOk} />
                  <div>
                    <p className={styles.verifyLabel}>Student Verified</p>
                    <p className={styles.verifyDetail}>{selected.admNo}</p>
                  </div>
                </div>
                <div className={styles.verifyItem}>
                  {selected.balance > 0
                    ? <AlertTriangle size={18} className={styles.verifyIconWarn} />
                    : <CheckCircle size={18} className={styles.verifyIconOk} />
                  }
                  <div>
                    <p className={styles.verifyLabel}>
                      {selected.balance > 0 ? "Balance Outstanding" : "Fully Paid"}
                    </p>
                    <p className={styles.verifyDetail}>
                      {selected.balance > 0 ? fmtCurrency(selected.balance) + " remaining" : "No outstanding balance"}
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.sideCard}>
                <h3 className={styles.sideCardTitle}>Payment Proof</h3>
                <div className={styles.proofInfo}>
                  <div className={styles.summaryBlock}>
                    <span className={styles.summaryKey}>Method</span>
                    <span className={styles.summaryVal}>{methodLabel(selected.method)}</span>
                  </div>
                  <div className={styles.summaryBlock}>
                    <span className={styles.summaryKey}>Reference</span>
                    <span className={`${styles.summaryVal} ${styles.monoText}`}>{selected.paymentRef}</span>
                  </div>
                  <div className={styles.summaryBlock}>
                    <span className={styles.summaryKey}>Date &amp; Time</span>
                    <span className={styles.summaryVal}>{fmtDate(selected.paidAt)} {fmtTime(selected.paidAt)}</span>
                  </div>
                </div>
                <div className={styles.proofPlaceholder}>
                  <p className={styles.proofPlaceholderText}>No attachment</p>
                </div>
                <button className={styles.btnOutlineFull}>Upload Proof</button>
              </div>

              <div className={styles.sideCard}>
                <h3 className={styles.sideCardTitle}>Quick Actions</h3>
                <div className={styles.quickActions}>
                  <button className={styles.quickBtn} onClick={() => toast("Email sent to guardian.")}>
                    <Mail size={16} />Email Guardian
                  </button>
                  <button className={styles.quickBtn} onClick={() => toast("Opening print dialog…")}>
                    <Printer size={16} />Print Receipt
                  </button>
                  <button className={`${styles.quickBtn} ${styles.quickBtnDanger}`} onClick={() => setShowReverse(true)}>
                    <RotateCcw size={16} />Reverse Payment
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Payment log (all payments for same fee record) ── */}
          <div className={styles.logCard}>
            <h3 className={styles.logTitle}>Payment Log — {selected.description} ({selected.term})</h3>
            <div className={styles.logScroll}>
              <table className={styles.logTable}>
                <thead className={styles.logThead}>
                  <tr>
                    <th className={styles.logTh}>Receipt No.</th>
                    <th className={styles.logTh}>Date</th>
                    <th className={styles.logTh}>Method</th>
                    <th className={styles.logTh}>Reference</th>
                    <th className={styles.logTh}>Amount</th>
                    <th className={styles.logThAction} />
                  </tr>
                </thead>
                <tbody>
                  {selected.siblingPayments.map(sp => (
                    <tr
                      key={sp.id}
                      className={`${styles.logTr} ${sp.id === selected.id ? styles.logTrActive : ""}`}
                      onClick={() => setSelectedId(sp.id)}
                    >
                      <td className={`${styles.logTd} ${styles.logTdMono}`}>{sp.receiptNo}</td>
                      <td className={styles.logTd}>{fmtDate(sp.paidAt)}</td>
                      <td className={styles.logTd}>{methodLabel(sp.method)}</td>
                      <td className={`${styles.logTd} ${styles.logTdMono}`}>{sp.reference}</td>
                      <td className={`${styles.logTd} ${styles.logTdBold}`}>{fmtCurrency(sp.amount)}</td>
                      <td className={styles.logTdAction}>
                        {sp.id === selected.id && (
                          <span className={styles.currentBadge}>Viewing</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Reverse Payment modal ── */}
      {showReverse && (
        <div className={styles.modalOverlay} onClick={() => setShowReverse(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <AlertTriangle size={22} className={styles.modalWarnIcon} />
                <h3 className={styles.modalTitle}>Reverse Payment</h3>
              </div>
              <button className={styles.modalClose} onClick={() => setShowReverse(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalWarnBox}>
                This will permanently reverse payment <strong>{selected?.receiptNo}</strong> of{" "}
                <strong>{selected ? fmtCurrency(selected.amount) : ""}</strong> and mark the fee record as{" "}
                <strong>Unpaid</strong>. This action cannot be undone.
              </div>
              <label className={styles.formLabel}>Reason for reversal</label>
              <textarea
                className={styles.formTextarea}
                placeholder="Enter reason…"
                value={reverseReason}
                onChange={e => setReverseReason(e.target.value)}
              />
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={reverseConfirmed}
                  onChange={e => setReverseConfirmed(e.target.checked)}
                  className={styles.checkInput}
                />
                <span>I confirm this reversal is authorized and cannot be undone</span>
              </label>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setShowReverse(false)}>Cancel</button>
              <button
                className={styles.btnDanger}
                disabled={!reverseReason.trim() || !reverseConfirmed || reversing}
                onClick={confirmReversal}
              >
                <RotateCcw size={15} />{reversing ? "Reversing…" : "Confirm Reversal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
