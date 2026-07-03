/**
 * MobileResetPasswordScreen — mobile view for the ResetPassword module.
 * One file, one purpose: renders the ResetPassword UI for 375px phones.
 * Design: PENDING — Stitch "Institutional Excellence" mobile spec.
 */

import styles from "./MobileResetPasswordScreen.module.css";

export function MobileResetPasswordScreen() {
  return (
    <section className={styles.root} aria-label="ResetPassword">
      <div className={styles.placeholder}>
        <span className={styles.label}>ResetPassword — Mobile Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
