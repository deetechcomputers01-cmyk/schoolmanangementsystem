"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Wallet, GraduationCap, Users, FileText, AlertTriangle, BarChart3, BookMarked, History } from "lucide-react";
import { currency } from "@backend/utils";
import styles from "./MobileReportsContent.module.css";

type Category = "academic" | "attendance" | "finance" | "students";

type SubjectAverage = { subject: string; average: number };
type ClassPerf = { id: string; name: string; average: number | null; trend: number | null; status: string };
type TermPerformance = {
  classAverage: number | null;
  trendPts: number | null;
  passRate: number | null;
  highest: { score: number; subject: string } | null;
  atRiskCount: number;
  subjectAverages: SubjectAverage[];
  classPerformance: ClassPerf[];
};
type SubjectMastery = { subject: string; average: number; highest: number; belowPass: number; total: number };
type TeacherPattern = { teacher: string; average: number; gradesEntered: number };

type CatalogKey = "term-performance" | "subject-mastery" | "grading-patterns" | "attendance-summary" | "fee-collection";
const CATALOG: { key: CatalogKey; label: string; Icon: typeof BarChart3 }[] = [
  { key: "term-performance", label: "Term Performance", Icon: BarChart3 },
  { key: "subject-mastery", label: "Subject Mastery", Icon: BookMarked },
  { key: "grading-patterns", label: "Grading Patterns", Icon: History },
  { key: "attendance-summary", label: "Attendance", Icon: CalendarDays },
  { key: "fee-collection", label: "Fee Collection", Icon: Wallet },
];

function fmtGHS(n: number) {
  return n >= 1000 ? `GHS ${(n / 1000).toFixed(1)}k` : `GHS ${n.toFixed(0)}`;
}
function trendLabel(v: number | null) {
  if (v === null) return "—";
  if (v > 0) return `+${v}%`;
  if (v < 0) return `${v}%`;
  return "0.0%";
}
const STATUS_LABEL: Record<string, string> = {
  "high-performer": "High Performer", stable: "Stable", "at-risk": "At Risk",
  "fees-outstanding": "Fees Outstanding", "no-data": "No Data",
};

interface Props {
  academicContext: string;
  classAverage: number | null;
  activeStudentsCount: number;
  attendanceSummary: { rate: number | null; total: number; present: number; absent: number; late: number; excused: number };
  feeCollection: { totalDue: number; collected: number; outstanding: number; feeRate: number | null; byClass: { id: string; name: string; due: number; paid: number; rate: number | null }[] };
  overdueInvoiceCount: number;
  weeklyAttendanceTrend: { label: string; pct: number }[];
  termPerformance: TermPerformance;
  subjectMastery: SubjectMastery[];
  teacherGradingPatterns: TeacherPattern[];
}

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "academic", label: "Academic" },
  { key: "attendance", label: "Attendance" },
  { key: "finance", label: "Finance" },
  { key: "students", label: "Students" },
];

