/**
 * MobileParentPortalScreen — mobile view for the ParentPortal module.
 * One file, one purpose: renders the ParentPortal UI for 375px phones.
 * Design: PENDING — Stitch "Institutional Excellence" mobile spec.
 */

import styles from "./MobileParentPortalScreen.module.css";

export function MobileParentPortalScreen() {
  return (
    <section className={styles.root} aria-label="ParentPortal">
      <div className={styles.placeholder}>
        <span className={styles.label}>ParentPortal — Mobile Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
