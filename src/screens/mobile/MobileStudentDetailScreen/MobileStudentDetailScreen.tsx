/**
 * MobileStudentDetailScreen — mobile view for the StudentDetail module.
 * One file, one purpose: renders the StudentDetail UI for 375px phones.
 * Design: PENDING — Stitch "Institutional Excellence" mobile spec.
 */

import styles from "./MobileStudentDetailScreen.module.css";

export function MobileStudentDetailScreen() {
  return (
    <section className={styles.root} aria-label="StudentDetail">
      <div className={styles.placeholder}>
        <span className={styles.label}>StudentDetail — Mobile Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
