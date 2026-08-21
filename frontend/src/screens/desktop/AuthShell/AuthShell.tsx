import type { ReactNode } from "react";
import styles from "./AuthShell.module.css";

type AuthShellProps = {
  aside: ReactNode;
  children: ReactNode;
  footerNote?: ReactNode;
  schoolName?: string;
};

export function AuthShell({ aside, children, footerNote, schoolName = "ScholarSphere" }: AuthShellProps) {
  return (
    <>
      <main className={styles.root}>
        <section className={styles.leftPanel}>{aside}</section>

        <section className={styles.rightPanel}>
          <div className={styles.rightDecor} aria-hidden="true">
            <svg className={`${styles.decorShape} ${styles.decorStar1}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.09 6.26L20.8 8.27l-5.09 4.36L17.8 19 12 15.4 6.2 19l2.09-6.37-5.09-4.36 6.71-.01z" />
            </svg>
            <svg className={`${styles.decorShape} ${styles.decorStar2}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.09 6.26L20.8 8.27l-5.09 4.36L17.8 19 12 15.4 6.2 19l2.09-6.37-5.09-4.36 6.71-.01z" />
            </svg>
            <svg className={`${styles.decorShape} ${styles.decorBalloon}`} viewBox="0 0 24 32" fill="none">
              <ellipse cx="12" cy="12" rx="10" ry="12" fill="currentColor" />
              <path d="M12 24v6M9 30h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <svg className={`${styles.decorShape} ${styles.decorPencil}`} viewBox="0 0 48 12" fill="currentColor">
              <rect x="6" y="2" width="36" height="8" rx="2" />
              <path d="M2 6l4-4v8z" />
            </svg>
            <svg className={`${styles.decorShape} ${styles.decorBlock}`} viewBox="0 0 32 32">
              <rect x="2" y="2" width="28" height="28" rx="6" fill="currentColor" />
              <text x="16" y="22" textAnchor="middle" fontSize="15" fontWeight="700" fill="#ffffff">A</text>
            </svg>
            <span className={`${styles.decorDot} ${styles.decorDot1}`} />
            <span className={`${styles.decorDot} ${styles.decorDot2}`} />
            <span className={`${styles.decorDot} ${styles.decorDot3}`} />
          </div>

          <div className={styles.mobileHero}>
            <img src="/students-hero.png" alt="" aria-hidden="true" />
            <div className={styles.mobileBrand}>
              <div className={styles.brandIcon} aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 22h18M2 11h20M12 2L2 7h20L12 2zM5 11v7M9 11v7M15 11v7M19 11v7" />
                </svg>
              </div>
              <span className={styles.mobileBrandTitle}>{schoolName}</span>
            </div>
          </div>

          <div className={styles.formWrap}>{children}</div>
        </section>
      </main>

      <footer className={styles.footer}>
        <span className={styles.footerBrand}>{schoolName}</span>
        <span className={styles.footerCopy}>
          &copy; {new Date().getFullYear()} {schoolName}. Institutional Security Protocol v4.2.
        </span>
        <div className={styles.footerLinks}>
          <a href="#" className={styles.footerLink}>Privacy Policy</a>
          <a href="#" className={styles.footerLink}>Terms of Service</a>
          <a href="#" className={styles.footerLink}>System Status</a>
        </div>
        {footerNote ? <div className={styles.footerNote}>{footerNote}</div> : null}
      </footer>
    </>
  );
}
