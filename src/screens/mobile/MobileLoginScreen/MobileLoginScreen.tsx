/**
 * MobileLoginScreen — mobile view for the Login module.
 * One file, one purpose: renders the Login UI for 375px phones.
 * Design: PENDING — Stitch "Institutional Excellence" mobile spec.
 */

import styles from "./MobileLoginScreen.module.css";

export function MobileLoginScreen() {
  return (
    <section className={styles.root} aria-label="Login">
      <div className={styles.placeholder}>
        <span className={styles.label}>Login — Mobile Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
