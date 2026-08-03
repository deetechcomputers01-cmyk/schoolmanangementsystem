"use client";

import { useState, useMemo } from "react";
import {
  Printer, Download, BarChart2, TrendingUp,
  Star, ChevronRight, X, Settings,
} from "lucide-react";
import { gradeFromScore, type GradeBand } from "@backend/utils";
import styles from "./GradebookReportsScreen.module.css";

export interface ClassPerf {
  classId: string;
  className: string;
  studentCount: number;
  avg: number;
  gradeLabel: string;
  status: "ready" | "pending";
}

export interface SubjectPerf {
  name: string;
  avg: number;
}

export interface GradeDist {
  grade: string;
  count: number;
  pct: number;
  isFail: boolean;
}

export interface GradebookReportsProps {
  overallAvg: number;
  overallLabel: string;
  readinessPct: number;
  readinessSubmitted: number;
  readinessTotal: number;
  topPerformers: number;
  gradeDist: GradeDist[];
  subjectPerf: SubjectPerf[];
  classPerf: ClassPerf[];
  gradingScale: GradeBand[];
}

function gradeColor(avg: number) {
  if (avg >= 80) return "#486647";
  if (avg >= 65) return "#073543";
  if (avg >= 50) return "#653e00";
  return "#ba1a1a";
}

