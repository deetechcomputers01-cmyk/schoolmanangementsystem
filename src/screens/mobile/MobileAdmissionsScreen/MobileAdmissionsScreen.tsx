/**
 * MobileAdmissionsScreen — mobile view for the Admissions module.
 * One file, one purpose: renders the Admissions UI for 375px phones.
 * Design: PENDING — Stitch "Institutional Excellence" mobile spec.
 */

import styles from "./MobileAdmissionsScreen.module.css";

export function MobileAdmissionsScreen() {
  return (
    <section className={styles.root} aria-label="Admissions">
      <div className={styles.placeholder}>
        <span className={styles.label}>Admissions — Mobile Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
