"use client";

import { useState } from "react";
import {
  Download, BarChart2, Subscript, History, CalendarCheck, Wallet,
  ArrowUp, ArrowDown, Minus, TrendingUp, TrendingDown,
} from "lucide-react";
import styles from "./ReportsScreen.module.css";

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
type AttendanceSummary = { rate: number | null; total: number; present: number; absent: number; late: number; excused: number };
type FeeCollection = {
  totalDue: number; collected: number; outstanding: number; feeRate: number | null;
  byClass: { id: string; name: string; due: number; paid: number; rate: number | null }[];
};

type Props = {
  academicContext: string;
  termPerformance: TermPerformance;
  subjectMastery: SubjectMastery[];
  teacherGradingPatterns: TeacherPattern[];
  attendanceSummary: AttendanceSummary;
  feeCollection: FeeCollection;
};

type CatalogKey = "term-performance" | "subject-mastery" | "grading-patterns" | "attendance-summary" | "fee-collection";

const CATALOG: { key: CatalogKey; label: string; Icon: typeof BarChart2 }[] = [
  { key: "term-performance", label: "Term Performance Summary", Icon: BarChart2 },
  { key: "subject-mastery", label: "Subject Mastery Analysis", Icon: Subscript },
  { key: "grading-patterns", label: "Teacher Grading Patterns", Icon: History },
  { key: "attendance-summary", label: "Attendance Summary", Icon: CalendarCheck },
  { key: "fee-collection", label: "Fee Collection", Icon: Wallet },
];

function fmtGHS(n: number) {
  return n >= 1000 ? `GHS ${(n / 1000).toFixed(1)}k` : `GHS ${n.toFixed(0)}`;
}

function TrendChip({ value }: { value: number | null }) {
  if (value === null) return <span className={`${styles.trendChip} ${styles.trendFlat}`}><Minus size={12} /> —</span>;
  if (value > 0) return <span className={`${styles.trendChip} ${styles.trendUp}`}><TrendingUp size={12} /> +{value}%</span>;
  if (value < 0) return <span className={`${styles.trendChip} ${styles.trendDown}`}><TrendingDown size={12} /> {value}%</span>;
  return <span className={`${styles.trendChip} ${styles.trendFlat}`}><Minus size={12} /> 0.0%</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    "high-performer": { label: "High Performer", cls: styles.statusHigh },
    stable: { label: "Stable", cls: styles.statusStable },
    "at-risk": { label: "At Risk", cls: styles.statusRisk },
    "fees-outstanding": { label: "Fees Outstanding", cls: styles.statusFees },
    "no-data": { label: "No Data", cls: styles.statusStable },
  };
  const entry = map[status] ?? { label: status, cls: styles.statusStable };
  return <span className={`${styles.statusBadge} ${entry.cls}`}>{entry.label}</span>;
}

