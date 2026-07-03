/**
 * AddStudentScreen — desktop view for the AddStudent module.
 * One file, one purpose: renders the AddStudent UI for 1440px+ screens.
 * Design: PENDING — Stitch "Institutional Excellence" desktop spec.
 * Logic: wire up props from the parent page.tsx once data layer is ready.
 */

import styles from "./AddStudentScreen.module.css";

export function AddStudentScreen() {
  return (
    <section className={styles.root} aria-label="AddStudent">
      <div className={styles.placeholder}>
        <span className={styles.label}>AddStudent — Desktop Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
