/**
 * HostelScreen — desktop view for the Hostel module.
 * One file, one purpose: renders the Hostel UI for 1440px+ screens.
 * Design: PENDING — Stitch "Institutional Excellence" desktop spec.
 * Logic: wire up props from the parent page.tsx once data layer is ready.
 */

import styles from "./HostelScreen.module.css";

export function HostelScreen() {
  return (
    <section className={styles.root} aria-label="Hostel">
      <div className={styles.placeholder}>
        <span className={styles.label}>Hostel — Desktop Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
