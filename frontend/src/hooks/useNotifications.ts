"use client";

import { useCallback, useEffect, useState } from "react";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function useNotifications(initialUnreadCount = 0) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Ignore transient network errors — badge simply keeps its last-known value.
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((x) => (x.id === id ? { ...x, isRead: true } : x)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try { await fetch(`/api/notifications/${id}/read`, { method: "PATCH" }); } catch {}
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try { await fetch("/api/notifications/read-all", { method: "POST" }); } catch {}
  }, []);

  return { notifications, unreadCount, refresh, markRead, markAllRead };
}
