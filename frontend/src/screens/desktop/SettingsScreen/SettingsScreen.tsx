/**
 * SettingsScreen — desktop view for the Settings module.
 * One file, one purpose: renders the Settings UI for 1440px+ screens.
 * Design: PENDING — Stitch "Institutional Excellence" desktop spec.
 * Logic: wire up props from the parent page.tsx once data layer is ready.
 */

import styles from "./SettingsScreen.module.css";

export function SettingsScreen() {
  return (
    <section className={styles.root} aria-label="Settings">
      <div className={styles.placeholder}>
        <span className={styles.label}>Settings — Desktop Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}
