/**
 * AccountantPortalScreen — desktop view for the AccountantPortal module.
 * One file, one purpose: renders the AccountantPortal UI for 1440px+ screens.
 * Design: PENDING — Stitch "Institutional Excellence" desktop spec.
 * Logic: wire up props from the parent page.tsx once data layer is ready.
 */

import styles from "./AccountantPortalScreen.module.css";

export function AccountantPortalScreen() {
  return (
    <section className={styles.root} aria-label="AccountantPortal">
      <div className={styles.placeholder}>
        <span className={styles.label}>AccountantPortal — Desktop Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
