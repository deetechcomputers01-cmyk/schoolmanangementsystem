"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Wifi, WifiOff, Upload, AlertCircle, RefreshCw, CheckCircle2,
} from "lucide-react";
import { listSyncQueue, flushSyncQueue } from "@/lib/offline/syncQueue";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import type { SyncJob } from "@/lib/offline/db";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import styles from "./OfflineSyncScreen.module.css";

function moduleLabel(url: string): string {
  const match = url.match(/\/api\/([a-z-]+)/i);
  if (!match) return "Unknown";
  const seg = match[1];
  return seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
}

function fmtCreated(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function OfflineSyncContent() {
  const online = useOnlineStatus();
  const [queue, setQueue] = useState<SyncJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { showToast } = useToast();

  const refresh = useCallback(async () => {
    setQueue(await listSyncQueue());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    // IndexedDB has no change-subscription API, so poll while this page is open —
    // catches jobs enqueued from other tabs/pages and the queue draining on reconnect.
    const interval = setInterval(refresh, 4000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleSync = useCallback(async () => {
    if (!online) {
      showToast("Still offline — queued items will sync automatically once connected.");
      return;
    }
    setSyncing(true);
    try {
      const { synced, remaining } = await flushSyncQueue();
      await refresh();
      showToast(
        remaining > 0
          ? `Synced ${synced} of ${synced + remaining}. ${remaining} still pending.`
          : synced > 0
            ? `Synced ${synced} queued action${synced === 1 ? "" : "s"}.`
            : "Nothing to sync."
      );
    } finally {
      setSyncing(false);
    }
  }, [online, refresh]);

  const failedCount = queue.filter((j) => (j.attempts ?? 0) > 0).length;
  const pendingCount = queue.length - failedCount;

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Offline Sync Center</h1>
          <p className={styles.pageSubtitle}>Actions saved while offline are queued here on this device and sent once you&apos;re back online.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnPrimary} onClick={handleSync} disabled={syncing || queue.length === 0}>
            <Upload size={13} /> {syncing ? "Syncing…" : "Sync Now"}
          </button>
        </div>
      </div>

      {/* Status strip */}
      <div className={styles.statusStrip}>
        <div className={styles.statusItem}>
          {online ? <Wifi size={22} className={styles.statusIconGreen} /> : <WifiOff size={22} className={styles.statusIconError} />}
          <div>
            <div className={styles.statusLabel}>Online Status</div>
            <div className={`${styles.statusValue} ${online ? styles.statusValueGreen : styles.statusValueError}`}>
              {online ? "Connected" : "Offline"}
            </div>
          </div>
        </div>
        <div className={styles.statusItem}>
          <Upload size={22} className={styles.statusIcon} />
          <div>
            <div className={styles.statusLabel}>Queue Items</div>
            <div className={styles.statusValue}>{pendingCount}</div>
          </div>
        </div>
        <div className={styles.statusItem}>
          <AlertCircle size={22} className={failedCount > 0 ? styles.statusIconError : styles.statusIcon} />
          <div>
            <div className={styles.statusLabel}>Failed Syncs</div>
            <div className={`${styles.statusValue} ${failedCount > 0 ? styles.statusValueError : ""}`}>{failedCount}</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <div className={styles.mainPanel}>
          <div className={styles.queueHeader}>
            <div className={styles.queueTitle}>Action Queue — this device</div>
            <button className={styles.syncAllBtn} onClick={handleSync} disabled={syncing || queue.length === 0}>
              <RefreshCw size={12} /> Retry All
            </button>
          </div>
          <div className={styles.tableWrap}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Module</th>
                    <th className={styles.th}>Method</th>
                    <th className={styles.th}>Queued</th>
                    <th className={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "40px 16px", color: "#71787b", fontSize: "var(--text-xs)" }}>Loading queue…</td></tr>
                  )}
                  {!loading && queue.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: "40px 16px", color: "#71787b", fontSize: "var(--text-xs)" }}>
                        <CheckCircle2 size={24} style={{ display: "block", margin: "0 auto 8px", opacity: 0.4 }} />
                        No pending sync operations.
                      </td>
                    </tr>
                  )}
                  {queue.map((job) => {
                    const failed = (job.attempts ?? 0) > 0;
                    return (
                      <tr key={job.id} className={`${styles.tr} ${failed ? styles.trFailed : ""}`}>
                        <td className={styles.td} style={{ fontWeight: 600 }}>{moduleLabel(job.url)}</td>
                        <td className={`${styles.td} ${styles.tdMuted}`}>{job.method}</td>
                        <td className={`${styles.td} ${styles.tdMuted}`}>{fmtCreated(job.createdAt)}</td>
                        <td className={styles.td}>
                          {failed ? (
                            <span title={job.lastError} className={styles.statusFailed}>Failed ({job.attempts})</span>
                          ) : (
                            <span className={styles.statusPending}>Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
