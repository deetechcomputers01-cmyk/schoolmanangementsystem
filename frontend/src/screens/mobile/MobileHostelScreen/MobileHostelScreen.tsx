/**
 * MobileHostelScreen — mobile view for the Hostel module.
 * One file, one purpose: renders the Hostel UI for 375px phones.
 * Design: PENDING — Stitch "Institutional Excellence" mobile spec.
 */

import styles from "./MobileHostelScreen.module.css";

export function MobileHostelScreen() {
  return (
    <section className={styles.root} aria-label="Hostel">
      <div className={styles.placeholder}>
        <span className={styles.label}>Hostel — Mobile Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
