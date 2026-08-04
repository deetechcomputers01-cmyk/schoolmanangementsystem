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

export function moduleLabel(url: string): string {
  const match = url.match(/\/api\/([a-z-]+)/i);
  if (!match) return "Unknown";
  const seg = match[1];
  return seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
}

export function fmtCreated(ts: number): string {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, refresh]);

  const failedCount = queue.filter((j) => (j.attempts ?? 0) > 0).length;
  const pendingCount = queue.length - failedCount;

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Offline Sync Center</h1>
          <p className={styles.pageSubtitle}>Actions saved while offline are queued here on this device and sent once you&apos;re back online.</p>
        </div>
        <button className={styles.syncBtn} onClick={handleSync} disabled={syncing || queue.length === 0}>
          <Upload size={15} className={syncing ? styles.spinning : undefined} /> {syncing ? "Syncing…" : "Sync Now"}
        </button>
      </div>

      <div className={styles.statusStrip}>
        <div className={styles.statusCard}>
          <div className={`${styles.statusIconCircle} ${online ? "" : styles.statusIconCircleOffline}`}>
            {online ? <Wifi size={20} /> : <WifiOff size={20} />}
          </div>
          <div>
            <div className={styles.statusLabel}>Online Status</div>
            <div className={styles.statusValueRow}>
              <span className={`${styles.statusDot} ${online ? "" : styles.statusDotError}`} />
              <span className={`${styles.statusValue} ${online ? "" : styles.statusValueError}`}>{online ? "Connected" : "Offline"}</span>
            </div>
          </div>
        </div>
        <div className={styles.statusCard}>
          <div className={`${styles.statusIconCircle} ${styles.statusIconCircleInfo}`}><Upload size={20} /></div>
          <div>
            <div className={styles.statusLabel}>Queue Items</div>
            <span className={styles.statusValueBig}>{pendingCount}</span>
          </div>
        </div>
        <div className={`${styles.statusCard} ${failedCount > 0 ? styles.statusCardError : ""}`}>
          <div className={`${styles.statusIconCircle} ${failedCount > 0 ? styles.statusIconCircleError : styles.statusIconCircleInfo}`}><AlertCircle size={20} /></div>
          <div>
            <div className={styles.statusLabel}>Failed Syncs</div>
            <span className={`${styles.statusValueBig} ${failedCount > 0 ? styles.statusValueError : ""}`}>{failedCount}</span>
          </div>
        </div>
      </div>

      <div className={styles.queueCard}>
        <div className={styles.queueCardHeader}>
          <h3 className={styles.queueCardTitle}>Action Queue — this device</h3>
          <button className={styles.retryBtn} onClick={handleSync} disabled={syncing || queue.length === 0}>
            <RefreshCw size={13} className={syncing ? styles.spinning : undefined} /> Retry All
          </button>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Module</th>
                <th className={styles.th}>Method</th>
                <th className={styles.th}>Queued</th>
                <th className={`${styles.th} ${styles.thRight}`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={4} className={styles.loadingRow}>Loading queue…</td></tr>
              )}
              {!loading && queue.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className={styles.emptyState}>
                      <CheckCircle2 size={26} style={{ opacity: 0.35 }} />
                      No pending sync operations.
                    </div>
                  </td>
                </tr>
              )}
              {queue.map((job) => {
                const failed = (job.attempts ?? 0) > 0;
                return (
                  <tr key={job.id} className={`${styles.tr} ${failed ? styles.trFailed : ""}`}>
                    <td className={styles.td}>{moduleLabel(job.url)}</td>
                    <td className={styles.td}><span className={styles.methodChip}>{job.method}</span></td>
                    <td className={`${styles.td} ${styles.tdMuted}`}>{fmtCreated(job.createdAt)}</td>
                    <td className={`${styles.td} ${styles.thRight}`}>
                      {failed ? (
                        <span title={job.lastError} className={styles.statusFailedPill}>Failed ({job.attempts})</span>
                      ) : (
                        <span className={styles.statusPendingPill}>Pending</span>
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
  );
}
