/**
 * MobileExamsScreen — mobile view for the Exams module.
 * Design: PENDING — Stitch "Institutional Excellence" mobile spec.
 */
import styles from "./MobileExamsScreen.module.css";

export function MobileExamsScreen() {
  return (
    <section className={${styles.root}} aria-label="Exams">
      <div className={${styles.placeholder}}>
        <span className={${styles.label}}>Exams — Mobile Screen</span>
        <span className={${styles.hint}}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}