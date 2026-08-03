"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Wallet, GraduationCap, Users, FileText, AlertTriangle, BarChart3 } from "lucide-react";
import { currency } from "@backend/utils";
import styles from "./MobileReportsContent.module.css";

type Category = "academic" | "attendance" | "finance" | "students";

interface Props {
  academicContext: string;
  classAverage: number | null;
  activeStudentsCount: number;
  attendanceSummary: { rate: number | null; total: number; present: number; absent: number; late: number; excused: number };
  feeCollection: { totalDue: number; collected: number; outstanding: number; feeRate: number | null; byClass: { id: string; name: string; due: number; paid: number; rate: number | null }[] };
  overdueInvoiceCount: number;
  weeklyAttendanceTrend: { label: string; pct: number }[];
}

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "academic", label: "Academic" },
  { key: "attendance", label: "Attendance" },
  { key: "finance", label: "Finance" },
  { key: "students", label: "Students" },
];

export function MobileReportsContent({
  academicContext, classAverage, activeStudentsCount, attendanceSummary, feeCollection, overdueInvoiceCount, weeklyAttendanceTrend,
}: Props) {
  const [category, setCategory] = useState<Category>("academic");

  const reports = useMemo(() => [
    {
      id: "attendance-summary",
      category: "attendance" as Category,
      icon: CalendarDays,
      title: "Attendance Summary",
      subtitle: `${attendanceSummary.total} records this year`,
      href: "/attendance/reports",
      tone: "default" as const,
    },
    {
      id: "fee-overdue",
      category: "finance" as Category,
      icon: Wallet,
      title: overdueInvoiceCount > 0 ? "Fee Collection Overdue" : "Fee Collection",
      subtitle: overdueInvoiceCount > 0 ? `${overdueInvoiceCount} invoices are currently past due.` : "All invoices up to date.",
      href: "/fees",
      tone: overdueInvoiceCount > 0 ? ("danger" as const) : ("default" as const),
    },
    {
      id: "grade-performance",
      category: "academic" as Category,
      icon: GraduationCap,
      title: "Grade Performance",
      subtitle: classAverage !== null ? `Class average ${classAverage}%` : "No grades recorded yet",
      href: "/gradebook/reports",
      tone: "default" as const,
    },
    {
      id: "student-directory",
      category: "students" as Category,
      icon: Users,
      title: "Student Directory",
      subtitle: `${activeStudentsCount} active students`,
      href: "/students",
      tone: "default" as const,
    },
  ], [attendanceSummary.total, overdueInvoiceCount, classAverage, activeStudentsCount]);

  const filteredReports = reports.filter((r) => r.category === category);
  const maxTrend = Math.max(...weeklyAttendanceTrend.map((w) => w.pct), 1);

  return (
    <div className={styles.root}>
      <p className={styles.contextLine}>{academicContext}</p>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}><CalendarDays size={14} /><span>Attendance</span></div>
          <strong className={styles.kpiValue}>{attendanceSummary.rate !== null ? `${attendanceSummary.rate}%` : "—"}</strong>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}><Wallet size={14} /><span>Fees Collected</span></div>
          <strong className={styles.kpiValue}>{currency(feeCollection.collected)}</strong>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}><GraduationCap size={14} /><span>Avg Grade</span></div>
          <strong className={styles.kpiValue}>{classAverage !== null ? `${classAverage}%` : "—"}</strong>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}><Users size={14} /><span>Active Students</span></div>
          <strong className={styles.kpiValue}>{activeStudentsCount}</strong>
        </div>
      </div>

      <div className={styles.chipRow}>
        {CATEGORIES.map((c) => (
          <button key={c.key} type="button" className={`${styles.chip} ${category === c.key ? styles.chipActive : ""}`} onClick={() => setCategory(c.key)}>
            {c.label}
          </button>
        ))}
      </div>

      <section className={styles.reportsSection}>
        <h3 className={styles.sectionTitle}>Featured Reports</h3>
        {filteredReports.length === 0 ? (
          <p className={styles.emptyText}>No reports in this category.</p>
        ) : filteredReports.map((r) => (
          <Link key={r.id} href={r.href} className={`${styles.reportCard} ${r.tone === "danger" ? styles.reportCardDanger : ""}`}>
            <span className={`${styles.reportIcon} ${r.tone === "danger" ? styles.reportIconDanger : ""}`}>
              {r.tone === "danger" ? <AlertTriangle size={18} /> : <r.icon size={18} />}
            </span>
            <div className={styles.reportBody}>
              <h4 className={`${styles.reportTitle} ${r.tone === "danger" ? styles.reportTitleDanger : ""}`}>{r.title}</h4>
              <p className={styles.reportSubtitle}>{r.subtitle}</p>
            </div>
          </Link>
        ))}
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}><BarChart3 size={16} /> Attendance Trends (Last 5 Weeks)</h3>
        <div className={styles.chart}>
          {weeklyAttendanceTrend.map((w) => (
            <div key={w.label} className={styles.chartCol}>
              <div className={styles.chartTrack}>
                <div className={styles.chartBar} style={{ height: `${(w.pct / maxTrend) * 100}%` }} title={`${w.pct}%`} />
              </div>
              <span className={styles.chartLabel}>{w.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.reportHeaderRow}>
          <h3 className={styles.cardTitle}><FileText size={16} /> Fees by Class</h3>
        </div>
        {feeCollection.byClass.length === 0 ? (
          <p className={styles.emptyText}>No fee records yet.</p>
        ) : (
          <div className={styles.classList}>
            {feeCollection.byClass.slice(0, 6).map((c) => (
              <div key={c.id} className={styles.classRow}>
                <span className={styles.classRowName}>{c.name}</span>
                <span className={styles.classRowRate}>{c.rate !== null ? `${c.rate}%` : "—"}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
