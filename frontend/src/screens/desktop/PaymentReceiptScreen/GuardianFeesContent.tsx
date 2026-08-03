"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import styles from "./GuardianFeesContent.module.css";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface GuardianFeeRow {
  feeRecordId: string;
  invoiceNo: string;
  term: string;
  description: string;
  dueDate: string; // ISO — createdAt + 30 days
  amountDue: number;
  totalPaid: number;
  balance: number;
  feeStatus: string;
  payments: {
    id: string;
    receiptNo: string;
    amount: number;
    method: string;
    paidAt: string;
  }[];
}

export interface GuardianFeesProps {
  studentName: string;
  className: string;
  rows: GuardianFeeRow[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `GHS ${n.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    paid:    { bg: "#c9ecc5", color: "#186429", label: "Paid" },
    partial: { bg: "#fff0cc", color: "#7a4a00", label: "Partial" },
    unpaid:  { bg: "#ffdad6", color: "#ba1a1a", label: "Unpaid" },
  };
  const s = map[status] ?? { bg: "#e8e8e8", color: "#41484b", label: status };
  return (
    <span
      style={{
        display: "inline-flex",
        padding: "2px 10px",
        borderRadius: 4,
        fontSize: "var(--text-xs)",
        fontWeight: 600,
        background: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className={styles.statCard}>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue} style={accent ? { color: accent } : {}}>
        {value}
      </p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function GuardianFeesContent({
  studentName,
  className,
  rows,
}: GuardianFeesProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalBilled = rows.reduce((s, r) => s + r.amountDue, 0);
  const totalPaid   = rows.reduce((s, r) => s + r.totalPaid, 0);
  const outstanding = rows.reduce((s, r) => s + r.balance,  0);

  const unpaidRows = rows.filter(r => r.feeStatus !== "paid");
  const nextDue =
    unpaidRows.length > 0
      ? unpaidRows.reduce(
          (min, r) => (r.dueDate < min ? r.dueDate : min),
          unpaidRows[0].dueDate,
        )
      : null;

  function toggle(id: string) {
    setExpandedId(prev => (prev === id ? null : id));
  }

  return (
    <div className={styles.root}>
      {/* Page header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>School Fees</h1>
          <p className={styles.subtitle}>
            Your child&apos;s fee records and payment history
          </p>
        </div>
        <div className={styles.studentBadge}>
          <span className={styles.studentName}>{studentName}</span>
          <span className={styles.studentClass}>{className}</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className={styles.statsGrid}>
        <StatCard label="Total Billed" value={fmt(totalBilled)} />
        <StatCard
          label="Total Paid"
          value={fmt(totalPaid)}
          accent="#186429"
        />
        <StatCard
          label="Outstanding"
          value={fmt(outstanding)}
          accent={outstanding > 0 ? "#ba1a1a" : "#186429"}
        />
        <StatCard
          label="Next Due"
          value={nextDue ? fmtDate(nextDue) : "—"}
        />
      </div>

      {/* Invoices table */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Fee Invoices</h2>
        </div>

        {rows.length === 0 ? (
          <div className={styles.empty}>No fee records found.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 32 }} />
                  <th>Invoice No</th>
                  <th>Term</th>
                  <th>Description</th>
                  <th>Due Date</th>
                  <th className={styles.right}>Amount Due</th>
                  <th className={styles.right}>Paid</th>
                  <th className={styles.right}>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const isOpen = expandedId === row.feeRecordId;
                  return (
                    <Fragment key={row.feeRecordId}>
                      <tr
                        className={styles.dataRow}
                        onClick={() => toggle(row.feeRecordId)}
                        style={{ cursor: "pointer" }}
                      >
                        <td className={styles.chevronCell}>
                          {isOpen
                            ? <ChevronDown size={14} />
                            : <ChevronRight size={14} />}
                        </td>
                        <td className={styles.mono}>{row.invoiceNo}</td>
                        <td>{row.term}</td>
                        <td>{row.description}</td>
                        <td>{fmtDate(row.dueDate)}</td>
                        <td className={styles.right}>{fmt(row.amountDue)}</td>
                        <td className={styles.right}>{fmt(row.totalPaid)}</td>
                        <td className={styles.right}>{fmt(row.balance)}</td>
                        <td><StatusBadge status={row.feeStatus} /></td>
                      </tr>

                      {isOpen && (
                        <tr className={styles.expandedRow}>
                          <td colSpan={9}>
                            <div className={styles.expandInner}>
                              <p className={styles.expandLabel}>
                                Payment History
                              </p>
                              {row.payments.length === 0 ? (
                                <p className={styles.expandEmpty}>
                                  No payments recorded yet.
                                </p>
                              ) : (
                                <table className={styles.subTable}>
                                  <thead>
                                    <tr>
                                      <th>Receipt No</th>
                                      <th>Date</th>
                                      <th>Method</th>
                                      <th className={styles.right}>Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {row.payments.map(p => (
                                      <tr key={p.id}>
                                        <td className={styles.mono}>
                                          {p.receiptNo}
                                        </td>
                                        <td>{fmtDate(p.paidAt)}</td>
                                        <td style={{ textTransform: "capitalize" }}>
                                          {p.method.replace(/_/g, " ")}
                                        </td>
                                        <td className={styles.right}>
                                          {fmt(p.amount)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
