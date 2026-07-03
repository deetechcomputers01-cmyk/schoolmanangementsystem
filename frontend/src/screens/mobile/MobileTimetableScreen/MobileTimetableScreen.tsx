/**
 * MobileTimetableScreen — mobile view for the Timetable module.
 * One file, one purpose: renders the Timetable UI for 375px phones.
 * Design: PENDING — Stitch "Institutional Excellence" mobile spec.
 */

import styles from "./MobileTimetableScreen.module.css";

export function MobileTimetableScreen() {
  return (
    <section className={styles.root} aria-label="Timetable">
      <div className={styles.placeholder}>
        <span className={styles.label}>Timetable — Mobile Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