export function MobileReportsContent({
  academicContext, classAverage, activeStudentsCount, attendanceSummary, feeCollection, overdueInvoiceCount, weeklyAttendanceTrend,
  termPerformance, subjectMastery, teacherGradingPatterns,
}: Props) {
  const [category, setCategory] = useState<Category>("academic");
  const [activeReport, setActiveReport] = useState<CatalogKey>("term-performance");

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

      <section className={styles.reportsSection}>
        <h3 className={styles.sectionTitle}>Report Catalog</h3>
        <div className={styles.chipRow}>
          {CATALOG.map(({ key, label, Icon }) => (
            <button key={key} type="button" className={`${styles.chip} ${activeReport === key ? styles.chipActive : ""}`} onClick={() => setActiveReport(key)}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {activeReport === "term-performance" && (
          <div className={styles.card}>
            <div className={styles.kpiGrid}>
              <div className={styles.kpiCard}>
                <div className={styles.kpiTop}><span>Class Average</span></div>
                <strong className={styles.kpiValue}>{termPerformance.classAverage ?? "—"}{termPerformance.classAverage !== null ? "%" : ""}</strong>
                {termPerformance.trendPts !== null && <span className={styles.kpiTrend}>{trendLabel(termPerformance.trendPts)}</span>}
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiTop}><span>Highest Score</span></div>
                <strong className={styles.kpiValue}>{termPerformance.highest?.score ?? "—"}</strong>
                {termPerformance.highest && <span className={styles.kpiTrend}>{termPerformance.highest.subject}</span>}
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiTop}><span>Pass Rate</span></div>
                <strong className={styles.kpiValue}>{termPerformance.passRate ?? "—"}{termPerformance.passRate !== null ? "%" : ""}</strong>
              </div>
              <div className={`${styles.kpiCard} ${styles.kpiCardWarn}`}>
                <div className={styles.kpiTop}><span>At-Risk</span></div>
                <strong className={styles.kpiValue}>{termPerformance.atRiskCount}</strong>
              </div>
            </div>

            <h4 className={styles.subCardTitle}>Subject Averages</h4>
            {termPerformance.subjectAverages.length === 0 ? (
              <p className={styles.emptyText}>No grades recorded for the current term yet.</p>
            ) : (
              <div className={styles.hbarList}>
                {termPerformance.subjectAverages.map((s) => (
                  <div key={s.subject} className={styles.hbarRow}>
                    <span className={styles.hbarLabel}>{s.subject}</span>
                    <div className={styles.hbarTrack}><div className={`${styles.hbarFill} ${s.average < 50 ? styles.hbarFillBad : ""}`} style={{ width: `${Math.max(4, s.average)}%` }} /></div>
                    <span className={styles.hbarValue}>{s.average}%</span>
                  </div>
                ))}
              </div>
            )}

            <h4 className={styles.subCardTitle}>Class Performance</h4>
            {termPerformance.classPerformance.length === 0 ? (
              <p className={styles.emptyText}>No class performance data yet.</p>
            ) : (
              <div className={styles.classList}>
                {termPerformance.classPerformance.map((c) => (
                  <div key={c.id} className={styles.classRow}>
                    <span className={styles.classRowName}>{c.name}</span>
                    <span className={styles.classRowRate}>{c.average}% · {trendLabel(c.trend)} · {STATUS_LABEL[c.status] ?? c.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeReport === "subject-mastery" && (
          <div className={styles.card}>
            {subjectMastery.length === 0 ? (
              <p className={styles.emptyText}>No grades recorded for the current term yet.</p>
            ) : subjectMastery.map((s) => (
              <div key={s.subject} className={styles.classRow}>
                <span className={styles.classRowName}>{s.subject}</span>
                <span className={styles.classRowRate}>Avg {s.average}% · High {s.highest}% · {s.belowPass} below pass · {s.total} graded</span>
              </div>
            ))}
          </div>
        )}

        {activeReport === "grading-patterns" && (
          <div className={styles.card}>
            {teacherGradingPatterns.length === 0 ? (
              <p className={styles.emptyText}>No grades recorded yet.</p>
            ) : teacherGradingPatterns.map((t) => (
              <div key={t.teacher} className={styles.classRow}>
                <span className={styles.classRowName}>{t.teacher}</span>
                <span className={styles.classRowRate}>{t.gradesEntered} entered · Avg {t.average}%</span>
              </div>
            ))}
          </div>
        )}

        {activeReport === "attendance-summary" && (
          <div className={styles.card}>
            <div className={styles.kpiGrid}>
              <div className={styles.kpiCard}><div className={styles.kpiTop}><span>Rate</span></div><strong className={styles.kpiValue}>{attendanceSummary.rate ?? "—"}{attendanceSummary.rate !== null ? "%" : ""}</strong></div>
              <div className={styles.kpiCard}><div className={styles.kpiTop}><span>Present</span></div><strong className={styles.kpiValue}>{attendanceSummary.present}</strong></div>
              <div className={styles.kpiCard}><div className={styles.kpiTop}><span>Absent</span></div><strong className={styles.kpiValue}>{attendanceSummary.absent}</strong></div>
              <div className={styles.kpiCard}><div className={styles.kpiTop}><span>Late / Excused</span></div><strong className={styles.kpiValue}>{attendanceSummary.late + attendanceSummary.excused}</strong></div>
            </div>
            <p className={styles.emptyText}>Based on {attendanceSummary.total.toLocaleString()} recorded entries, all classes, all time.</p>
          </div>
        )}

        {activeReport === "fee-collection" && (
          <div className={styles.card}>
            <div className={styles.kpiGrid}>
              <div className={styles.kpiCard}><div className={styles.kpiTop}><span>Total Due</span></div><strong className={styles.kpiValue}>{fmtGHS(feeCollection.totalDue)}</strong></div>
              <div className={styles.kpiCard}><div className={styles.kpiTop}><span>Collected</span></div><strong className={styles.kpiValue}>{fmtGHS(feeCollection.collected)}</strong></div>
              <div className={styles.kpiCard}><div className={styles.kpiTop}><span>Outstanding</span></div><strong className={styles.kpiValue}>{fmtGHS(feeCollection.outstanding)}</strong></div>
              <div className={styles.kpiCard}><div className={styles.kpiTop}><span>Rate</span></div><strong className={styles.kpiValue}>{feeCollection.feeRate ?? "—"}{feeCollection.feeRate !== null ? "%" : ""}</strong></div>
            </div>
            {feeCollection.byClass.length > 0 && (
              <div className={styles.classList}>
                {feeCollection.byClass.map((c) => (
                  <div key={c.id} className={styles.classRow}>
                    <span className={styles.classRowName}>{c.name}</span>
                    <span className={styles.classRowRate}>{fmtGHS(c.due)} due · {fmtGHS(c.paid)} paid · {c.rate ?? "—"}{c.rate !== null ? "%" : ""}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
