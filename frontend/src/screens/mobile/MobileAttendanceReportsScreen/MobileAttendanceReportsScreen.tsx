/**
 * MobileAttendanceReportsScreen — mobile view for the AttendanceReports module.
 * One file, one purpose: renders the AttendanceReports UI for 375px phones.
 * Design: PENDING — Stitch "Institutional Excellence" mobile spec.
 */

import styles from "./MobileAttendanceReportsScreen.module.css";

export function MobileAttendanceReportsScreen() {
  return (
    <section className={styles.root} aria-label="AttendanceReports">
      <div className={styles.placeholder}>
        <span className={styles.label}>AttendanceReports — Mobile Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
