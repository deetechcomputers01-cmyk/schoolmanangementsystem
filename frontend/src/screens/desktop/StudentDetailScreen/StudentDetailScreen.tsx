/**
 * StudentDetailScreen — desktop view for the StudentDetail module.
 * One file, one purpose: renders the StudentDetail UI for 1440px+ screens.
 * Design: PENDING — Stitch "Institutional Excellence" desktop spec.
 * Logic: wire up props from the parent page.tsx once data layer is ready.
 */

import styles from "./StudentDetailScreen.module.css";

export function StudentDetailScreen() {
  return (
    <section className={styles.root} aria-label="StudentDetail">
      <div className={styles.placeholder}>
        <span className={styles.label}>StudentDetail — Desktop Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
