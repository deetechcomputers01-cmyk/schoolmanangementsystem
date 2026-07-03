"use client";

/**
 * DesktopTopbar — one file, one purpose.
 * 64px fixed top bar: page title, search, notifications, avatar.
 * Rendered inside DesktopLayout, above the main content area.
 */

import styles from "./DesktopTopbar.module.css";

interface DesktopTopbarProps {
  pageTitle: string;
  pageSubtitle?: string;
  notificationCount?: number;
  userInitials?: string;
  onSearchChange?: (value: string) => void;
  actions?: React.ReactNode;
}

export function DesktopTopbar({
  pageTitle,
  pageSubtitle,
  notificationCount = 0,
  userInitials = "??",
  actions,
}: DesktopTopbarProps) {
  return (
    <header className={styles.topbar} role="banner">
      {/* Page heading */}
      <div className={styles.heading}>
        <h1 className={styles.pageTitle}>{pageTitle}</h1>
        {pageSubtitle && <p className={styles.pageSubtitle}>{pageSubtitle}</p>}
      </div>

      {/* Right-side controls */}
      <div className={styles.controls}>
        {/* Contextual page actions slot */}
        {actions && <div className={styles.actionsSlot}>{actions}</div>}

        {/* Search */}
        <div className={styles.searchWrap} role="search">
          <span className={styles.searchIcon} aria-hidden>
            {/* Icon filled by Stitch design */}
          </span>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search…"
            aria-label="Search"
          />
        </div>

        {/* Notifications */}
        <button
          type="button"
          className={styles.iconBtn}
          aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ""}`}
        >
          {/* Icon filled by Stitch design */}
          {notificationCount > 0 && (
            <span className={styles.badge} aria-hidden>
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </button>

        {/* Avatar */}
        <button type="button" className={styles.avatarBtn} aria-label="Account menu">
          <span className={styles.avatar} aria-hidden>{userInitials}</span>
        </button>
      </div>
    </header>
  );
}
