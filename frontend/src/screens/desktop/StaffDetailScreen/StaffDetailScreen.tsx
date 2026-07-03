/**
 * StaffDetailScreen — desktop view for the StaffDetail module.
 * One file, one purpose: renders the StaffDetail UI for 1440px+ screens.
 * Design: PENDING — Stitch "Institutional Excellence" desktop spec.
 * Logic: wire up props from the parent page.tsx once data layer is ready.
 */

import styles from "./StaffDetailScreen.module.css";

export function StaffDetailScreen() {
  return (
    <section className={styles.root} aria-label="StaffDetail">
      <div className={styles.placeholder}>
        <span className={styles.label}>StaffDetail — Desktop Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
