"use client";

import { Printer, Download } from "lucide-react";
import { ReportCardBody, type ReportCardData } from "./ReportCardBody";
import styles from "./ReportCardModal.module.css";

/** Desktop view shown inside RouteModal when a report card is opened from
 *  the Report Cards list (`@modal/(.)report-cards/[studentId]`). Reuses
 *  ReportCardBody unchanged — it's the real printable document, also used
 *  by the standalone full-page route and the print route; this only adds
 *  a lightweight viewing header around it. */
export function ReportCardModalContent(props: ReportCardData) {
  const { studentName, admissionNo, className } = props;

  return (
    <div className={styles.modalRoot}>
      <div className={`${styles.header} no-print`}>
        <div>
          <p className={styles.eyebrow}>Report Cards</p>
          <h2 className={styles.title}>{studentName}</h2>
          <p className={styles.subtitle}>{admissionNo} · {className}</p>
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

      <div className={styles.body}>
        <ReportCardBody {...props} />
      </div>
    </div>
  );
}
