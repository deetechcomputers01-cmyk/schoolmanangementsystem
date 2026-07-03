"use client";

import { useCallback, useEffect, useState } from "react";
import { addToSyncQueue, countSyncQueue, flushSyncQueue } from "@/lib/offline/syncQueue";
import { useOnlineStatus } from "./useOnlineStatus";

export function useOfflineSync() {
  const online = useOnlineStatus();
  const [pending, setPending] = useState(0);

  const refresh = useCallback(async () => setPending(await countSyncQueue()), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!online) return;
    flushSyncQueue().finally(refresh);
  }, [online, refresh]);

  const enqueue = useCallback(
    async (url: string, body: unknown) => {
      if (online) {
        const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (response.ok) return response;
      }
      await addToSyncQueue(url, body);
      await refresh();
      return null;
    },
    [online, refresh]
  );

  return { online, pending, enqueue, flush: flushSyncQueue };
}
