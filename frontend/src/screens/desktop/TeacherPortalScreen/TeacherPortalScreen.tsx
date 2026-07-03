/**
 * TeacherPortalScreen — desktop view for the TeacherPortal module.
 * One file, one purpose: renders the TeacherPortal UI for 1440px+ screens.
 * Design: PENDING — Stitch "Institutional Excellence" desktop spec.
 * Logic: wire up props from the parent page.tsx once data layer is ready.
 */

import styles from "./TeacherPortalScreen.module.css";

export function TeacherPortalScreen() {
  return (
    <section className={styles.root} aria-label="TeacherPortal">
      <div className={styles.placeholder}>
        <span className={styles.label}>TeacherPortal — Desktop Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
