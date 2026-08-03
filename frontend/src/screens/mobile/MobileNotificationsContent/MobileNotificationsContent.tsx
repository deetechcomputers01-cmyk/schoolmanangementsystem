"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search, Bell, CreditCard, GraduationCap, Megaphone, AlertTriangle, RefreshCw, CheckCheck, ArrowRight,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import type { NotificationItem } from "@/screens/desktop/NotificationsScreen/NotificationsContent";
import styles from "./MobileNotificationsContent.module.css";

type NotificationType = "fee_reminder" | "attendance_alert" | "exam_result" | "staff_announcement" | "system";
type FilterType = "all" | "unread" | NotificationType;

interface Props {
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
}

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "attendance_alert", label: "Attendance" },
  { key: "fee_reminder", label: "Fees" },
  { key: "exam_result", label: "Exams" },
  { key: "staff_announcement", label: "Announcements" },
  { key: "system", label: "System" },
];

const TYPE_META: Record<string, { icon: typeof Bell; tone: string; label: string }> = {
  fee_reminder: { icon: CreditCard, tone: "success", label: "Fee Reminder" },
  attendance_alert: { icon: AlertTriangle, tone: "danger", label: "Attendance Alert" },
  exam_result: { icon: GraduationCap, tone: "warning", label: "Exam Result" },
  staff_announcement: { icon: Megaphone, tone: "info", label: "Announcement" },
  system: { icon: RefreshCw, tone: "muted", label: "System" },
};

function fmtTime(iso: string) {
  const dt = new Date(iso);
  const diff = (Date.now() - dt.getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "Yesterday";
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function MobileNotificationsContent({ initialNotifications, initialUnreadCount }: Props) {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [markingAll, setMarkingAll] = useState(false);

  // The very first (most recent, since the API returns createdAt desc) unread
  // notification gets the expanded "urgent" treatment with inline actions —
  // mirrors the Stitch mockup's single highlighted top card.
  const topUnreadId = useMemo(() => notifications.find((n) => !n.isRead)?.id ?? null, [notifications]);

  const stats = useMemo(
    () => [
      { key: "unread", label: "Unread", value: unreadCount, tone: "accent" },
      { key: "attendance_alert", label: "Attendance", value: notifications.filter((n) => n.type === "attendance_alert").length, tone: "danger" },
      { key: "fee_reminder", label: "Fees", value: notifications.filter((n) => n.type === "fee_reminder").length, tone: "success" },
      { key: "exam_result", label: "Exams", value: notifications.filter((n) => n.type === "exam_result").length, tone: "warning" },
      { key: "staff_announcement", label: "Announcements", value: notifications.filter((n) => n.type === "staff_announcement").length, tone: "info" },
    ],
    [notifications, unreadCount],
  );

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      const q = search.trim().toLowerCase();
      if (q && !n.title.toLowerCase().includes(q) && !n.body.toLowerCase().includes(q)) return false;
      if (filter === "all") return true;
      if (filter === "unread") return !n.isRead;
      return n.type === filter;
    });
  }, [notifications, search, filter]);

  const groups = useMemo(() => {
    const now = new Date();
    const today: NotificationItem[] = [];
    const earlier: NotificationItem[] = [];
    filtered.forEach((n) => {
      (isSameDay(new Date(n.createdAt), now) ? today : earlier).push(n);
    });
    return [
      { label: "Today", items: today },
      { label: "Earlier", items: earlier },
    ].filter((g) => g.items.length > 0);
  }, [filtered]);

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    } catch {}
  }

  async function markAllRead() {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      showToast("All notifications marked as read.");
    } catch {
      showToast("Failed to sync — will retry on next refresh.", "error");
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.topRow}>
        <p className={styles.subtitle}>Real-time alerts for fees, attendance, exams, and announcements.</p>
        {unreadCount > 0 && (
          <button type="button" className={styles.markAllBtn} onClick={markAllRead} disabled={markingAll}>
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      <div className={styles.statsScroll}>
        {stats.map((s) => (
          <div key={s.key} className={styles.statPill}>
            <span className={`${styles.statDot} ${styles[`dot_${s.tone}`]}`} aria-hidden />
            <span className={styles.statLabel}>{s.label}</span>
            <strong className={styles.statValue}>{s.value}</strong>
          </div>
        ))}
      </div>

      <label className={kit.searchWrap}>
        <Search size={16} className={kit.searchIcon} />
        <input
          className={`${kit.input} ${kit.searchInput}`}
          placeholder="Search notifications"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      <div className={styles.filterScroll}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`${kit.chip} ${styles.chipNoShrink} ${filter === f.key ? kit.chipActive : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {filtered.length === 0 && (
          <p className={kit.emptyText}>{search ? "No results match your search." : "No notifications yet."}</p>
        )}
        {groups.map((group) => (
          <section key={group.label} className={styles.group}>
            <h3 className={styles.groupLabel}>{group.label}</h3>
            <div className={styles.groupList}>
              {group.items.map((n) => {
                const meta = TYPE_META[n.type] ?? { icon: Bell, tone: "muted", label: n.type };
                const Icon = meta.icon;
                const isUrgent = n.id === topUnreadId;

                const rowContent = (
                  <>
                    {!n.isRead && <span className={styles.unreadDot} aria-hidden />}
                    <span className={`${styles.iconBadge} ${styles[`icon_${meta.tone}`]}`}>
                      <Icon size={17} />
                    </span>
                    <div className={styles.cardBody}>
                      <div className={styles.cardTop}>
                        <p className={`${styles.cardTitle} ${!n.isRead ? styles.cardTitleUnread : ""}`}>{n.title}</p>
                        <span className={styles.cardTime}>{fmtTime(n.createdAt)}</span>
                      </div>
                      <p className={styles.cardSnippet}>{n.body}</p>

                      {isUrgent && (
                        <div className={styles.actionRow} onClick={(e) => e.stopPropagation()}>
                          {n.link && (
                            <Link href={n.link} className={styles.actionPrimary} onClick={() => markRead(n.id)}>
                              View details <ArrowRight size={13} />
                            </Link>
                          )}
                          <button type="button" className={styles.actionOutline} onClick={() => markRead(n.id)}>
                            Mark read
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                );

                const cardClass = `${styles.card} ${isUrgent ? styles.cardUrgent : ""}`;

                if (!isUrgent && n.link) {
                  return (
                    <Link key={n.id} href={n.link} className={cardClass} onClick={() => !n.isRead && markRead(n.id)}>
                      {rowContent}
                    </Link>
                  );
                }
                return (
                  <div
                    key={n.id}
                    className={cardClass}
                    role={!isUrgent ? "button" : undefined}
                    tabIndex={!isUrgent ? 0 : undefined}
                    onClick={() => !isUrgent && !n.isRead && markRead(n.id)}
                    onKeyDown={(e) => {
                      if (!isUrgent && (e.key === "Enter" || e.key === " ") && !n.isRead) {
                        e.preventDefault();
                        markRead(n.id);
                      }
                    }}
                  >
                    {rowContent}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
