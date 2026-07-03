/**
 * MobileStudentPortalScreen — mobile view for the StudentPortal module.
 * One file, one purpose: renders the StudentPortal UI for 375px phones.
 * Design: PENDING — Stitch "Institutional Excellence" mobile spec.
 */

import styles from "./MobileStudentPortalScreen.module.css";

export function MobileStudentPortalScreen() {
  return (
    <section className={styles.root} aria-label="StudentPortal">
      <div className={styles.placeholder}>
        <span className={styles.label}>StudentPortal — Mobile Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
