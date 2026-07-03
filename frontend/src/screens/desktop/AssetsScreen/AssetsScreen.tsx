/**
 * AssetsScreen — desktop view for the Assets module.
 * One file, one purpose: renders the Assets UI for 1440px+ screens.
 * Design: PENDING — Stitch "Institutional Excellence" desktop spec.
 * Logic: wire up props from the parent page.tsx once data layer is ready.
 */

import styles from "./AssetsScreen.module.css";

export function AssetsScreen() {
  return (
    <section className={styles.root} aria-label="Assets">
      <div className={styles.placeholder}>
        <span className={styles.label}>Assets — Desktop Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
