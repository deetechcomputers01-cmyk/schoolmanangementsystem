/**
 * DesktopLayout — one file, one purpose.
 * Shell that composes DesktopSidebar + DesktopTopbar + main content area.
 * Used as the layout wrapper for all desktop pages.
 * Receives user/nav data as props — no data fetching inside.
 */

import { DesktopSidebar, type DesktopNavItem } from "../DesktopSidebar/DesktopSidebar";
import { DesktopTopbar } from "../DesktopTopbar/DesktopTopbar";
import styles from "./DesktopLayout.module.css";

interface DesktopLayoutProps {
  children: React.ReactNode;
  navItems: DesktopNavItem[];
  pageTitle?: string;
  pageSubtitle?: string;
  userName?: string;
  userInitials?: string;
  userRole?: string;
  syncStatus?: "online" | "offline" | "syncing";
  notificationCount?: number;
  pageActions?: React.ReactNode;
}

export function DesktopLayout({
  children,
  navItems,
  pageTitle = "",
  pageSubtitle,
  userName,
  userInitials,
  userRole,
  syncStatus = "online",
  notificationCount = 0,
  pageActions,
}: DesktopLayoutProps) {
  return (
    <div className={styles.shell}>
      <DesktopSidebar
        navItems={navItems}
        userName={userName}
        userInitials={userInitials}
        userRole={userRole}
        syncStatus={syncStatus}
      />

      <div className={styles.body}>
        <DesktopTopbar
          pageTitle={pageTitle}
          pageSubtitle={pageSubtitle}
          notificationCount={notificationCount}
          userInitials={userInitials}
          actions={pageActions}
        />
        <main className={styles.content} id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
