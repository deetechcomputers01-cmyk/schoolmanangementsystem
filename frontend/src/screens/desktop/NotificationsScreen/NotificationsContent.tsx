"use client";

import { useMemo, useState } from "react";
import {
  Clock, AlertCircle, Mail, Search, Bell, Megaphone, CreditCard,
  CheckCircle2, ClipboardCheck, GraduationCap,
} from "lucide-react";
import Link from "next/link";
import styles from "./NotificationsScreen.module.css";

type NotificationType = "fee_reminder" | "attendance_alert" | "exam_result" | "staff_announcement" | "system";
type FilterType = "all" | "unread" | NotificationType;

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

interface Props {
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
}

const FILTER_NAV: { key: FilterType; label: string; icon: typeof Bell }[] = [
  { key: "all",                label: "All",                icon: Bell },
  { key: "unread",              label: "Unread",             icon: Mail },
  { key: "fee_reminder",        label: "Fee Reminders",      icon: CreditCard },
  { key: "attendance_alert",    label: "Attendance",         icon: ClipboardCheck },
  { key: "exam_result",         label: "Exam Results",       icon: GraduationCap },
  { key: "staff_announcement",  label: "Announcements",      icon: Megaphone },
  { key: "system",              label: "System",             icon: AlertCircle },
];

const TYPE_ICON: Record<string, typeof Bell> = {
  fee_reminder: CreditCard,
  attendance_alert: ClipboardCheck,
  exam_result: GraduationCap,
  staff_announcement: Megaphone,
  system: AlertCircle,
};

const TYPE_LABEL: Record<string, string> = {
  fee_reminder: "Fee Reminder",
  attendance_alert: "Attendance Alert",
  exam_result: "Exam Result",
  staff_announcement: "Announcement",
  system: "System",
};

function fmtDate(d: string) {
  const dt = new Date(d);
  const diff = (Date.now() - dt.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function NotificationsContent({ initialNotifications, initialUnreadCount }: Props) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedId, setSelectedId] = useState<string | null>(initialNotifications[0]?.id ?? null);
  const [search, setSearch] = useState("");

  const selected = notifications.find((n) => n.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (filter === "all") return true;
      if (filter === "unread") return !n.isRead;
      return n.type === filter;
    });
  }, [notifications, search, filter]);

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try { await fetch(`/api/notifications/${id}/read`, { method: "PATCH" }); } catch {}
  }

  function selectNotification(n: NotificationItem) {
    setSelectedId(n.id);
    if (!n.isRead) markRead(n.id);
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try { await fetch("/api/notifications/read-all", { method: "POST" }); } catch {}
  }

  const stats = [
    { label: "Unread", value: String(unreadCount), icon: Mail },
    { label: "Total", value: String(notifications.length), icon: Bell },
    { label: "Fee Reminders", value: String(notifications.filter((n) => n.type === "fee_reminder").length), icon: CreditCard },
    { label: "Attendance Alerts", value: String(notifications.filter((n) => n.type === "attendance_alert").length), icon: ClipboardCheck },
  ];

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Notifications</h1>
            <p className={styles.subtitle}>Real-time alerts for fees, attendance, exam results, and school announcements.</p>
          </div>
          <div className={styles.headerActions}>
            {unreadCount > 0 && (
              <button className={styles.btnOutline} onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statGrid}>
        {stats.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <span className={styles.statIconWrap}>
              <s.icon size={18} className={styles.statIcon} />
            </span>
            <div>
              <span className={styles.statLabel}>{s.label}</span>
              <span className={styles.statValue}>{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Two-panel shell */}
      <div className={styles.shell}>
        <div className={styles.campaignList}>
          <div className={styles.listHeader}>
            <div className={styles.listHeaderRow}>
              <h3 className={styles.listTitle}>Notifications ({filtered.length})</h3>
              <label className={styles.listSearch}>
                <Search size={13} aria-hidden />
                <span className={styles.srOnly}>Search notifications</span>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" />
              </label>
            </div>
          </div>
          <div className={styles.filterTabs} role="tablist" aria-label="Notification filters">
            {FILTER_NAV.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={filter === item.key}
                className={`${styles.filterTab} ${filter === item.key ? styles.filterTabActive : ""}`}
                onClick={() => setFilter(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className={styles.listBody}>
            {filtered.length === 0 && (
              <div className={styles.listEmpty}>
                {search ? "No results match your search." : "No notifications yet."}
              </div>
            )}
            {filtered.map((n) => {
              const Icon = TYPE_ICON[n.type] ?? Bell;
              const isSelected = selectedId === n.id;
              return (
                <button
                  key={n.id}
                  className={`${styles.campaignItem} ${isSelected ? styles.campaignItemSelected : ""}`}
                  onClick={() => selectNotification(n)}
                >
                  <div className={styles.campaignRow}>
                    <span className={`${styles.campaignIconWrap} ${isSelected ? styles.campaignIconWrapActive : ""}`}>
                      <Icon size={16} />
                    </span>
                    <div className={styles.campaignBody}>
                      <div className={styles.campaignTop}>
                        <span className={styles.campaignTitle}>{n.title}</span>
                        <span className={styles.campaignTime}>{fmtDate(n.createdAt)}</span>
                      </div>
                      <p className={styles.campaignPreview}>{n.body.slice(0, 80)}{n.body.length > 80 ? "…" : ""}</p>
                      <div className={styles.campaignBadges}>
                        <span className={`${styles.badge} ${styles.badgeChannel}`}>{TYPE_LABEL[n.type] ?? n.type}</span>
                        {!n.isRead && <span className={styles.unreadDot} aria-label="Unread" />}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        <div className={styles.rightColumn}>
          <div className={styles.previewPanel}>
            {selected ? (
              <>
                <div className={styles.previewHeader}>
                  <div>
                    <h3 className={styles.previewTitle}>{selected.title}</h3>
                    <p className={styles.previewMeta}>{fmtDate(selected.createdAt)}</p>
                  </div>
                </div>

                <div className={styles.previewBody}>
                  <section className={styles.previewSection}>
                    <h4 className={styles.sectionLabel}>Type</h4>
                    <div className={styles.audienceCard}>
                      {(() => { const Icon = TYPE_ICON[selected.type] ?? Bell; return <Icon size={18} className={styles.audienceIcon} />; })()}
                      <div>
                        <p className={styles.audienceName}>{TYPE_LABEL[selected.type] ?? selected.type}</p>
                      </div>
                    </div>
                  </section>

                  <section className={styles.previewSection}>
                    <h4 className={styles.sectionLabel}>Message</h4>
                    <div className={styles.messageBubble}>
                      <div className={styles.bubbleTail} />
                      <p className={styles.messageText}>{selected.body}</p>
                    </div>
                  </section>

                  <section className={styles.previewSection}>
                    <h4 className={styles.sectionLabel}>Status</h4>
                    <div className={styles.deliveryGrid}>
                      <div className={styles.deliveryStat}>
                        <p className={styles.deliveryLabel}>Read</p>
                        <p className={styles.deliveryValue}>{selected.isRead ? "Yes" : "No"}</p>
                      </div>
                    </div>
                  </section>
                </div>

                <div className={styles.previewFooter}>
                  {selected.link && (
                    <Link href={selected.link} className={styles.btnPrimary}>
                      <CheckCircle2 size={15} />
                      Go to related page
                    </Link>
                  )}
                  {!selected.isRead && (
                    <button className={styles.btnOutline} onClick={() => markRead(selected.id)}>
                      Mark as read
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.emptyPreview}>
                <Bell size={32} />
                <p>Select a notification to preview it</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
