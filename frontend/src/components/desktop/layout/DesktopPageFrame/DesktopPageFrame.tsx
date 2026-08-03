import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./DesktopPageFrame.module.css";

type DesktopPageFrameProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  variant?: "dashboard" | "standard";
};

export function DesktopPageFrame({
  eyebrow,
  title,
  subtitle,
  action,
  children,
  variant = "dashboard",
}: DesktopPageFrameProps) {
  return (
    <section className={`${styles.frame} ${variant === "standard" ? styles.frameStandard : styles.frameDashboard}`}>
      <header className={`${styles.header} ${variant === "standard" ? styles.headerStandard : ""}`}>
        <div className={styles.heading}>
          {eyebrow ? <p className={`${styles.eyebrow} ${variant === "standard" ? styles.eyebrowStandard : ""}`}>{eyebrow}</p> : null}
          <h1 className={`${styles.title} ${variant === "standard" ? styles.titleStandard : ""}`}>{title}</h1>
          {subtitle ? <p className={`${styles.subtitle} ${variant === "standard" ? styles.subtitleStandard : ""}`}>{subtitle}</p> : null}
        </div>

        {action ? <div className={styles.actions}>{action}</div> : null}
      </header>

      <div className={`${styles.body} ${variant === "standard" ? styles.bodyStandard : ""}`}>{children}</div>
    </section>
  );
}

export function DesktopPageActionLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={styles.actionLink}>
      {children}
    </Link>
  );
}
