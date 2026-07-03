/**
 * MobileAddStudentScreen — mobile view for the AddStudent module.
 * One file, one purpose: renders the AddStudent UI for 375px phones.
 * Design: PENDING — Stitch "Institutional Excellence" mobile spec.
 */

import styles from "./MobileAddStudentScreen.module.css";

export function MobileAddStudentScreen() {
  return (
    <section className={styles.root} aria-label="AddStudent">
      <div className={styles.placeholder}>
        <span className={styles.label}>AddStudent — Mobile Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
