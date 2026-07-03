/**
 * MobileDisciplineScreen — mobile view for the Discipline module.
 * One file, one purpose: renders the Discipline UI for 375px phones.
 * Design: PENDING — Stitch "Institutional Excellence" mobile spec.
 */

import styles from "./MobileDisciplineScreen.module.css";

export function MobileDisciplineScreen() {
  return (
    <section className={styles.root} aria-label="Discipline">
      <div className={styles.placeholder}>
        <span className={styles.label}>Discipline — Mobile Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
