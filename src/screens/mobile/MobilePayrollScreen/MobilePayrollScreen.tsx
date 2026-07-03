import styles from "./MobilePayrollScreen.module.css";

export function MobilePayrollScreen() {
  return (
    <section className={styles.root} aria-label="Payroll">
      <div className={styles.placeholder}>
        <span className={styles.label}>Payroll — Mobile Screen</span>
        <span className={styles.hint}>Design pending. Structure ready.</span>
      </div>
    </section>
  );
}