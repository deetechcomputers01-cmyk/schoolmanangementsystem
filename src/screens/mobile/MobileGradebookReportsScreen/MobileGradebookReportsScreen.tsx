/**
 * MobileGradebookReportsScreen — mobile view for the GradebookReports module.
 * One file, one purpose: renders the GradebookReports UI for 375px phones.
 * Design: PENDING — Stitch "Institutional Excellence" mobile spec.
 */

import styles from "./MobileGradebookReportsScreen.module.css";

export function MobileGradebookReportsScreen() {
  return (
    <section className={styles.root} aria-label="GradebookReports">
      <div className={styles.placeholder}>
        <span className={styles.label}>GradebookReports — Mobile Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
