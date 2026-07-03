"use client";

/**
 * MobileHeader — one file, one purpose.
 * 56px sticky top bar for mobile. Shows page title + optional back + actions.
 */

import styles from "./MobileHeader.module.css";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  trailing?: React.ReactNode;
  notificationCount?: number;
}

export function MobileHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  trailing,
  notificationCount = 0,
}: MobileHeaderProps) {
  return (
    <header className={styles.header}>
      {showBack && (
        <button
          type="button"
          className={styles.backBtn}
          onClick={onBack}
          aria-label="Go back"
        >
          {/* Icon: filled by Stitch design */}
        </button>
      )}

      <div className={styles.titleBlock}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      <div className={styles.trailing}>
        {/* Notifications */}
        <button
          type="button"
          className={styles.iconBtn}
          aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ""}`}
        >
          {/* Icon: filled by Stitch design */}
          {notificationCount > 0 && (
            <span className={styles.notifDot} aria-hidden />
          )}
        </button>

        {/* Custom trailing actions */}
        {trailing}
      </div>
    </header>
  );
}
