"use client";

/**
 * MobileHeader — sticky top bar for mobile: back/avatar, title, notification bell.
 */

import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, Bell } from "lucide-react";
import { deriveTitle } from "@/lib/pageTitles";
import { useNotifications } from "@/hooks/useNotifications";
import styles from "./MobileHeader.module.css";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  trailing?: React.ReactNode;
  notificationCount?: number;
  userInitials?: string;
}

export function MobileHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  trailing,
  notificationCount = 0,
  userInitials = "SA",
}: MobileHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount } = useNotifications(notificationCount);
  const resolvedTitle = deriveTitle(pathname) || title;
  // Settings' section pages (/settings/<section>) are real routes now, not
  // sheets — they always need a back arrow to their list, regardless of
  // what the caller passed in.
  const isSettingsSection = /^\/settings\/[^/]+$/.test(pathname);
  const resolvedShowBack = showBack || isSettingsSection;

  return (
    <header className={styles.header}>
      {resolvedShowBack ? (
        <button type="button" className={styles.backBtn} onClick={onBack ?? (() => router.back())} aria-label="Go back">
          <ChevronLeft size={22} />
        </button>
      ) : (
        <button type="button" className={styles.avatarBtn} onClick={() => router.push("/settings")} aria-label="Account">
          {userInitials}
        </button>
      )}

      <div className={styles.titleBlock}>
        <h1 className={styles.title}>{resolvedTitle}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      <div className={styles.trailing}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => router.push("/notifications")}
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className={styles.notifDot} aria-hidden />
          )}
        </button>
        {trailing}
      </div>
    </header>
  );
}
