"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, ChevronDown } from "lucide-react";
import { NAV_ICON_MAP as ICON_MAP, type NavIconKey } from "@/lib/nav";
import styles from "./DesktopSidebar.module.css";

export interface DesktopNavItem {
  href: string;
  label: string;
  icon: NavIconKey;
  group?: string;
}

interface DesktopSidebarProps {
  navItems: DesktopNavItem[];
  brandName?: string;
  brandTagline?: string;
  logoUrl?: string | null;
  userInitials?: string;
  userName?: string;
  userRole?: string;
  syncStatus?: "online" | "offline" | "syncing";
}

export function DesktopSidebar({
  navItems,
  brandName = "ScholarSphere",
  brandTagline = "Admin Portal",
  logoUrl,
  userInitials = "??",
  userName = "User",
  userRole = "",
  syncStatus = "online",
}: DesktopSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  async function handleLogout() {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    window.location.href = "/login";
  }

  // Close drawer on route change
  useEffect(() => { setIsOpen(false); }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const visibleNavItems = navItems;

  const primaryLabels = ["Dashboard", "Students", "Staff", "Attendance", "Gradebook", "Fees", "Timetable", "Reports"];
  const primaryItems = primaryLabels
    .map((label) => visibleNavItems.find((item) => item.label === label))
    .filter((item): item is DesktopNavItem => Boolean(item));
  const settingsItem = visibleNavItems.find((item) => item.href === "/settings");
  const supportItem = visibleNavItems.find((item) => item.href === "/helpdesk");
  const secondaryItems = visibleNavItems.filter((item) =>
    !primaryLabels.includes(item.label) && item.href !== "/settings" && item.href !== "/helpdesk"
  );

  function renderNavItem(item: DesktopNavItem) {
    const Icon = ICON_MAP[item.icon];
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        key={`${item.href}-${item.label}`}
        href={item.href}
        className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon size={18} className={styles.navIcon} aria-hidden />
        <span className={styles.navLabel}>{item.href === "/helpdesk" ? "Support" : item.label}</span>
        {isActive && <span className={styles.activeBar} aria-hidden />}
      </Link>
    );
  }

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className={styles.brand}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className={styles.brandMark} style={{ objectFit: "contain" }} aria-hidden />
        ) : (
          <span className={styles.brandMark} aria-hidden>{(brandName || "SS").slice(0, 2).toUpperCase()}</span>
        )}
        <div>
          <p className={styles.brandName}>{brandName}</p>
          <p className={styles.brandTagline}>{brandTagline}</p>
        </div>
        {/* Close button — mobile only */}
        <button
          className={styles.closeBtn}
          onClick={() => setIsOpen(false)}
          aria-label="Close navigation"
        >
          <X size={20} />
        </button>
      </div>
      {/* Nav groups */}
      <nav className={styles.nav}>
        <div className={styles.navGroup}>{primaryItems.map(renderNavItem)}</div>
        {secondaryItems.length > 0 && (
          <>
            <button type="button" className={styles.moreToggle} onClick={() => setMoreOpen((open) => !open)} aria-expanded={moreOpen}>
              <span>More modules</span>
              <ChevronDown size={15} className={moreOpen ? styles.moreToggleOpen : ""} aria-hidden />
            </button>
            {moreOpen && <div className={styles.navGroup}>{secondaryItems.map(renderNavItem)}</div>}
          </>
        )}
      </nav>

      <div className={styles.footerNav}>
        {settingsItem && renderNavItem(settingsItem)}
        {supportItem && renderNavItem(supportItem)}
      </div>

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

      {/* Logout */}
      <div className={styles.logoutSection}>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <LogOut size={18} aria-hidden />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── Hamburger trigger — only visible on mobile ─────────── */}
      <button
        className={styles.hamburgerBtn}
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation"
        aria-expanded={isOpen}
      >
        <Menu size={22} />
      </button>

      {/* ── Backdrop overlay — mobile drawer ───────────────────── */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ""}`}
        onClick={() => setIsOpen(false)}
        aria-hidden
      />

      {/* ── Sidebar panel ──────────────────────────────────────── */}
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
        aria-label="Main navigation"
      >
        {sidebarContent}
      </aside>
    </>
  );
}
