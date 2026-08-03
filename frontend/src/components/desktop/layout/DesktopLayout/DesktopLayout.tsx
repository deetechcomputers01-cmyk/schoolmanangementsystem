/**
 * DesktopLayout — one file, one purpose.
 * Shell that composes DesktopSidebar + DesktopTopbar + main content area.
 * Used as the layout wrapper for all desktop pages.
 * Receives user/nav data as props — no data fetching inside.
 */

import { DesktopSidebar, type DesktopNavItem } from "../DesktopSidebar/DesktopSidebar";
import { DesktopTopbar } from "../DesktopTopbar/DesktopTopbar";
import { MobileHeader } from "@/components/mobile/layout/MobileHeader/MobileHeader";
import { MobileBottomNav, type MobileNavTab, type MobileMoreItem } from "@/components/mobile/layout/MobileBottomNav/MobileBottomNav";
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
  brandName?: string;
  logoUrl?: string | null;
}

// Candidate primary mobile tabs in priority order — the first 4 that exist in
// this role's nav become the bottom bar; everything else lives behind "More".
const MOBILE_PRIMARY_PRIORITY = ["Dashboard", "My Dashboard", "Students", "Attendance", "Fees", "Staff", "Timetable", "Announcements"];

function buildMobileNav(navItems: DesktopNavItem[]): { tabs: MobileNavTab[]; moreItems: MobileMoreItem[] } {
  const primary = MOBILE_PRIMARY_PRIORITY
    .map((label) => navItems.find((item) => item.label === label))
    .filter((item): item is DesktopNavItem => Boolean(item))
    .slice(0, 4);
  const primaryHrefs = new Set(primary.map((item) => item.href));

  const tabs: MobileNavTab[] = [
    ...primary.map((item) => ({ href: item.href, label: item.label === "My Dashboard" ? "Home" : item.label, icon: item.icon })),
    { href: "#more", label: "More", icon: "MoreHorizontal" as const },
  ];
  const moreItems: MobileMoreItem[] = navItems
    .filter((item) => !primaryHrefs.has(item.href))
    .map((item) => ({ href: item.href, label: item.label, icon: item.icon, group: item.group ?? "main" }));

  return { tabs, moreItems };
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
  brandName,
  logoUrl,
}: DesktopLayoutProps) {
  const { tabs, moreItems } = buildMobileNav(navItems);

  return (
    <div className={styles.shell}>
      <div className={styles.desktopOnly}>
        <DesktopSidebar
          navItems={navItems}
          userName={userName}
          userInitials={userInitials}
          userRole={userRole}
          syncStatus={syncStatus}
          brandName={brandName}
          logoUrl={logoUrl}
        />
      </div>

      <div className={styles.body}>
        <div className={styles.desktopOnly}>
          <DesktopTopbar
            pageTitle={pageTitle}
            notificationCount={notificationCount}
            userInitials={userInitials}
            userName={userName}
            userRole={userRole}
          />
        </div>
        <div className={styles.mobileOnly}>
          <MobileHeader
            title={pageTitle}
            subtitle={pageSubtitle}
            notificationCount={notificationCount}
            userInitials={userInitials}
          />
        </div>

        <main className={styles.content} id="main-content">
          {children}
        </main>

        <div className={styles.mobileOnly}>
          <MobileBottomNav tabs={tabs} moreItems={moreItems} userName={userName} userRole={userRole} />
        </div>
      </div>
    </div>
  );
}
