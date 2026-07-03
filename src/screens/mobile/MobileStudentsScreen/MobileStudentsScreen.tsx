/**
 * MobileStudentsScreen — mobile view for the Students module.
 * One file, one purpose: renders the Students UI for 375px phones.
 * Design: PENDING — Stitch "Institutional Excellence" mobile spec.
 */

import styles from "./MobileStudentsScreen.module.css";

export function MobileStudentsScreen() {
  return (
    <section className={styles.root} aria-label="Students">
      <div className={styles.placeholder}>
        <span className={styles.label}>Students — Mobile Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
