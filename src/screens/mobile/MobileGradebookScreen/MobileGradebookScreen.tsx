/**
 * MobileGradebookScreen — mobile view for the Gradebook module.
 * One file, one purpose: renders the Gradebook UI for 375px phones.
 * Design: PENDING — Stitch "Institutional Excellence" mobile spec.
 */

import styles from "./MobileGradebookScreen.module.css";

export function MobileGradebookScreen() {
  return (
    <section className={styles.root} aria-label="Gradebook">
      <div className={styles.placeholder}>
        <span className={styles.label}>Gradebook — Mobile Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
