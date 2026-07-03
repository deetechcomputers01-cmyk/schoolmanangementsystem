/**
 * MobileDashboardScreen — mobile view for the Dashboard module.
 * One file, one purpose: renders the Dashboard UI for 375px phones.
 * Design: PENDING — Stitch "Institutional Excellence" mobile spec.
 */

import styles from "./MobileDashboardScreen.module.css";

export function MobileDashboardScreen() {
  return (
    <section className={styles.root} aria-label="Dashboard">
      <div className={styles.placeholder}>
        <span className={styles.label}>Dashboard — Mobile Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
