/**
 * MobileAttendanceScreen — mobile view for the Attendance module.
 * One file, one purpose: renders the Attendance UI for 375px phones.
 * Design: PENDING — Stitch "Institutional Excellence" mobile spec.
 */

import styles from "./MobileAttendanceScreen.module.css";

export function MobileAttendanceScreen() {
  return (
    <section className={styles.root} aria-label="Attendance">
      <div className={styles.placeholder}>
        <span className={styles.label}>Attendance — Mobile Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