export function ReportsContent({
  academicContext, termPerformance, subjectMastery, teacherGradingPatterns, attendanceSummary, feeCollection,
}: Props) {
  const [active, setActive] = useState<CatalogKey>("term-performance");
  const activeItem = CATALOG.find((c) => c.key === active)!;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Reports</h1>
          <p className={styles.subtitle}>School-wide analytics and insights · {academicContext}</p>
        </div>
        <button className={styles.btn} onClick={() => window.print()} type="button">
          <Download size={16} /> Export
        </button>
      </div>

      <div className={styles.split}>
        {/* Catalog */}
        <aside className={styles.catalog}>
          <div className={styles.catalogHeader}><h3 className={styles.catalogHeaderTitle}>Report Catalog</h3></div>
          <div className={styles.catalogList}>
            {CATALOG.map(({ key, label, Icon }) => (
              <button
                key={key}
                className={`${styles.catalogItem} ${active === key ? styles.catalogItemActive : ""}`}
                onClick={() => setActive(key)}
                type="button"
              >
                <Icon size={18} className={styles.catalogIcon} /> {label}
              </button>
            ))}
          </div>
        </aside>

        {/* Detail */}
        <div className={styles.detail}>
          <div className={styles.detailHeader}>
            <h3 className={styles.detailTitle}>{activeItem.label}</h3>
            <span className={styles.liveTag}><span className={styles.liveDot} /> Data Current</span>
          </div>

          {active === "term-performance" && (
            <>
              <div className={styles.kpiRow}>
                <div className={styles.kpiCard}>
                  <p className={styles.kpiLabel}>Class Average</p>
                  <div className={styles.kpiValueRow}>
                    <span className={styles.kpiValue}>{termPerformance.classAverage ?? "—"}{termPerformance.classAverage !== null ? "%" : ""}</span>
                    {termPerformance.trendPts !== null && (
                      <span className={`${styles.kpiDelta} ${termPerformance.trendPts > 0 ? styles.deltaUp : termPerformance.trendPts < 0 ? styles.deltaDown : styles.deltaFlat}`}>
                        {termPerformance.trendPts > 0 ? <ArrowUp size={12} /> : termPerformance.trendPts < 0 ? <ArrowDown size={12} /> : null} {termPerformance.trendPts}%
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.kpiCard}>
                  <p className={styles.kpiLabel}>Highest Score</p>
                  <div className={styles.kpiValueRow}>
                    <span className={styles.kpiValue}>{termPerformance.highest?.score ?? "—"}</span>
                    {termPerformance.highest && <span style={{ fontSize: "var(--text-xs)", color: "var(--clr-app-muted)" }}>{termPerformance.highest.subject}</span>}
                  </div>
                </div>
                <div className={styles.kpiCard}>
                  <p className={styles.kpiLabel}>Pass Rate</p>
                  <div className={styles.kpiValueRow}>
                    <span className={styles.kpiValue}>{termPerformance.passRate ?? "—"}{termPerformance.passRate !== null ? "%" : ""}</span>
                  </div>
                </div>
                <div className={`${styles.kpiCard} ${styles.kpiCardWarn}`}>
                  <p className={`${styles.kpiLabel} ${styles.kpiLabelWarn}`}>At-Risk Students</p>
                  <div className={styles.kpiValueRow}>
                    <span className={`${styles.kpiValue} ${styles.kpiValueWarn}`}>{termPerformance.atRiskCount}</span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--clr-warning)" }}>Requires attention</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className={styles.chartTitle}>Subject Averages</h4>
                {termPerformance.subjectAverages.length === 0 ? (
                  <div className={styles.emptyState}>No grades recorded for the current term yet.</div>
                ) : (
                  <div className={styles.barChart}>
                    {termPerformance.subjectAverages.map((s) => (
                      <div key={s.subject} className={styles.barGroup}>
                        <span className={styles.barValue}>{s.average}%</span>
                        <div className={`${styles.bar} ${s.average < 50 ? styles.barBelowPass : ""}`} style={{ height: `${Math.max(4, s.average)}%` }} />
                        <span className={styles.barLabel}>{s.subject}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className={styles.chartTitle}>Class Performance</h4>
                {termPerformance.classPerformance.length === 0 ? (
                  <div className={styles.emptyState}>No class performance data for the current term yet.</div>
                ) : (
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th className={styles.th}>Class</th>
                          <th className={styles.th}>Average Score</th>
                          <th className={styles.th}>Trend</th>
                          <th className={styles.th}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {termPerformance.classPerformance.map((c) => (
                          <tr key={c.id} className={styles.tr}>
                            <td className={styles.td} style={{ fontWeight: 600 }}>{c.name}</td>
                            <td className={styles.td}>{c.average}%</td>
                            <td className={styles.td}><TrendChip value={c.trend} /></td>
                            <td className={styles.td}><StatusBadge status={c.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {active === "subject-mastery" && (
            subjectMastery.length === 0 ? (
              <div className={styles.emptyState}>No grades recorded for the current term yet.</div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Subject</th>
                      <th className={styles.th}>Average</th>
                      <th className={styles.th}>Highest</th>
                      <th className={styles.th}>Below Pass Mark</th>
                      <th className={styles.th}>Grades Recorded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectMastery.map((s) => (
                      <tr key={s.subject} className={styles.tr}>
                        <td className={styles.td} style={{ fontWeight: 600 }}>{s.subject}</td>
                        <td className={styles.td}>{s.average}%</td>
                        <td className={styles.td}>{s.highest}%</td>
                        <td className={styles.td}>{s.belowPass}</td>
                        <td className={`${styles.td} ${styles.tdMuted}`}>{s.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {active === "grading-patterns" && (
            teacherGradingPatterns.length === 0 ? (
              <div className={styles.emptyState}>No grades recorded yet.</div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Teacher</th>
                      <th className={styles.th}>Grades Entered</th>
                      <th className={styles.th}>Average Score Awarded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherGradingPatterns.map((t) => (
                      <tr key={t.teacher} className={styles.tr}>
                        <td className={styles.td} style={{ fontWeight: 600 }}>{t.teacher}</td>
                        <td className={styles.td}>{t.gradesEntered}</td>
                        <td className={styles.td}>{t.average}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {active === "attendance-summary" && (
            <>
              <div className={styles.simpleGrid}>
                <div className={styles.simpleCard}><div className={styles.simpleValue}>{attendanceSummary.rate ?? "—"}{attendanceSummary.rate !== null ? "%" : ""}</div><div className={styles.simpleLabel}>Attendance Rate</div></div>
                <div className={styles.simpleCard}><div className={styles.simpleValue}>{attendanceSummary.present}</div><div className={styles.simpleLabel}>Present</div></div>
                <div className={styles.simpleCard}><div className={styles.simpleValue}>{attendanceSummary.absent}</div><div className={styles.simpleLabel}>Absent</div></div>
                <div className={styles.simpleCard}><div className={styles.simpleValue}>{attendanceSummary.late + attendanceSummary.excused}</div><div className={styles.simpleLabel}>Late / Excused</div></div>
              </div>
              <p className={styles.tdMuted} style={{ fontSize: "var(--text-xs)" }}>Based on {attendanceSummary.total.toLocaleString()} recorded attendance entries, all classes, all time.</p>
            </>
          )}

          {active === "fee-collection" && (
            <>
              <div className={styles.simpleGrid}>
                <div className={styles.simpleCard}><div className={styles.simpleValue}>{fmtGHS(feeCollection.totalDue)}</div><div className={styles.simpleLabel}>Total Due</div></div>
                <div className={styles.simpleCard}><div className={styles.simpleValue}>{fmtGHS(feeCollection.collected)}</div><div className={styles.simpleLabel}>Collected</div></div>
                <div className={styles.simpleCard}><div className={styles.simpleValue}>{fmtGHS(feeCollection.outstanding)}</div><div className={styles.simpleLabel}>Outstanding</div></div>
                <div className={styles.simpleCard}><div className={styles.simpleValue}>{feeCollection.feeRate ?? "—"}{feeCollection.feeRate !== null ? "%" : ""}</div><div className={styles.simpleLabel}>Collection Rate</div></div>
              </div>
              {feeCollection.byClass.length > 0 && (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.th}>Class</th>
                        <th className={`${styles.th} ${styles.thRight}`}>Due</th>
                        <th className={`${styles.th} ${styles.thRight}`}>Collected</th>
                        <th className={`${styles.th} ${styles.thRight}`}>Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feeCollection.byClass.map((c) => (
                        <tr key={c.id} className={styles.tr}>
                          <td className={styles.td} style={{ fontWeight: 600 }}>{c.name}</td>
                          <td className={`${styles.td} ${styles.tdRight}`}>{fmtGHS(c.due)}</td>
                          <td className={`${styles.td} ${styles.tdRight}`}>{fmtGHS(c.paid)}</td>
                          <td className={`${styles.td} ${styles.tdRight}`}>{c.rate ?? "—"}{c.rate !== null ? "%" : ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
