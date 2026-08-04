"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, ChevronDown, RefreshCw } from "lucide-react";
import { deriveTitle } from "@/lib/pageTitles";
import { useNotifications, timeAgo, type NotificationItem } from "@/hooks/useNotifications";
import styles from "./DesktopTopbar.module.css";

interface DesktopTopbarProps {
  pageTitle?:          string;
  notificationCount?:  number;
  userInitials?:       string;
  userName?:           string;
  userRole?:           string;
}

export function DesktopTopbar({
  pageTitle,
  notificationCount = 0,
  userInitials = "SA",
  userName = "User",
  userRole = "",
}: DesktopTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const title = deriveTitle(pathname) || pageTitle || "";

  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(notificationCount);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleNotificationClick(n: NotificationItem) {
    if (!n.isRead) markRead(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <header className={styles.topbar} role="banner">
      <div className={styles.heading}>
        <h1 className={styles.pageTitle}>{title}</h1>
      </div>

      <div className={styles.controls}>
        <div className={styles.notifWrap} ref={panelRef}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
            onClick={() => setOpen((o) => !o)}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className={styles.badge} aria-hidden>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className={styles.notifPanel} role="menu">
              <div className={styles.notifPanelHeader}>
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <button type="button" className={styles.notifMarkAll} onClick={markAllRead}>
                    Mark all read
                  </button>
                )}
              </div>
              <div className={styles.notifList}>
                {notifications.length === 0 ? (
                  <p className={styles.notifEmpty}>No notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className={`${styles.notifItem} ${n.isRead ? "" : styles.notifItemUnread}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <span className={styles.notifDot} aria-hidden={n.isRead} style={{ visibility: n.isRead ? "hidden" : "visible" }} />
                      <span className={styles.notifBody}>
                        <span className={styles.notifTitle}>{n.title}</span>
                        <span className={styles.notifText}>{n.body}</span>
                        <span className={styles.notifTime}>{timeAgo(n.createdAt)}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
              <Link href="/notifications" className={styles.notifViewAll} onClick={() => setOpen(false)}>
                View all notifications
              </Link>
            </div>
          )}
        </div>

        {userRole === "admin" && (
          <Link href="/offline-sync" className={styles.iconBtn} aria-label="Open sync status">
            <RefreshCw size={17} />
          </Link>
        )}

        <span className={styles.divider} aria-hidden />

        <button type="button" className={styles.profileBtn} aria-label="Account menu">
          <span className={styles.avatar} aria-hidden>{userInitials}</span>
          <span className={styles.profileCopy}>
            <span className={styles.profileName}>{userName}</span>
            <span className={styles.profileRole}>{userRole || "Administrator"}</span>
          </span>
          <ChevronDown size={14} className={styles.profileChevron} aria-hidden />
        </button>
      </div>
    </header>
  );
}
