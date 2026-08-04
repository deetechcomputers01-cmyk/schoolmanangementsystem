"use client";

import Link from "next/link";
import { ArrowLeft, Printer, Download } from "lucide-react";
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
  return [...scale].sort((a, b) => b.min - a.min).map((b) => `${b.grade} (${b.min}-${b.max})`).join("  •  ");
}

interface Props extends ReportCardData {
  /** Only passed by the plain full-page fallback (hard refresh / deep link) —
   *  the RouteModal-embedded version relies on the modal's own X to close,
   *  so this stays undefined there. */
  backHref?: string;
}

/** On-screen "view" of a student's report card — shared by the desktop
 *  RouteModal (View/Print from the Report Cards list) and the plain
 *  full-page fallback route, so both contexts render the exact same
 *  design instead of the page falling back to a different, older look.
 *  ReportCardBody (the formal printable document) is untouched and still
 *  used by the bulk class-print route — this component is deliberately
 *  a separate, richer on-screen view of the same real ReportCardData. */
export function ReportCardModalContent(props: Props) {
  const {
    studentName, admissionNo, className, subjects, terms, lastTerm, gradeMatrix,
    attendance, avgLast, rank, gradingScale, reportFooter, backHref,
  } = props;

  return (
    <div className={styles.modalRoot}>
      <div className={`${styles.header} no-print`}>
        {backHref ? (
          <Link href={backHref} className={styles.backLink}>
            <ArrowLeft size={14} /> All Classes
          </Link>
        ) : (
          <p className={styles.eyebrow}>Report Cards</p>
        )}
        <h2 className={styles.title}>Report Card — {studentName}</h2>
        <div className={styles.identityRow}>
          <div className={styles.identityLeft}>
            <span className={styles.avatar}>{initials(studentName)}</span>
            <div>
              <div className={styles.nameRow}>
                <p className={styles.name}>{studentName}</p>
                <span className={styles.statusPill}>Published</span>
              </div>
              <p className={styles.meta}>{admissionNo} • {className}</p>
            </div>
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

        <div>
          <p className={styles.sectionLabel}>Academic Performance</p>
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
                {avgLast !== null && lastTerm && (
                  <tfoot>
                    <tr className={styles.totalRow}>
                      <td colSpan={terms.length + 3} className={styles.totalCell}>
                        {lastTerm} Average{rank ? ` (Rank ${ordinal(rank.position)} of ${rank.outOf})` : ""}: <strong className={styles.totalValue}>{avgLast}% — {gradeFromScore(avgLast, 100, gradingScale)}</strong>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        </div>

        <div className={styles.attSection}>
          <p className={styles.sectionLabel}>Attendance Summary</p>
          {attendance.total === 0 ? (
            <p className={styles.emptyText}>No attendance records yet.</p>
          ) : (
            <div className={styles.attRow}>
              <div className={styles.attPill}><span>Days Recorded</span><strong>{attendance.total}</strong></div>
              <div className={styles.attPill}><span className={`${styles.attDot} ${styles.dotGood}`} />Present<strong>{attendance.present}</strong></div>
              <div className={styles.attPill}><span className={`${styles.attDot} ${styles.dotBad}`} />Absent<strong>{attendance.absent}</strong></div>
              <div className={styles.attPill}><span className={`${styles.attDot} ${styles.dotWarn}`} />Late<strong>{attendance.late}</strong></div>
              <div className={styles.attPill}><span>Rate</span><strong>{attendance.pct}%</strong></div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.legendBox}>
          {reportFooter && <p className={styles.legendNote}>{reportFooter}</p>}
          <p>Grading scale: {gradingLegend(gradingScale)}</p>
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
