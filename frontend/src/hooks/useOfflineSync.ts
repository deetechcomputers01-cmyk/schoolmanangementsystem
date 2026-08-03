"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addToSyncQueue, countSyncQueue, flushSyncQueue } from "@/lib/offline/syncQueue";
import { useOnlineStatus } from "./useOnlineStatus";

// Settings > Offline & Sync: syncInterval (minutes, periodic re-flush safety net
// in case a reconnect event is missed) and offlineModeEnabled (kill switch — when
// off, failed writes are not queued at all, matching "offline mode disabled").
async function getOfflineSettings() {
  try {
    const res = await fetch("/api/settings");
    if (!res.ok) return { syncIntervalMinutes: 5, offlineModeEnabled: true };
    const data = await res.json();
    const extra = (data.extra ?? {}) as Record<string, unknown>;
    return {
      syncIntervalMinutes: Number(extra.syncInterval) || 5,
      offlineModeEnabled: extra.offlineModeEnabled !== false,
    };
  } catch {
    return { syncIntervalMinutes: 5, offlineModeEnabled: true };
  }
}

export function useOfflineSync() {
  const online = useOnlineStatus();
  const [pending, setPending] = useState(0);
  const offlineModeEnabled = useRef(true);

  const refresh = useCallback(async () => setPending(await countSyncQueue()), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!online) return;
    flushSyncQueue().finally(refresh);
  }, [online, refresh]);

  // Periodic re-flush + live config refresh, paced by the admin-configured sync interval.
  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    getOfflineSettings().then((settings) => {
      if (cancelled) return;
      offlineModeEnabled.current = settings.offlineModeEnabled;
      interval = setInterval(() => {
        if (navigator.onLine) flushSyncQueue().finally(refresh);
      }, settings.syncIntervalMinutes * 60 * 1000);
    });

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [refresh]);

  const enqueue = useCallback(
    async (url: string, body: unknown) => {
      if (online) {
        try {
          const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
          if (response.ok) return response;
        } catch {
          // Network request itself failed (not just a bad status) — fall through to the queue below.
        }
      }
      if (!offlineModeEnabled.current) return null;
      await addToSyncQueue(url, body);
      await refresh();
      return null;
    },
    [online, refresh]
  );

  return { online, pending, enqueue, flush: flushSyncQueue };
}
