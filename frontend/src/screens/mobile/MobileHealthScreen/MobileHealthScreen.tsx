/**
 * MobileHealthScreen — mobile view for the Health module.
 * One file, one purpose: renders the Health UI for 375px phones.
 * Design: PENDING — Stitch "Institutional Excellence" mobile spec.
 */

import styles from "./MobileHealthScreen.module.css";

export function MobileHealthScreen() {
  return (
    <section className={styles.root} aria-label="Health">
      <div className={styles.placeholder}>
        <span className={styles.label}>Health — Mobile Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
