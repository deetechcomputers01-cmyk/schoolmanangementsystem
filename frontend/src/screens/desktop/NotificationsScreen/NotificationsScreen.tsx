/**
 * NotificationsScreen — desktop view for the Notifications module.
 * One file, one purpose: renders the Notifications UI for 1440px+ screens.
 * Design: PENDING — Stitch "Institutional Excellence" desktop spec.
 * Logic: wire up props from the parent page.tsx once data layer is ready.
 */

import styles from "./NotificationsScreen.module.css";

export function NotificationsScreen() {
  return (
    <section className={styles.root} aria-label="Notifications">
      <div className={styles.placeholder}>
        <span className={styles.label}>Notifications — Desktop Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
