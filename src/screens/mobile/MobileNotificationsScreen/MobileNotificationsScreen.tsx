/**
 * MobileNotificationsScreen — mobile view for the Notifications module.
 * One file, one purpose: renders the Notifications UI for 375px phones.
 * Design: PENDING — Stitch "Institutional Excellence" mobile spec.
 */

import styles from "./MobileNotificationsScreen.module.css";

export function MobileNotificationsScreen() {
  return (
    <section className={styles.root} aria-label="Notifications">
      <div className={styles.placeholder}>
        <span className={styles.label}>Notifications — Mobile Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
