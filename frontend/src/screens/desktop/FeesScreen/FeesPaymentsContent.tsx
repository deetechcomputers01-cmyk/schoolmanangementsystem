"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, MoreVertical,
  Plus, PlusCircle, Search, Trash2, X,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import styles from "./FeesScreen.module.css";

export interface FeesInvoiceRow {
  id: string;
  invoiceNo: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  guardianName: string;
  guardianPhone: string;
  description: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  latePenalty: number;
  dueDate: string;
  isOverdue: boolean;
  status: "paid" | "pending" | "overdue";
  discountApplied: number;
  paidByScholarship: boolean;
  scholarship: { type: "percent" | "fixed"; value: number; reason: string | null } | null;
}

export interface FeesPaymentsProps {
  rows: FeesInvoiceRow[];
  stats: {
    expectedGHS: number;
    collectedGHS: number;
    outstandingGHS: number;
    overdueCount: number;
    overdueGHS: number;
    enrolledStudents: number;
  };
  classes: { id: string; name: string }[];
  students: { id: string; name: string; className: string }[];
  initialStudentId?: string;
  initialFeeRecordId?: string;
  recordPaymentOnLoad?: boolean;
}

const PAGE_SIZE = 8;

function fmtGHS(value: number) {
  return value.toLocaleString("en-GH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtGHS2(value: number) {
  return value.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function StatusBadge({ status, paidByScholarship }: { status: FeesInvoiceRow["status"]; paidByScholarship?: boolean }) {
  const cls = status === "paid" ? styles.badgePaid : status === "overdue" ? styles.badgeOverdue : styles.badgePending;
  const label = status === "paid" ? (paidByScholarship ? "Paid (Scholarship)" : "Paid") : status === "overdue" ? "Overdue" : "Pending";
  return <span className={cls}>{label}</span>;
}

function scholarshipLabel(scholarship: FeesInvoiceRow["scholarship"], discountApplied: number) {
  if (!scholarship || discountApplied <= 0) return null;
  const off = scholarship.type === "percent" ? `${scholarship.value}% off` : `GHS ${scholarship.value.toLocaleString()} off`;
  return scholarship.reason ? `${off} · ${scholarship.reason}` : off;
}

export function FeesPaymentsContent({
  rows,
  stats,
  classes,
  students,
  initialStudentId,
  initialFeeRecordId,
  recordPaymentOnLoad = false,
}: FeesPaymentsProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending" | "overdue">("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(
    (initialFeeRecordId && rows.find((r) => r.id === initialFeeRecordId)?.id) ?? rows[0]?.id ?? null,
  );

  // Create Invoice modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStudent, setCreateStudent] = useState(initialStudentId ?? "");
  const [createTerm, setCreateTerm] = useState("");
  const [createDueDate, setCreateDueDate] = useState("");
  const [lineItems, setLineItems] = useState<{ id: string; label: string; amount: string }[]>([
    { id: "tuition", label: "Tuition", amount: "" },
  ]);
  const [creating, setCreating] = useState(false);

  // Record Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<FeesInvoiceRow | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mobile_money" | "bank_transfer" | "card">("cash");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [recordingPayment, setRecordingPayment] = useState(false);

  const { showToast: showToastFn } = useToast();
  const initialActionHandled = useRef<string | null>(null);

  function toast(message: string) {
    showToastFn(message);
  }

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return rows.filter((row) => {
      if (query && !row.studentName.toLowerCase().includes(query) && !row.invoiceNo.toLowerCase().includes(query)) return false;
      if (classFilter && row.classId !== classFilter) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      return true;
    });
  }, [rows, search, classFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const startEntry = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endEntry = Math.min(safePage * PAGE_SIZE, filtered.length);

  const selected = rows.find((row) => row.id === selectedId) ?? null;
  const feeParts = selected ? selected.description.split(",").map((part) => part.trim()).filter(Boolean) : [];

  function openPaymentModal(row: FeesInvoiceRow) {
    setSelectedId(row.id);
    setPaymentTarget(row);
    setPaymentAmount((row.balance > 0 ? row.balance : row.amountDue).toFixed(2));
    setPaymentMethod("cash");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentReference(`RCT-${Date.now()}`);
    setShowPaymentModal(true);
  }

  useEffect(() => {
    if (!recordPaymentOnLoad) return;
    // Keyed on the specific request, not just "has any auto-open ever
    // fired" — this component stays mounted across client-side navigations
    // within /fees (only these props change), so a plain one-shot boolean
    // would open the modal for the first ?recordPayment=1 link clicked and
    // then silently ignore every later one for a different student/invoice.
    const key = `${initialStudentId ?? ""}|${initialFeeRecordId ?? ""}`;
    if (initialActionHandled.current === key) return;

    const targetRow =
      (initialFeeRecordId ? rows.find((row) => row.id === initialFeeRecordId) : null) ??
      (initialStudentId
        ? rows.find((row) => row.studentId === initialStudentId && row.balance > 0)
        : rows.find((row) => row.balance > 0));

    if (!targetRow) return;
    initialActionHandled.current = key;
    openPaymentModal(targetRow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFeeRecordId, initialStudentId, recordPaymentOnLoad, rows]);

  const invoiceTotal = lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const createStudentClass = students.find((student) => student.id === createStudent)?.className ?? "";

  function addLineItem() {
    setLineItems((current) => [...current, { id: `item-${Date.now()}`, label: "", amount: "" }]);
  }
  function removeLineItem(id: string) {
    setLineItems((current) => current.filter((item) => item.id !== id));
  }
  function updateLineItem(id: string, patch: Partial<{ label: string; amount: string }>) {
    setLineItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function openCreateModal() {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    setCreateDueDate(dueDate.toISOString().split("T")[0]);
    setCreateStudent(initialStudentId ?? "");
    setCreateTerm("");
    setLineItems([{ id: "tuition", label: "Tuition", amount: "" }]);
    setShowCreateModal(true);
  }

  async function handleCreateInvoice() {
    const description = lineItems.map((item) => item.label.trim()).filter(Boolean).join(", ");
    if (!createStudent || !createTerm || !description || invoiceTotal <= 0) return;

    setCreating(true);
    try {
      const response = await fetch("/api/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: createStudent,
          term: createTerm,
          description,
          amountDue: invoiceTotal,
        }),
      });

      if (!response.ok) throw new Error("Failed to create invoice");

      setShowCreateModal(false);
      toast("Invoice created successfully");
      router.refresh();
    } catch {
      toast("Failed to create invoice. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleSavePayment() {
    if (!paymentTarget || recordingPayment) return;

    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast("Enter a valid payment amount.");
      return;
    }

    setRecordingPayment(true);
    try {
      const response = await fetch("/api/fees/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feeRecordId: paymentTarget.id,
          amount,
          method: paymentMethod,
          reference: paymentReference.trim() || `RCT-${Date.now()}`,
        }),
      });

      if (!response.ok) throw new Error("Failed to record payment");

      setShowPaymentModal(false);
      toast(amount > paymentTarget.balance ? "Payment recorded with credit balance" : "Payment recorded successfully");
      router.refresh();
    } catch {
      toast("Failed to record payment. Please try again.");
    } finally {
      setRecordingPayment(false);
    }
  }

  const paymentAmountNumber = Number(paymentAmount || 0);
  const paymentRemaining = paymentTarget ? Math.max(0, paymentTarget.balance - paymentAmountNumber) : 0;
  const paymentCredit = paymentTarget ? Math.max(0, paymentAmountNumber - paymentTarget.balance) : 0;

  return (
    <div className={styles.root}>
      <div className={styles.canvas}>
        <div className={styles.pageHeader}>
          <div>
            <h2 className={styles.title}>Fees &amp; Payments</h2>
            <p className={styles.subtitle}>Track GHS invoices, balances, and payment collection.</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.btnOutline} onClick={openCreateModal} type="button">
              <PlusCircle size={16} />
              Create Invoice
            </button>
            <button
              className={styles.btnPrimary}
              type="button"
              onClick={() => {
                const target = (selected && selected.balance > 0 ? selected : null) ?? rows.find((r) => r.balance > 0);
                if (target) openPaymentModal(target);
                else toast("No outstanding invoices to record a payment against.");
              }}
            >
              <Plus size={16} />
              Record Payment
            </button>
          </div>
        </div>

        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Expected Fees</p>
            <p className={styles.kpiValue}>GHS {fmtGHS(stats.expectedGHS)}</p>
            <p className={styles.kpiMeta}>Based on {stats.enrolledStudents} enrolled students</p>
          </div>
          <div className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Collected</p>
            <p className={styles.kpiValue}>GHS {fmtGHS(stats.collectedGHS)}</p>
            <div className={styles.kpiProgressTrack}>
              <div
                className={styles.kpiProgressFill}
                style={{ width: `${stats.expectedGHS ? Math.min(100, (stats.collectedGHS / stats.expectedGHS) * 100) : 0}%` }}
              />
            </div>
            <p className={styles.kpiMeta}>
              {stats.expectedGHS ? ((stats.collectedGHS / stats.expectedGHS) * 100).toFixed(1) : "0"}% of expected total
            </p>
          </div>
          <div className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Outstanding</p>
            <p className={styles.kpiValue}>GHS {fmtGHS(stats.outstandingGHS)}</p>
            <p className={styles.kpiMeta}>Across {rows.filter((r) => r.balance > 0).length} students</p>
          </div>
          <div className={`${styles.kpiCard} ${styles.kpiCardOverdue}`}>
            <div className={styles.kpiOverdueRow}>
              <div>
                <p className={styles.kpiLabelOverdue}>Overdue Invoices</p>
                <p className={styles.kpiValue}>{stats.overdueCount}</p>
              </div>
              <AlertTriangle size={18} className={styles.kpiOverdueIcon} />
            </div>
            <p className={styles.kpiMetaOverdue}>Value: GHS {fmtGHS(stats.overdueGHS)}</p>
          </div>
        </div>

        <div className={styles.controlsRow}>
          <div className={styles.controlsLeft}>
            <div className={styles.searchWrapper}>
              <Search size={15} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                placeholder="Search invoices, students..."
              />
            </div>
            <select className={styles.filterSelect} value={classFilter} onChange={(event) => { setClassFilter(event.target.value); setPage(1); }}>
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className={styles.filterSelect} value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as typeof statusFilter); setPage(1); }}>
              <option value="all">Any Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className={styles.controlsRight}>
            <span>{filtered.length === 0 ? "No entries" : `Showing ${startEntry}-${endEntry} of ${filtered.length}`}</span>
            <button className={styles.pageIconBtn} disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)} type="button">
              <ChevronLeft size={15} />
            </button>
            <button className={styles.pageIconBtn} disabled={safePage >= totalPages} onClick={() => setPage((p) => p + 1)} type="button">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thCheck} />
                <th className={styles.th}>Invoice No</th>
                <th className={styles.th}>Student</th>
                <th className={styles.th}>Class</th>
                <th className={`${styles.th} ${styles.thRight}`}>Amount Due</th>
                <th className={`${styles.th} ${styles.thRight}`}>Balance</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Due Date</th>
                <th className={styles.thAction} />
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr><td colSpan={9} className={styles.emptyCell}>No invoices found</td></tr>
              )}
              {paged.map((row) => (
                <tr
                  key={row.id}
                  className={`${styles.tr} ${row.id === selectedId ? styles.trSelected : ""}`}
                  onClick={() => setSelectedId(row.id)}
                >
                  <td className={styles.tdCheck} onClick={(event) => event.stopPropagation()}>
                    <input type="checkbox" className={styles.checkbox} />
                  </td>
                  <td className={`${styles.td} ${styles.tdInvoice}`}>{row.invoiceNo}</td>
                  <td className={styles.td}>
                    <div className={styles.studentCell}>
                      <span className={styles.avatar}>{initialsOf(row.studentName)}</span>
                      <span className={styles.studentName}>{row.studentName}</span>
                    </div>
                  </td>
                  <td className={`${styles.td} ${styles.tdMuted}`}>{row.className}</td>
                  <td className={`${styles.td} ${styles.tdRight} ${styles.tdMono}`}>GHS {fmtGHS(row.amountDue)}</td>
                  <td className={`${styles.td} ${styles.tdRight} ${styles.tdMono} ${row.balance > 0 ? styles.tdBold : ""}`}>
                    GHS {fmtGHS(row.balance)}
                    {row.latePenalty > 0 && (
                      <span className={styles.tdRed} title={`Includes GHS ${fmtGHS2(row.latePenalty)} late-payment penalty`}> (+{fmtGHS(row.latePenalty)})</span>
                    )}
                  </td>
                  <td className={styles.td}><StatusBadge status={row.status} paidByScholarship={row.paidByScholarship} /></td>
                  <td className={`${styles.td} ${row.isOverdue ? styles.tdRed : styles.tdMuted}`}>{row.dueDate}</td>
                  <td className={styles.tdAction} onClick={(event) => event.stopPropagation()}>
                    <button className={styles.menuBtn} type="button" onClick={() => openPaymentModal(row)} title="Record payment">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <aside className={styles.detailPanel}>
        <div className={styles.detailHeader}>
          <h3>Invoice Details</h3>
          {selected && (
            <button className={styles.detailClose} onClick={() => setSelectedId(null)} type="button">
              <X size={18} />
            </button>
          )}
        </div>

        {selected ? (
          <div className={styles.detailBody}>
            <div className={styles.detailIdentity}>
              <span className={styles.detailAvatar}>{initialsOf(selected.studentName)}</span>
              <h4>{selected.studentName}</h4>
              <p>{selected.className} {"•"} {selected.invoiceNo}</p>
              <span className={styles.detailStatusChip}>
                <StatusBadge status={selected.status} paidByScholarship={selected.paidByScholarship} />
              </span>
              {scholarshipLabel(selected.scholarship, selected.discountApplied) && (
                <span className={styles.scholarshipBadge}>
                  {scholarshipLabel(selected.scholarship, selected.discountApplied)}
                </span>
              )}
            </div>

            <div className={styles.detailSummaryBox}>
              {selected.discountApplied > 0 && (
                <div className={styles.detailSummaryRow}>
                  <span>Scholarship Discount</span>
                  <strong className={styles.detailScholarshipValue}>- GHS {fmtGHS(selected.discountApplied)}</strong>
                </div>
              )}
              <div className={styles.detailSummaryRow}>
                <span>Total Due</span>
                <strong>GHS {fmtGHS(selected.amountDue)}</strong>
              </div>
              <div className={styles.detailSummaryRow}>
                <span>Amount Paid</span>
                <strong className={styles.detailPaidValue}>GHS {fmtGHS(selected.amountPaid)}</strong>
              </div>
              {selected.latePenalty > 0 && (
                <div className={styles.detailSummaryRow}>
                  <span className={styles.tdRed}>Late Payment Penalty</span>
                  <strong className={styles.tdRed}>GHS {fmtGHS2(selected.latePenalty)}</strong>
                </div>
              )}
              <div className={styles.detailDivider} />
              <div className={styles.detailSummaryRow}>
                <span className={styles.detailBalanceLabel}>Balance</span>
                <strong className={styles.detailBalanceValue}>GHS {fmtGHS(selected.balance)}</strong>
              </div>
            </div>

            <div className={styles.detailSection}>
              <h5>Fee Breakdown</h5>
              <ul className={styles.detailBreakdownList}>
                {feeParts.length > 0 ? feeParts.map((part) => (
                  <li key={part}>{part}</li>
                )) : <li>{selected.description}</li>}
              </ul>
            </div>

            <div className={styles.detailGuardianBox}>
              <h5>Primary Contact</h5>
              <p className={styles.detailGuardianName}>{selected.guardianName}</p>
              <p className={styles.detailGuardianPhone}>{selected.guardianPhone}</p>
              <button className={styles.detailReminderLink} type="button">Send Reminder SMS</button>
            </div>

            {selected.balance > 0 && (
              <button className={styles.detailPrimaryBtn} type="button" onClick={() => openPaymentModal(selected)}>
                Record Payment
              </button>
            )}
            <button className={styles.detailSecondaryBtn} type="button">Download Invoice</button>
          </div>
        ) : (
          <div className={styles.detailEmpty}>Select an invoice to see details.</div>
        )}
      </aside>

      {/* Record Payment modal */}
      {showPaymentModal && paymentTarget && (
        <div className={styles.modalOverlay} onClick={() => !recordingPayment && setShowPaymentModal(false)}>
          <div className={styles.modal} style={{ maxWidth: 560 }} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>Fee Invoices</p>
                <h3 className={styles.modalTitle}>Record Payment</h3>
                <p className={styles.modalSubtitle}>Log a payment against an outstanding invoice.</p>
              </div>
              <button className={styles.modalClose} onClick={() => !recordingPayment && setShowPaymentModal(false)} type="button">
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.invoiceSummaryCard}>
                <div className={styles.invoiceSummaryItem}>
                  <span className={styles.paymentSummaryLabel}>Student Name</span>
                  <strong className={styles.invoiceSummaryValue}>{paymentTarget.studentName}</strong>
                </div>
                <div className={styles.invoiceSummaryItem}>
                  <span className={styles.paymentSummaryLabel}>Invoice No</span>
                  <strong className={styles.invoiceSummaryValue}>{paymentTarget.invoiceNo}</strong>
                </div>
                <div className={`${styles.invoiceSummaryItem} ${styles.invoiceSummaryItemEnd}`}>
                  <span className={styles.paymentSummaryLabel}>Balance Due</span>
                  <strong className={styles.invoiceSummaryBalance}>GHS {fmtGHS2(paymentTarget.balance)}</strong>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <div className={styles.formLabelRow}>
                    <label className={styles.formLabel}>Amount Paid (GHS)</label>
                    <button type="button" className={styles.useFullBalanceLink} onClick={() => setPaymentAmount(paymentTarget.balance.toFixed(2))}>
                      Use full balance
                    </button>
                  </div>
                  <div className={styles.amountInputWrap}>
                    <span className={styles.amountPrefix}>GHS</span>
                    <input
                      className={`${styles.formInput} ${styles.amountInput}`}
                      inputMode="decimal"
                      min="0"
                      onChange={(event) => setPaymentAmount(event.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      type="number"
                      value={paymentAmount}
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Payment Method</label>
                  <select
                    className={styles.formSelect}
                    onChange={(event) => setPaymentMethod(event.target.value as typeof paymentMethod)}
                    value={paymentMethod}
                  >
                    <option value="cash">Cash</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Payment Date</label>
                <input
                  className={styles.formInput}
                  type="date"
                  onChange={(event) => setPaymentDate(event.target.value)}
                  value={paymentDate}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Reference / Note</label>
                <textarea
                  className={styles.formTextarea}
                  onChange={(event) => setPaymentReference(event.target.value)}
                  placeholder="Enter transaction ID, cheque number or internal notes..."
                  rows={3}
                  value={paymentReference}
                />
              </div>

              <div className={styles.paymentProjection}>
                <div className={styles.paymentProjectionRow}>
                  <span>Remaining after payment</span>
                  <strong>GHS {fmtGHS2(paymentRemaining)}</strong>
                </div>
                <div className={styles.paymentProjectionRow}>
                  <span>Credit after payment</span>
                  <strong className={paymentCredit > 0 ? styles.paymentCreditValue : undefined}>
                    GHS {fmtGHS2(paymentCredit)}
                  </strong>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setShowPaymentModal(false)} type="button">
                Cancel
              </button>
              <button className={styles.btnPrimary} disabled={recordingPayment} onClick={handleSavePayment} type="button">
                <CheckCircle size={16} />
                {recordingPayment ? "Saving..." : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modal} style={{ maxWidth: 620 }} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>Fee Invoices</p>
                <h3 className={styles.modalTitle}>Create Invoice</h3>
                <p className={styles.modalSubtitle}>Generate a new fee invoice for a student.</p>
              </div>
              <button className={styles.modalClose} onClick={() => setShowCreateModal(false)} type="button">
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Student Name</label>
                  <div className={styles.studentSearchWrap}>
                    <Search size={15} className={styles.studentSearchIcon} />
                    <select
                      className={`${styles.formSelect} ${styles.studentSearchSelect}`}
                      onChange={(event) => setCreateStudent(event.target.value)}
                      value={createStudent}
                    >
                      <option value="">Select student...</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>{student.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Class</label>
                  <input className={styles.formInput} value={createStudentClass} readOnly disabled placeholder="—" />
                </div>
              </div>

              <div className={styles.lineItemsSection}>
                <div className={styles.lineItemsHeader}>
                  <label className={styles.formLabel}>Fee Particulars</label>
                  <span className={styles.lineItemsAmountLabel}>Amount (GHS)</span>
                </div>
                <div className={styles.lineItemsList}>
                  {lineItems.map((item) => (
                    <div key={item.id} className={styles.lineItemRow}>
                      <input
                        className={styles.lineItemLabelInput}
                        value={item.label}
                        onChange={(event) => updateLineItem(item.id, { label: event.target.value })}
                        placeholder="e.g. Tuition"
                      />
                      <input
                        className={styles.lineItemAmountInput}
                        type="number"
                        step="0.01"
                        value={item.amount}
                        onChange={(event) => updateLineItem(item.id, { amount: event.target.value })}
                        placeholder="0.00"
                      />
                      <button
                        type="button"
                        className={styles.lineItemDelete}
                        onClick={() => removeLineItem(item.id)}
                        disabled={lineItems.length === 1}
                        aria-label="Remove line item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" className={styles.addLineItemBtn} onClick={addLineItem}>
                  <PlusCircle size={14} /> Add Line Item
                </button>
              </div>

              <div className={styles.modalDivider} />

              <div className={styles.invoiceFooterRow}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Academic Term</label>
                    <input
                      className={styles.formInput}
                      onChange={(event) => setCreateTerm(event.target.value)}
                      placeholder="e.g. Term 1 2026/2027"
                      value={createTerm}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Due Date</label>
                    <input
                      className={styles.formInput}
                      type="date"
                      value={createDueDate}
                      onChange={(event) => setCreateDueDate(event.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.invoiceTotalBlock}>
                  <p className={styles.paymentSummaryLabel}>Total Amount</p>
                  <p className={styles.invoiceTotalValue}>GHS {fmtGHS2(invoiceTotal)}</p>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setShowCreateModal(false)} type="button">
                Cancel
              </button>
              <button
                className={styles.btnPrimary}
                disabled={creating || !createStudent || !createTerm || invoiceTotal <= 0}
                onClick={handleCreateInvoice}
                type="button"
              >
                {creating ? "Creating..." : "Create Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
