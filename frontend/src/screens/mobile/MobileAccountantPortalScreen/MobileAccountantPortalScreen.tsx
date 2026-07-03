/**
 * MobileAccountantPortalScreen — mobile view for the AccountantPortal module.
 * One file, one purpose: renders the AccountantPortal UI for 375px phones.
 * Design: PENDING — Stitch "Institutional Excellence" mobile spec.
 */

import styles from "./MobileAccountantPortalScreen.module.css";

export function MobileAccountantPortalScreen() {
  return (
    <section className={styles.root} aria-label="AccountantPortal">
      <div className={styles.placeholder}>
        <span className={styles.label}>AccountantPortal — Mobile Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
