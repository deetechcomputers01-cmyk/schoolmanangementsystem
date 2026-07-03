/**
 * MobileLayout — one file, one purpose.
 * Shell for all mobile pages: header + scrollable content + bottom nav.
 * Receives nav tabs and page meta as props — no data fetching inside.
 */

import { MobileHeader } from "../MobileHeader/MobileHeader";
import { MobileBottomNav, type MobileNavTab } from "../MobileBottomNav/MobileBottomNav";
import styles from "./MobileLayout.module.css";

interface MobileLayoutProps {
  children: React.ReactNode;
  tabs: MobileNavTab[];
  pageTitle?: string;
  pageSubtitle?: string;
  showBack?: boolean;
  headerTrailing?: React.ReactNode;
  notificationCount?: number;
  hideBottomNav?: boolean;
}

export function MobileLayout({
  children,
  tabs,
  pageTitle = "",
  pageSubtitle,
  showBack = false,
  headerTrailing,
  notificationCount = 0,
  hideBottomNav = false,
}: MobileLayoutProps) {
  return (
    <div className={styles.shell}>
      <MobileHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        showBack={showBack}
        trailing={headerTrailing}
        notificationCount={notificationCount}
      />

      <main className={styles.content} id="main-content">
        {children}
      </main>

      {!hideBottomNav && <MobileBottomNav tabs={tabs} />}
    </div>
  );
}
