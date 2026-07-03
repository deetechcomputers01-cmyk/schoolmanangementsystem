/**
 * TransportScreen — desktop view for the Transport module.
 * One file, one purpose: renders the Transport UI for 1440px+ screens.
 * Design: PENDING — Stitch "Institutional Excellence" desktop spec.
 * Logic: wire up props from the parent page.tsx once data layer is ready.
 */

import styles from "./TransportScreen.module.css";

export function TransportScreen() {
  return (
    <section className={styles.root} aria-label="Transport">
      <div className={styles.placeholder}>
        <span className={styles.label}>Transport — Desktop Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
