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
    <div className={styles.page}>
      <main className={styles.root}>
        <section className={styles.leftPanel}>{aside}</section>

        <section className={styles.rightPanel}>
          <div className={styles.rightDecor} aria-hidden="true">
            <img src="/decor/kite.png" alt="" className={`${styles.decorShape} ${styles.decorKite}`} />
            <img src="/decor/palette.png" alt="" className={`${styles.decorShape} ${styles.decorPalette}`} />
            <img src="/decor/crayon.png" alt="" className={`${styles.decorShape} ${styles.decorCrayon}`} />
            <img src="/decor/soccer.png" alt="" className={`${styles.decorShape} ${styles.decorSoccer}`} />
            <img src="/decor/balloon.png" alt="" className={`${styles.decorShape} ${styles.decorBalloon}`} />

            <img src="/decor/star.png" alt="" className={`${styles.decorShape} ${styles.decorStar}`} />
            <img src="/decor/puzzle.png" alt="" className={`${styles.decorShape} ${styles.decorPuzzle}`} />
            <img src="/decor/yoyo.png" alt="" className={`${styles.decorShape} ${styles.decorYoyo}`} />
            <img src="/decor/teddy.png" alt="" className={`${styles.decorShape} ${styles.decorTeddy}`} />

            <img src="/decor/gift.png" alt="" className={`${styles.decorShape} ${styles.decorGift}`} />
            <img src="/decor/dice.png" alt="" className={`${styles.decorShape} ${styles.decorDice}`} />
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
    </div>
  );
}
