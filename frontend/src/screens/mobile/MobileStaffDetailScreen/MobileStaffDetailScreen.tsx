/**
 * MobileStaffDetailScreen — mobile view for the StaffDetail module.
 * One file, one purpose: renders the StaffDetail UI for 375px phones.
 * Design: PENDING — Stitch "Institutional Excellence" mobile spec.
 */

import styles from "./MobileStaffDetailScreen.module.css";

export function MobileStaffDetailScreen() {
  return (
    <section className={styles.root} aria-label="StaffDetail">
      <div className={styles.placeholder}>
        <span className={styles.label}>StaffDetail — Mobile Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
