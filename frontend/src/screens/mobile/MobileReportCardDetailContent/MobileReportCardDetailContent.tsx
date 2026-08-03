"use client";

import { Printer, Download } from "lucide-react";
import { gradeFromScore, type GradeBand } from "@backend/utils";
import styles from "./MobileReportCardDetailContent.module.css";

type GradeEntry = { score: number; remarks: string | null } | null;

export interface MobileReportCardProps {
  schoolName: string;
  schoolMotto: string;
  reportFooter: string;
  academicYear: string;
  studentName: string;
  admissionNo: string;
  className: string;
  gender: string;
  dob: string;
  subjects: string[];
  terms: string[];
  lastTerm: string | null;
  gradeMatrix: Record<string, Record<string, GradeEntry>>;
  attendance: { total: number; present: number; absent: number; late: number; pct: number };
  avgLast: number | null;
  rank: { position: number; outOf: number } | null;
  gradingScale: GradeBand[];
  minAttendanceRate: number;
  alertThreshold: number;
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}
function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}
function gradeTone(score: number | null): "good" | "mid" | "bad" | "" {
  if (score === null) return "";
  if (score >= 70) return "good";
  if (score >= 50) return "mid";
  return "bad";
}

/** Mobile bottom-sheet view of a student's report card. Reflows the exact
 *  same ReportCardData used by ReportCardBody (the printable document) into
 *  a single-column layout — no fabricated fields, same grade matrix/
 *  attendance/rank data, same grading scale. Print/Download still trigger
 *  window.print() on this same content (the print media query below hides
 *  the header/footer buttons, same pattern as the desktop modal). */
export function MobileReportCardDetailContent(props: MobileReportCardProps) {
  const {
    studentName, admissionNo, className, subjects, terms, lastTerm, gradeMatrix,
    attendance, avgLast, rank, gradingScale, minAttendanceRate, alertThreshold, reportFooter,
  } = props;

  return (
    <div className={styles.root}>
      <div className={`${styles.header} no-print`}>
        <span className={styles.avatar}>{initials(studentName)}</span>
        <div className={styles.headerInfo}>
          <h3 className={styles.name}>{studentName}</h3>
          <p className={styles.sub}>{admissionNo} · {className}</p>
        </div>
        <span className={styles.statusPill}>Published</span>
      </div>

      <div className={styles.statRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Term Avg</span>
          <strong className={styles.statValue}>{avgLast !== null ? `${avgLast}%` : "—"}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Rank</span>
          <strong className={styles.statValue}>{rank ? `${ordinal(rank.position)}/${rank.outOf}` : "—"}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Attendance</span>
          <strong className={styles.statValue}>{attendance.total > 0 ? `${attendance.pct}%` : "—"}</strong>
        </div>
      </div>

      <section>
        <h4 className={styles.sectionTitle}>Academic Performance</h4>
        {subjects.length === 0 || terms.length === 0 ? (
          <p className={styles.emptyText}>No grades recorded yet.</p>
        ) : (
          <div className={styles.subjectList}>
            {subjects.map((subj) => {
              const lastEntry = lastTerm ? (gradeMatrix[subj][lastTerm] ?? null) : null;
              const lastScore = lastEntry?.score ?? null;
              const tone = gradeTone(lastScore);
              return (
                <div key={subj} className={styles.subjectRow}>
                  <div className={styles.subjectInfo}>
                    <p className={styles.subjectName}>{subj}</p>
                    <div className={styles.termScores}>
                      {terms.map((t) => {
                        const entry = gradeMatrix[subj][t];
                        return <span key={t} className={styles.termScore}>{t}: {entry ? entry.score.toFixed(0) : "—"}</span>;
                      })}
                    </div>
                  </div>
                  <span className={`${styles.gradeBadge} ${tone ? styles[`grade_${tone}`] : ""}`}>
                    {lastScore !== null ? gradeFromScore(lastScore, 100, gradingScale) : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h4 className={styles.sectionTitle}>Attendance Summary</h4>
        {attendance.total === 0 ? (
          <p className={styles.emptyText}>No attendance records yet.</p>
        ) : (
          <div className={styles.attGrid}>
            <div className={styles.attTile}><span className={styles.attValue}>{attendance.present}</span><span className={styles.attLabel}>Present</span></div>
            <div className={styles.attTile}><span className={styles.attValue}>{attendance.absent}</span><span className={styles.attLabel}>Absent</span></div>
            <div className={styles.attTile}><span className={styles.attValue}>{attendance.late}</span><span className={styles.attLabel}>Late</span></div>
            <div className={styles.attTile}>
              <span className={`${styles.attValue} ${attendance.pct >= minAttendanceRate ? styles.attGood : attendance.pct >= alertThreshold ? styles.attWarn : styles.attBad}`}>{attendance.pct}%</span>
              <span className={styles.attLabel}>Rate</span>
            </div>
          </div>
        )}
      </section>

      {reportFooter && <p className={styles.footerNote}>{reportFooter}</p>}

      <div className={`${styles.actionRow} no-print`}>
        <button type="button" className={styles.btnPrimary} onClick={() => window.print()}>
          <Download size={16} /> Download PDF
        </button>
        <button type="button" className={styles.btnOutline} onClick={() => window.print()}>
          <Printer size={16} /> Print
        </button>
      </div>
    </div>
  );
}
