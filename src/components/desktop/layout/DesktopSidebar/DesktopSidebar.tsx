"use client";

/**
 * DesktopSidebar — one file, one purpose.
 * Renders the 260px fixed navigation column for desktop viewports.
 * Receives nav items and active path as props — no internal routing logic.
 * Design: applied from Stitch "Institutional Excellence" system.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import styles from "./DesktopSidebar.module.css";

export interface DesktopNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group?: string;
}

interface DesktopSidebarProps {
  navItems: DesktopNavItem[];
  brandName?: string;
  brandTagline?: string;
  userInitials?: string;
  userName?: string;
  userRole?: string;
  syncStatus?: "online" | "offline" | "syncing";
}

export function DesktopSidebar({
  navItems,
  brandName = "ScholarSphere",
  brandTagline = "School Management",
  userInitials = "??",
  userName = "User",
  userRole = "",
  syncStatus = "online",
}: DesktopSidebarProps) {
  const pathname = usePathname();

  // Group nav items by their `group` field
  const groups = navItems.reduce<Record<string, DesktopNavItem[]>>((acc, item) => {
    const key = item.group ?? "main";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <aside className={styles.sidebar} aria-label="Main navigation">
      {/* Brand */}
      <div className={styles.brand}>
        <span className={styles.brandMark} aria-hidden>S</span>
        <div>
          <p className={styles.brandName}>{brandName}</p>
          <p className={styles.brandTagline}>{brandTagline}</p>
        </div>
      </div>

      {/* Nav groups */}
      <nav className={styles.nav}>
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className={styles.navGroup}>
            {group !== "main" && (
              <p className={styles.navGroupLabel}>{group}</p>
            )}
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={18} className={styles.navIcon} aria-hidden />
                  <span className={styles.navLabel}>{item.label}</span>
                  {isActive && <span className={styles.activeBar} aria-hidden />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sync status */}
      <div className={`${styles.syncStatus} ${styles[`sync_${syncStatus}`]}`}>
        <span className={styles.syncDot} aria-hidden />
        <span className={styles.syncText}>
          {syncStatus === "online" ? "Connected" : syncStatus === "syncing" ? "Syncing…" : "Offline mode"}
        </span>
      </div>

      {/* User profile */}
      <div className={styles.userProfile}>
        <span className={styles.userAvatar} aria-hidden>{userInitials}</span>
        <div className={styles.userInfo}>
          <p className={styles.userName}>{userName}</p>
          <p className={styles.userRole}>{userRole}</p>
        </div>
      </div>
    </aside>
  );
}
