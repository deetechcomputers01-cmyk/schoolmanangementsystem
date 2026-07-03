/**
 * MobileUserRoleScreen — mobile view for the UserRole module.
 * One file, one purpose: renders the UserRole UI for 375px phones.
 * Design: PENDING — Stitch "Institutional Excellence" mobile spec.
 */

import styles from "./MobileUserRoleScreen.module.css";

export function MobileUserRoleScreen() {
  return (
    <section className={styles.root} aria-label="UserRole">
      <div className={styles.placeholder}>
        <span className={styles.label}>UserRole — Mobile Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
