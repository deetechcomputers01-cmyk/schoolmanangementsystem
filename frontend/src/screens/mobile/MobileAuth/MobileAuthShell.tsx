import type { ReactNode } from "react";
import { GraduationCap } from "lucide-react";
import styles from "./MobileAuthShell.module.css";

type MobileAuthShellProps = {
  title: string;
  schoolName: string;
  children: ReactNode;
};

export function MobileAuthShell({ title, schoolName, children }: MobileAuthShellProps) {
  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <svg className={styles.pattern} viewBox="0 0 375 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <ellipse cx="120" cy="120" rx="140" ry="100" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <ellipse cx="120" cy="120" rx="100" ry="140" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <ellipse cx="255" cy="120" rx="140" ry="100" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <ellipse cx="255" cy="120" rx="100" ry="140" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <GraduationCap className={styles.brandIcon} strokeWidth={1.8} aria-hidden="true" />
        <span className={styles.brandName}>{schoolName}</span>
        <h1 className={styles.title}>{title}</h1>
      </div>
      <div className={styles.sheet}>{children}</div>
    </div>
  );
}
