"use client";

import { Printer, Download } from "lucide-react";
import { gradeFromScore, type GradeBand } from "@backend/utils";
import type { ReportCardData } from "./ReportCardBody";
import styles from "./ReportCardModal.module.css";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}
function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}
function gradeTone(score: number | null): "good" | "mid" | "bad" | "" {
  if (score === null) return "";
  if (score >= 70) return "good";
  if (score >= 50) return "mid";
  return "bad";
}
function gradingLegend(scale: GradeBand[]) {
  return [...scale].sort((a, b) => b.min - a.min).map((b) => `${b.grade} (${b.min}-${b.max})`).join(", ");
}

/** Desktop "View Report Card" modal — on-screen indigo-themed summary view,
 *  matching the app's design system (Student/Staff profile modal pattern).
 *  Uses the exact same ReportCardData as the printable ReportCardBody /
 *  print route, just laid out for on-screen viewing rather than printing —
 *  ReportCardBody itself is deliberately untouched, still the real document
 *  for the standalone page and the print route. */
export function ReportCardModalContent(props: ReportCardData) {
  const {
    studentName, admissionNo, className, subjects, terms, lastTerm, gradeMatrix,
    attendance, avgLast, rank, gradingScale, reportFooter,
  } = props;

  return (
    <div className={styles.modalRoot}>
      <div className={`${styles.header} no-print`}>
        <div>
          <p className={styles.eyebrow}>Report Cards</p>
          <h2 className={styles.title}>Report Card — {studentName}</h2>
        </div>
        <div className={styles.identityRow}>
          <div className={styles.identityLeft}>
            <span className={styles.avatar}>{initials(studentName)}</span>
            <div>
              <p className={styles.name}>{studentName}</p>
              <p className={styles.meta}>{admissionNo} • {className}</p>
            </div>
            <span className={styles.statusPill}>Published</span>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.btnOutline} onClick={() => window.print()}>
              <Printer size={14} /> Print
            </button>
            <button type="button" className={styles.btnPrimary} onClick={() => window.print()}>
              <Download size={14} /> Download PDF
            </button>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Term Average</span>
            <strong className={styles.statValue}>{avgLast !== null ? `${avgLast}%` : "—"}</strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Class Rank</span>
            <strong className={styles.statValue}>
              {rank ? <>{ordinal(rank.position)} <span className={styles.statSub}>of {rank.outOf}</span></> : "—"}
            </strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Attendance Rate</span>
            <strong className={styles.statValue}>{attendance.total > 0 ? `${attendance.pct}%` : "—"}</strong>
          </div>
        </div>

        <div className={styles.tableWrap}>
          {subjects.length === 0 || terms.length === 0 ? (
            <p className={styles.emptyText}>No grades recorded yet.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Subject</th>
                  {terms.map((t) => <th key={t} className={styles.th}>{t}</th>)}
                  <th className={styles.th}>Grade</th>
                  <th className={styles.th}>Remark</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subj) => {
                  const lastEntry = lastTerm ? (gradeMatrix[subj][lastTerm] ?? null) : null;
                  const lastScore = lastEntry?.score ?? null;
                  const tone = gradeTone(lastScore);
                  return (
                    <tr key={subj} className={styles.tr}>
                      <td className={styles.tdName}>{subj}</td>
                      {terms.map((t) => {
                        const entry = gradeMatrix[subj][t];
                        return <td key={t} className={styles.td}>{entry ? entry.score.toFixed(0) : "—"}</td>;
                      })}
                      <td className={styles.td}>
                        <span className={`${styles.gradePill} ${tone ? styles[`grade_${tone}`] : ""}`}>
                          {lastScore !== null ? gradeFromScore(lastScore, 100, gradingScale) : "—"}
                        </span>
                      </td>
                      <td className={styles.tdRemark}>
                        {lastEntry?.remarks ?? (lastScore !== null ? (lastScore >= 70 ? "Good performance" : "Needs improvement") : "—")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.attSection}>
          <p className={styles.sectionLabel}>Attendance Summary</p>
          {attendance.total === 0 ? (
            <p className={styles.emptyText}>No attendance records yet.</p>
          ) : (
            <div className={styles.attRow}>
              <div className={styles.attPill}><span>Days Recorded</span><strong>{attendance.total}</strong></div>
              <div className={styles.attPill}><span>Present</span><strong className={styles.attGood}>{attendance.present}</strong></div>
              <div className={styles.attPill}><span>Absent</span><strong className={styles.attBad}>{attendance.absent}</strong></div>
              <div className={styles.attPill}><span>Late</span><strong className={styles.attWarn}>{attendance.late}</strong></div>
              <div className={styles.attPill}><span>Rate</span><strong>{attendance.pct}%</strong></div>
            </div>
          )}
        </div>

        <div className={styles.footerNote}>
          {reportFooter && <p>{reportFooter}</p>}
          <p>Grading scale: {gradingLegend(gradingScale)}.</p>
        </div>

        <div className={styles.signatureRow}>
          {["Class Teacher", "Head Teacher / Principal", "Parent / Guardian"].map((role) => (
            <div key={role} className={styles.signatureCol}>
              <div className={styles.signatureLine} />
              <span>{role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
