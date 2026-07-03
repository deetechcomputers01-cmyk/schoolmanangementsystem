/**
 * MobileAssetsScreen — mobile view for the Assets module.
 * One file, one purpose: renders the Assets UI for 375px phones.
 * Design: PENDING — Stitch "Institutional Excellence" mobile spec.
 */

import styles from "./MobileAssetsScreen.module.css";

export function MobileAssetsScreen() {
  return (
    <section className={styles.root} aria-label="Assets">
      <div className={styles.placeholder}>
        <span className={styles.label}>Assets — Mobile Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