function exportGradebookCSV(classPerf: ClassPerf[], subjectPerf: SubjectPerf[], gradeDist: GradeDist[], gradingScale: GradeBand[]) {
  const sections: string[] = [];
  sections.push("Class Performance");
  sections.push(["Class","Students","Average","Grade","Status"].join(","));
  classPerf.forEach(c => sections.push([`"${c.className}"`, c.studentCount, c.avg.toFixed(1), c.gradeLabel, c.status].join(",")));
  sections.push("");
  sections.push("Subject Performance");
  sections.push(["Subject","Average","Grade"].join(","));
  subjectPerf.forEach(s => sections.push([`"${s.name}"`, s.avg.toFixed(1), gradeFromScore(s.avg, 100, gradingScale)].join(",")));
  sections.push("");
  sections.push("Grade Distribution");
  sections.push(["Grade","Count","Percentage"].join(","));
  gradeDist.forEach(d => sections.push([d.grade, d.count, `${d.pct}%`].join(",")));
  const blob = new Blob([sections.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "gradebook-report.csv"; a.click();
  URL.revokeObjectURL(url);
}

export function GradebookReportsContent(props: GradebookReportsProps) {
  const { overallAvg, overallLabel, readinessPct, readinessSubmitted, readinessTotal, topPerformers, gradeDist, subjectPerf, classPerf, gradingScale } = props;

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [classFilter, setClassFilter] = useState("");
  const [subjectSort, setSubjectSort] = useState<"grade" | "name">("grade");

  const filteredClasses = useMemo(() => {
    const q = classFilter.toLowerCase();
    return classPerf.filter(c => !q || c.className.toLowerCase().includes(q));
  }, [classPerf, classFilter]);

  const sortedSubjects = useMemo(() => {
    const copy = [...subjectPerf];
    return subjectSort === "grade"
      ? copy.sort((a, b) => b.avg - a.avg)
      : copy.sort((a, b) => a.name.localeCompare(b.name));
  }, [subjectPerf, subjectSort]);

  const maxDist = Math.max(...gradeDist.map(d => d.pct), 1);

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.breadcrumb}>
            <span>Gradebook</span>
            <ChevronRight size={14} />
            <span className={styles.breadcrumbActive}>Reports</span>
          </div>
          <h1 className={styles.title}>Gradebook Reports</h1>
          <p className={styles.subtitle}>Review academic performance metrics and generate final report cards.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnNeutral} onClick={() => window.print()}>
            <Printer size={16} />
            Print Cards
          </button>
          <button className={styles.btnNeutral} onClick={() => exportGradebookCSV(classPerf, subjectPerf, gradeDist, gradingScale)}>
            <Download size={16} />
            Export
          </button>
          <button className={styles.btnPrimary} onClick={() => setShowGenerateModal(true)}>
            <BarChart2 size={16} />
            Generate Report
          </button>
        </div>
      </div>

      {/* 3 metric cards */}
      <div className={styles.metricGrid}>
        {/* Class Average */}
        <div className={styles.metricCard}>
          <div className={styles.metricTop}>
            <div className={styles.metricIconWrap} style={{ background: "rgba(7,53,67,0.1)" }}>
              <TrendingUp size={20} style={{ color: "#073543" }} />
            </div>
            <span className={styles.metricBadge}>+2.4% vs Term 3</span>
          </div>
          <p className={styles.metricLabel}>Class Average Summary</p>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{overallAvg}%</span>
            <span className={styles.metricSub}>{overallLabel}</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${overallAvg}%`, background: "#073543" }} />
          </div>
        </div>

        {/* Grade Entry Readiness */}
        <div className={styles.metricCard}>
          <div className={styles.metricTop}>
            <div className={styles.metricIconWrap} style={{ background: "rgba(72,102,71,0.1)" }}>
              <BarChart2 size={20} style={{ color: "#486647" }} />
            </div>
            <span className={styles.metricBadgeMuted}>{readinessSubmitted}/{readinessTotal} Submitted</span>
          </div>
          <p className={styles.metricLabel}>Grade Entry Readiness</p>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{readinessPct}%</span>
            <span className={styles.metricSub}>Ready to Publish</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${readinessPct}%`, background: "#486647" }} />
          </div>
        </div>

        {/* Distinction Students */}
        <div className={styles.metricCard}>
          <div className={styles.metricTop}>
            <div className={styles.metricIconWrap} style={{ background: "rgba(101,62,0,0.1)" }}>
              <Star size={20} style={{ color: "#e8a957" }} />
            </div>
          </div>
          <p className={styles.metricLabel}>Distinction Students</p>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{topPerformers}</span>
            <span className={styles.metricSub}>Students &gt; 90%</span>
          </div>
        </div>
      </div>

      {/* Analytics row */}
      <div className={styles.analyticsRow}>
        {/* Grade Distribution */}
        <div className={styles.chartCard}>
          <div className={styles.chartCardHeader}>
            <h3 className={styles.chartTitle}>Grade Distribution</h3>
          </div>
          <div className={styles.barChart}>
            {gradeDist.map(d => (
              <div key={d.grade} className={styles.barGroup}>
                <div className={styles.barWrapper}>
                  <div
                    className={`${styles.bar} ${d.isFail ? styles.barDanger : styles.barPrimary}`}
                    style={{ height: `${(d.pct / maxDist) * 100}%` }}
                    title={`${d.pct}%`}
                  />
                </div>
                <span className={styles.barLabel}>{d.grade}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subject Performance */}
        <div className={styles.chartCard}>
          <div className={styles.chartCardHeader}>
            <h3 className={styles.chartTitle}>Subject Performance</h3>
            <select
              className={styles.sortSelect}
              value={subjectSort}
              onChange={e => setSubjectSort(e.target.value as "grade" | "name")}
            >
              <option value="grade">Sort by Grade</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
          <div className={styles.subjectList}>
            {sortedSubjects.length === 0 && (
              <p className={styles.emptyHint}>No subject data yet</p>
            )}
            {sortedSubjects.slice(0, 6).map(s => (
              <div key={s.name} className={styles.subjectRow}>
                <span className={styles.subjectName}>{s.name}</span>
                <div className={styles.subjectTrack}>
                  <div
                    className={styles.subjectFill}
                    style={{ width: `${s.avg}%`, background: s.avg >= 80 ? "#486647" : "#073543" }}
                  />
                </div>
                <span className={styles.subjectAvg} style={{ color: gradeColor(s.avg) }}>
                  {s.avg}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Class performance table */}
      <div className={styles.tableCard}>
        <div className={styles.tableCardHeader}>
          <h3 className={styles.chartTitle}>Class Performance Breakdown</h3>
          <div className={styles.tableSearch}>
            <input
              type="text"
              className={styles.tableSearchInput}
              placeholder="Filter classes…"
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
            />
          </div>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.thead}>
                <th className={styles.th}>Class Name</th>
                <th className={styles.th}>Students</th>
                <th className={styles.th}>Avg Grade</th>
                <th className={styles.th}>Status</th>
                <th className={`${styles.th} ${styles.thRight}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.length === 0 && (
                <tr><td colSpan={5} className={styles.emptyCell}>No class data yet</td></tr>
              )}
              {filteredClasses.map(c => (
                <tr key={c.classId} className={styles.tr}>
                  <td className={`${styles.td} ${styles.tdName}`}>{c.className}</td>
                  <td className={styles.td}>{c.studentCount} Students</td>
                  <td className={styles.td}>
                    <span className={styles.avgBold} style={{ color: gradeColor(c.avg) }}>
                      {c.avg.toFixed(1)}%
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span className={c.status === "ready" ? styles.statusReady : styles.statusPending}>
                      <span className={c.status === "ready" ? styles.dotReady : styles.dotPending} />
                      {c.status === "ready" ? "Ready" : "Pending"}
                    </span>
                  </td>
                  <td className={`${styles.td} ${styles.tdRight}`}>
                    <button className={styles.reviewBtn}>Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Report modal */}
      {showGenerateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowGenerateModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <div className={styles.modalHeaderIcon}><Settings size={20} /></div>
                <h3 className={styles.modalTitle}>Report Configuration</h3>
              </div>
              <button className={styles.modalClose} onClick={() => setShowGenerateModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Select Target Year/Term</label>
                <select className={styles.formSelect}>
                  <option>2026/2027 Academic Year - Term 1</option>
                  <option>2026/2027 Academic Year - Term 2 (Preview)</option>
                </select>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Academic Level</label>
                  <select className={styles.formSelect}>
                    <option>All Levels</option>
                    {classPerf.map(c => (
                      <option key={c.classId}>{c.className}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Report Type</label>
                  <select className={styles.formSelect}>
                    <option>Full Term Report</option>
                    <option>Subject Summary</option>
                    <option>Class Comparison</option>
                  </select>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setShowGenerateModal(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={() => setShowGenerateModal(false)}>
                <BarChart2 size={15} />
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
