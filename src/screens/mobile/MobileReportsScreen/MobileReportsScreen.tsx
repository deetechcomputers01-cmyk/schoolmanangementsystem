/**
 * MobileReportsScreen — mobile view for the Reports module.
 * One file, one purpose: renders the Reports UI for 375px phones.
 * Design: PENDING — Stitch "Institutional Excellence" mobile spec.
 */

import styles from "./MobileReportsScreen.module.css";

export function MobileReportsScreen() {
  return (
    <section className={styles.root} aria-label="Reports">
      <div className={styles.placeholder}>
        <span className={styles.label}>Reports — Mobile Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
