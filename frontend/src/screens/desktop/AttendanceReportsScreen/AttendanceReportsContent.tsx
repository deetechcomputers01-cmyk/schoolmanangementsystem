"use client";

import { useState, useMemo } from "react";
import {
  FileText, Mail, BarChart2, X,
  Phone, MessageSquare, TrendingUp, AlertTriangle, CheckCircle,
} from "lucide-react";
import type { AbsenteeRow, WeeklyPoint, ClassBar } from "./AttendanceReportsScreen";
import styles from "./AttendanceReportsScreen.module.css";

interface Props {
  overallPct: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  totalRecords: number;
  topAbsentees: AbsenteeRow[];
  weeklyData: WeeklyPoint[];
  classData: ClassBar[];
}

function exportAttendanceCSV(topAbsentees: AbsenteeRow[], weeklyData: WeeklyPoint[], classData: ClassBar[]) {
  const sections: string[] = [];
  sections.push("Top Absentees");
  sections.push(["Name","Class","Days Absent","Consecutive Days","Status"].join(","));
  topAbsentees.forEach(s => sections.push([`"${s.studentName}"`, `"${s.className}"`, s.daysAbsent, s.consecutiveDays, s.status].join(",")));
  sections.push("");
  sections.push("Weekly Attendance");
  sections.push(["Week","Attendance %"].join(","));
  weeklyData.forEach(d => sections.push([`"${d.week}"`, `${d.pct}%`].join(",")));
  sections.push("");
  sections.push("Class Attendance");
  sections.push(["Class","Attendance %"].join(","));
  classData.forEach(c => sections.push([`"${c.label}"`, `${c.pct}%`].join(",")));
  const blob = new Blob([sections.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "attendance-report.csv"; a.click();
  URL.revokeObjectURL(url);
}

export function AttendanceReportsContent({
  overallPct, presentCount, absentCount, lateCount, excusedCount,
  totalRecords, topAbsentees, weeklyData, classData,
}: Props) {
  const [selectedStudent, setSelectedStudent] = useState<AbsenteeRow | null>(null);
  const [intervention, setIntervention] = useState("");
  const [classGroupFilter, setClassGroupFilter] = useState("");
  const [absenceStatusFilter, setAbsenceStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const uniqueClasses = useMemo(
    () => [...new Set(classData.map(c => c.label))].sort(),
    [classData]
  );

  const filteredAbsentees = useMemo(() => topAbsentees.filter(s => {
    if (classGroupFilter && s.className !== classGroupFilter) return false;
    if (absenceStatusFilter !== "all" && s.status.toLowerCase() !== absenceStatusFilter.toLowerCase()) return false;
    return true;
  }), [topAbsentees, classGroupFilter, absenceStatusFilter]);

  const chronics = filteredAbsentees.filter(s => s.status === "Critical").length;

  // SVG line chart path from weekly data
  const svgPoints = weeklyData.map((d, i) => {
    const x = weeklyData.length <= 1 ? 50 : (i / (weeklyData.length - 1)) * 100;
    const y = 100 - d.pct; // invert: 100% attendance → y=0
    return `${x},${y}`;
  });
  const svgPath = svgPoints.length > 1 ? `M${svgPoints.join(" L")}` : "";
  const svgCircles = weeklyData.map((d, i) => ({
    cx: weeklyData.length <= 1 ? 50 : (i / (weeklyData.length - 1)) * 100,
    cy: 100 - d.pct,
  }));

  // Donut chart percents
  const p = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 75;
  const a = totalRecords > 0 ? Math.round((absentCount  / totalRecords) * 100) : 10;
  const l = totalRecords > 0 ? Math.round((lateCount    / totalRecords) * 100) : 10;
  const e = 100 - p - a - l;
  const donutGradient = `conic-gradient(#486647 0% ${p}%, #ba1a1a ${p}% ${p + a}%, #653e00 ${p + a}% ${p + a + l}%, #c1c7cb ${p + a + l}% 100%)`;

  return (
    <div className={styles.root}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbLink}>Attendance</span>
            <span className={styles.breadcrumbSep}>›</span>
            <span className={styles.breadcrumbCurrent}>Reports</span>
          </div>
          <h1 className={styles.pageTitle}>Attendance Reports</h1>
          <p className={styles.pageSubtitle}>
            Analyze attendance trends, absenteeism, lateness, and class compliance.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.outlineBtn} onClick={() => window.print()}>
            <FileText size={16} /> Export PDF
          </button>
          <button className={styles.outlineBtn} onClick={() => exportAttendanceCSV(filteredAbsentees, weeklyData, classData)}>
            <FileText size={16} /> Export Excel
          </button>
          <button className={styles.outlineBtn} onClick={() => exportAttendanceCSV(filteredAbsentees, weeklyData, classData)}>
            <Mail size={16} /> Send to Parents
          </button>
          <button className={styles.primaryBtn}>
            <BarChart2 size={16} /> Generate Report
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className={styles.filterPanel}>
        <div className={styles.filterGrid}>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Date From</label>
            <input
              className={styles.filterInput} type="date"
              value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            />
          </div>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Date To</label>
            <input
              className={styles.filterInput} type="date"
              value={dateTo} onChange={e => setDateTo(e.target.value)}
            />
          </div>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Class Group</label>
            <select
              className={styles.filterSelect}
              value={classGroupFilter}
              onChange={e => setClassGroupFilter(e.target.value)}
            >
              <option value="">All Classes</option>
              {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Absentee Status</label>
            <select
              className={styles.filterSelect}
              value={absenceStatusFilter}
              onChange={e => setAbsenceStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="critical">Critical</option>
              <option value="monitor">Monitor</option>
              <option value="standard">Standard</option>
            </select>
          </div>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Report Type</label>
            <select className={styles.filterSelect} defaultValue="Monthly Summary">
              <option>Monthly Summary</option>
              <option>Weekly Detail</option>
              <option>Term Overview</option>
            </select>
          </div>
        </div>
        <div className={styles.filterFooter}>
          <span className={styles.filterFooterLabel}>Additional Filters:</span>
          <button className={styles.filterLinkBtn}>Teacher</button>
          <button className={styles.filterLinkBtn}>House</button>
          <span className={styles.filterFooterInfo}>
            Showing results for{" "}
            <strong>{classGroupFilter || "All Classes"}</strong>
            {dateFrom && ` · From ${dateFrom}`}
            {dateTo && ` · To ${dateTo}`}
          </span>
        </div>
      </div>

      {/* Main two-column layout */}
      <div className={styles.mainLayout}>
        {/* Left: main canvas */}
        <div className={styles.mainCanvas}>
          {/* Stat cards */}
          <div className={styles.statGrid}>
            {/* Overall — takes 2 cols */}
            <div className={`${styles.statCard} ${styles.statCardWide}`}>
              <span className={styles.statLabel}>Overall Attendance</span>
              <div className={styles.statValueRow}>
                <span className={styles.statValueLg}>{overallPct}%</span>
                <span className={styles.trendBadge}>
                  <TrendingUp size={12} /> +1.2%
                </span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${overallPct}%` }} />
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Present</span>
              <span className={styles.statValueMd}>{presentCount.toLocaleString()}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Absent</span>
              <span className={`${styles.statValueMd} ${styles.statError}`}>{absentCount.toLocaleString()}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Late</span>
              <span className={`${styles.statValueMd} ${styles.statWarning}`}>{lateCount.toLocaleString()}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Excused</span>
              <span className={`${styles.statValueMd} ${styles.statMuted}`}>{excusedCount.toLocaleString()}</span>
            </div>
          </div>

          {/* Charts */}
          <div className={styles.chartsGrid}>
            {/* Line chart: Weekly Trend */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <span className={styles.chartTitle}>Weekly Attendance Trend</span>
              </div>
              <div className={styles.chartBody}>
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className={styles.chartSvg}
                >
                  {svgPath && (
                    <path
                      d={svgPath}
                      fill="none"
                      stroke="#244c5a"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                  {svgCircles.map((pt, i) => (
                    <circle
                      key={i}
                      cx={pt.cx}
                      cy={pt.cy}
                      r="1.5"
                      fill="#244c5a"
                    />
                  ))}
                </svg>
              </div>
              <div className={styles.chartXLabels}>
                {weeklyData.map(d => <span key={d.week}>{d.week}</span>)}
              </div>
            </div>

            {/* Bar chart: Class Comparison */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <span className={styles.chartTitle}>
                  Class Comparison{classGroupFilter ? ` (${classGroupFilter})` : ""}
                </span>
                <select className={styles.chartSelect}>
                  <option>By Section</option>
                  <option>By Term</option>
                </select>
              </div>
              <div className={styles.chartBody}>
                <div className={styles.barGroup}>
                  {classData.length > 0 ? classData.map(cls => (
                    <div key={cls.label} className={styles.barWrapper}>
                      <div
                        className={styles.bar}
                        style={{ height: `${cls.pct}%` }}
                        title={`${cls.label}: ${cls.pct}%`}
                      />
                    </div>
                  )) : (
                    <p style={{ fontSize: "var(--text-xs)", color: "#71787b", margin: "auto", textAlign: "center" }}>No class data yet</p>
                  )}
                </div>
              </div>
              <div className={styles.chartXLabels}>
                {classData.map(cls => (
                  <span key={cls.label}>{cls.label}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Top Absentees table */}
          <div className={styles.tableCard}>
            <div className={styles.tableHead}>
              <span className={styles.tableTitle}>Top Absentees (Alerts)</span>
              <button className={styles.filterLinkBtn}>Filter</button>
            </div>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.thRank}>#</th>
                    <th>Student Name</th>
                    <th>ID</th>
                    <th>Class</th>
                    <th className={styles.thRight}>Days Absent</th>
                    <th className={styles.thCenter}>Status</th>
                    <th className={styles.thRight}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAbsentees.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: "center", padding: "32px 16px", color: "#71787b", fontSize: "var(--text-xs)" }}>
                      {topAbsentees.length === 0
                        ? "No absentee alerts — all students are within acceptable attendance thresholds."
                        : "No students match the current filters."}
                    </td></tr>
                  )}
                  {filteredAbsentees.map((s, i) => (
                    <tr
                      key={s.admissionNo}
                      className={s.status === "Critical" ? styles.alertRow : styles.tableRow}
                      onClick={() => setSelectedStudent(s)}
                    >
                      <td className={styles.tdRank}>{i + 1}</td>
                      <td className={styles.tdName}>
                        {s.studentName}
                        {s.status === "Critical" && (
                          <AlertTriangle size={14} className={styles.warnIcon} />
                        )}
                      </td>
                      <td className={styles.tdMono}>{s.admissionNo}</td>
                      <td className={styles.tdNowrap}>{s.className}</td>
                      <td className={`${styles.tdRight} ${s.status === "Critical" ? styles.tdError : s.status === "Monitor" ? styles.tdWarning : ""}`}>
                        <strong>{s.daysAbsent}</strong>
                      </td>
                      <td className={styles.tdCenter}>
                        <StatusBadge status={s.status} />
                      </td>
                      <td className={styles.tdRight}>
                        <button
                          className={styles.viewBtn}
                          onClick={e => { e.stopPropagation(); setSelectedStudent(s); }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.tableFooter}>
              <button className={styles.filterLinkBtn}>View All Students</button>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className={styles.sidebar}>
          {/* Chronic absentees alert */}
          <div className={styles.alertCard}>
            <div className={styles.alertCardRow}>
              <AlertTriangle size={20} className={styles.alertIcon} />
              <div>
                <h4 className={styles.alertCardTitle}>
                  {chronics > 0 ? `${chronics} Chronic Absentee${chronics !== 1 ? "s" : ""}` : "No Critical Alerts"}
                </h4>
                <p className={styles.alertCardBody}>
                  {chronics > 0
                    ? "Students have missed more than 3 consecutive days without excuse."
                    : "All students are within acceptable attendance thresholds."}
                </p>
                {chronics > 0 && (
                  <button className={styles.alertReviewBtn}>Review Cases</button>
                )}
              </div>
            </div>
          </div>

          {/* Donut: Status Distribution */}
          <div className={styles.sideCard}>
            <h4 className={styles.sideCardTitle}>Status Distribution</h4>
            <div className={styles.donutWrapper}>
              <div className={styles.donutRing} style={{ background: donutGradient }} />
              <div className={styles.donutCenter}>
                <span className={styles.donutValue}>{totalRecords.toLocaleString()}</span>
                <span className={styles.donutLabel}>Total Records</span>
              </div>
            </div>
            <div className={styles.legendGrid}>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: "#486647" }} />
                <span>Present ({p}%)</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: "#ba1a1a" }} />
                <span>Absent ({a}%)</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: "#653e00" }} />
                <span>Late ({l}%)</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: "#c1c7cb" }} />
                <span>Excused ({e}%)</span>
              </div>
            </div>
          </div>

          {/* Register Submission */}
          <div className={styles.sideCard}>
            <div className={styles.sideCardHead}>
              <h4 className={styles.sideCardTitle}>Register Submission</h4>
              <span className={styles.sideCardSub}>Today</span>
            </div>
            <p style={{ fontSize: "var(--text-xs)", color: "#71787b", margin: "8px 0 0" }}>
              Register submission tracking requires daily attendance data. Mark attendance to see submission status here.
            </p>
          </div>
        </aside>
      </div>

      {/* Drilldown drawer */}
      {selectedStudent && (
        <div className={styles.drawerOverlay} onClick={() => setSelectedStudent(null)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHead}>
              <div>
                <StatusBadge status={selectedStudent.status} />
                <h2 className={styles.drawerStudentName}>{selectedStudent.studentName}</h2>
                <p className={styles.drawerStudentSub}>
                  {selectedStudent.admissionNo} · {selectedStudent.className}
                </p>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedStudent(null)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.drawerBody}>
              {/* Stats mini */}
              <div className={styles.statsMini}>
                <div className={styles.statMini}>
                  <div className={styles.statMiniLabel}>Days Absent (Term)</div>
                  <div className={styles.statMiniValue}>{selectedStudent.daysAbsent}</div>
                </div>
                <div className={styles.statMini}>
                  <div className={styles.statMiniLabel}>Consecutive Days</div>
                  <div className={styles.statMiniValue}>{selectedStudent.consecutiveDays}</div>
                </div>
              </div>

              {/* Recent attendance */}
              <div>
                <div className={styles.sectionLabel}>Recent Attendance Record</div>
                <div className={styles.absenceList}>
                  {selectedStudent.recentAbsences.length === 0 && (
                    <p style={{ fontSize: "var(--text-xs)", color: "#71787b", padding: "12px 0" }}>No absence records found.</p>
                  )}
                  {selectedStudent.recentAbsences.map((abs, i) => {
                    const d = new Date(abs.date);
                    const month = d.toLocaleString("en-GB", { month: "short" }).toUpperCase();
                    const day   = d.getDate();
                    return (
                      <div key={i} className={styles.absenceItem}>
                        <div className={styles.absenceDateBox}>
                          <span className={styles.absenceDateMonth}>{month}</span>
                          <span className={styles.absenceDateDay}>{day}</span>
                        </div>
                        <div>
                          <div className={styles.absenceStatus}>Absent</div>
                          <div className={styles.absenceReason}>
                            Reason: {abs.reason ?? "Unknown"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Guardian (placeholder) */}
              <div>
                <div className={styles.sectionLabel}>Primary Guardian</div>
                <div className={styles.guardianItem}>
                  <div>
                    <div className={styles.guardianName}>—</div>
                    <div className={styles.guardianSub}>Contact information not loaded</div>
                  </div>
                  <div className={styles.guardianActions}>
                    <button className={styles.iconBtn} title="Call">
                      <Phone size={14} />
                    </button>
                    <button className={styles.iconBtn} title="SMS">
                      <MessageSquare size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Intervention form */}
              <div>
                <div className={styles.sectionLabel}>Log Intervention</div>
                <textarea
                  className={styles.interventionTextarea}
                  placeholder="Add notes on follow-up action..."
                  value={intervention}
                  onChange={e => setIntervention(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.drawerFoot}>
              <button className={styles.cancelBtn} onClick={() => setSelectedStudent(null)}>
                Cancel
              </button>
              <button className={styles.followUpBtn} onClick={() => setSelectedStudent(null)}>
                <CheckCircle size={16} /> Mark Follow-up Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: AbsenteeRow["status"] }) {
  const cls =
    status === "Critical" ? styles.badgeCritical :
    status === "Monitor"  ? styles.badgeMonitor :
    status === "Perfect"  ? styles.badgePerfect :
    styles.badgeStandard;
  return <span className={`${styles.statusBadge} ${cls}`}>{status}</span>;
}

