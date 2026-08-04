"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { NAV_ICON_MAP as ICON_MAP, type NavIconKey } from "@/lib/nav";
import styles from "./DesktopSidebar.module.css";

export interface DesktopNavItem {
  href: string;
  label: string;
  icon: NavIconKey;
  group?: string;
}

// Same real groups nav.ts assigns every item to — display labels + the
// order groups appear in, so the sidebar reflects the actual module
// taxonomy instead of an arbitrary "primary 8 + everything else hidden"
// split. Every item stays visible; grouping is purely organizational.
const GROUP_LABELS: Record<string, string> = {
  main: "Overview",
  academics: "Academics",
  campus: "Campus",
  finance: "Finance",
  management: "Management",
  communication: "Communication",
  system: "System",
  portals: "My Portal",
};
const GROUP_ORDER = Object.keys(GROUP_LABELS);

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

  const settingsItem = visibleNavItems.find((item) => item.href === "/settings");
  const supportItem = visibleNavItems.find((item) => item.href === "/helpdesk");
  const groupableItems = visibleNavItems.filter((item) => item.href !== "/settings" && item.href !== "/helpdesk");
  const groups = GROUP_ORDER
    .map((key) => ({ key, label: GROUP_LABELS[key], items: groupableItems.filter((item) => item.group === key) }))
    .filter((group) => group.items.length > 0);
  // Anything without a recognised group (shouldn't happen — every nav.ts
  // entry has one — but keeps items visible instead of silently dropping
  // them if that ever drifts).
  const ungrouped = groupableItems.filter((item) => !item.group || !GROUP_LABELS[item.group]);

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
      {/* Nav groups — every item visible, organised by real module group */}
      <nav className={styles.nav}>
        {groups.map((group) => (
          <div key={group.key} className={styles.navGroupBlock}>
            <p className={styles.navGroupLabel}>{group.label}</p>
            <div className={styles.navGroup}>{group.items.map(renderNavItem)}</div>
          </div>
        ))}
        {ungrouped.length > 0 && (
          <div className={styles.navGroup}>{ungrouped.map(renderNavItem)}</div>
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
