/**
 * MobileStaffScreen — mobile view for the Staff module.
 * One file, one purpose: renders the Staff UI for 375px phones.
 * Design: PENDING — Stitch "Institutional Excellence" mobile spec.
 */

import styles from "./MobileStaffScreen.module.css";

export function MobileStaffScreen() {
  return (
    <section className={styles.root} aria-label="Staff">
      <div className={styles.placeholder}>
        <span className={styles.label}>Staff — Mobile Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
