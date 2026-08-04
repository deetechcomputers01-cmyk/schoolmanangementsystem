"use client";

/**
 * MobileOfflineSyncContent — bespoke mobile view for Offline Sync.
 *
 * Every field/action traces back to OfflineSyncContent.tsx (the real
 * desktop component) and the real syncQueue/settings APIs — same
 * listSyncQueue()/flushSyncQueue() polling loop, same moduleLabel()/
 * fmtCreated() formatting.
 *
 * Deviations from the Stitch mockup (offline_sync_mobile_admin):
 *   - "Last Sync: 2m ago" is fabricated — no successful-sync timestamp is
 *     ever recorded anywhere (synced jobs are just removed from the queue,
 *     nothing logs when). Replaced with the real Queue Items / Failed Syncs
 *     counts desktop's status strip already shows.
 *   - The 3 "Pending Synchronizations" items (Attendance Export, Student
 *     Photo Upload, Exam Marks) are fabricated examples — replaced with the
 *     real per-device queue (module name derived from the queued request's
 *     URL, exactly like desktop's table).
 *   - "Offline Mode — Allow local data caching" toggle DOES have real
 *     backing: `offlineModeEnabled` in Settings → Offline & Sync, which
 *     useOfflineSync.ts already reads as a kill switch. It isn't fabricated,
 *     but it's a school-wide setting (not per-device, not previously
 *     reachable from this screen) restricted to Super Admin/Principal —
 *     surfaced here read/write, disabled with an explanation for other
 *     roles, exactly like the desktop Settings screen enforces.
 */

import { useCallback, useEffect, useState } from "react";
import { Wifi, WifiOff, Upload, AlertCircle, RefreshCw, CheckCircle2, Lock } from "lucide-react";
import { listSyncQueue, flushSyncQueue } from "@/lib/offline/syncQueue";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import type { SyncJob } from "@/lib/offline/db";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { moduleLabel, fmtCreated } from "@/screens/desktop/OfflineSyncScreen/OfflineSyncContent";
import styles from "./MobileOfflineSyncContent.module.css";

export function MobileOfflineSyncContent({ canManageSettings }: { canManageSettings: boolean }) {
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
  const overallSynced = online && queue.length === 0;

  // ── Offline Mode toggle (real Settings.extra.offlineModeEnabled) ─────
  const [offlineMode, setOfflineMode] = useState<boolean | null>(null);
  const [savingToggle, setSavingToggle] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => (r.ok ? r.json() : null)).then((s) => {
      const extra = (s?.extra as Record<string, unknown>) ?? {};
      setOfflineMode(extra.offlineModeEnabled !== false);
    }).catch(() => setOfflineMode(true));
  }, []);

  async function toggleOfflineMode() {
    if (!canManageSettings || offlineMode === null || savingToggle) return;
    const next = !offlineMode;
    setSavingToggle(true);
    try {
      const sRes = await fetch("/api/settings");
      const current = sRes.ok ? await sRes.json() : null;
      const extra = (current?.extra as Record<string, unknown>) ?? {};
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extra: { ...extra, offlineModeEnabled: next } }),
      });
      if (res.ok) {
        setOfflineMode(next);
        showToast(next ? "Offline mode enabled." : "Offline mode disabled.");
      } else {
        showToast("Failed to update setting.", "error");
      }
    } finally {
      setSavingToggle(false);
    }
  }

  return (
    <div className={styles.root}>
      <section className={`${styles.hero} ${overallSynced ? styles.heroSynced : online ? styles.heroPending : styles.heroOffline}`}>
        <div className={styles.heroTop}>
          <div className={styles.heroIconWrap}>
            {online ? <Wifi size={20} /> : <WifiOff size={20} />}
          </div>
          <div>
            <p className={styles.heroLabel}>Overall Status</p>
            <h2 className={styles.heroTitle}>{online ? (queue.length === 0 ? "Synced" : "Pending") : "Offline"}</h2>
          </div>
        </div>
        <div className={styles.heroStatsRow}>
          <div>
            <p className={styles.heroStatLabel}>Queue Items</p>
            <p className={styles.heroStatValue}>{pendingCount}</p>
          </div>
          <div>
            <p className={styles.heroStatLabel}>Failed Syncs</p>
            <p className={styles.heroStatValue}>{failedCount}</p>
          </div>
        </div>
      </section>

      <section className={styles.toggleCard}>
        <div className={styles.toggleText}>
          <h3 className={styles.toggleTitle}>Offline Mode</h3>
          <p className={styles.toggleSub}>
            {canManageSettings ? "Allow local data caching school-wide" : "Super Admin / Principal only"}
          </p>
        </div>
        {offlineMode === null ? (
          <span className={styles.toggleLoading}>…</span>
        ) : canManageSettings ? (
          <button
            type="button"
            className={`${styles.switch} ${offlineMode ? styles.switchOn : ""}`}
            onClick={toggleOfflineMode}
            disabled={savingToggle}
            aria-pressed={offlineMode}
          >
            <span className={styles.switchThumb} />
          </button>
        ) : (
          <div className={styles.lockedSwitch}><Lock size={13} /></div>
        )}
      </section>

      <section>
        <h3 className={styles.sectionTitle}>Pending Synchronizations</h3>
        <div className={styles.list}>
          {loading && <div className={styles.emptyState}>Loading queue…</div>}
          {!loading && queue.length === 0 && (
            <div className={styles.emptyState}>
              <CheckCircle2 size={26} style={{ opacity: 0.35 }} />
              <p>No pending sync operations.</p>
            </div>
          )}
          {queue.map((job) => {
            const failed = (job.attempts ?? 0) > 0;
            return (
              <div key={job.id} className={`${styles.item} ${failed ? styles.itemFailed : ""}`}>
                <div className={styles.itemIconWrap}>
                  {failed ? <AlertCircle size={18} className={styles.itemIconError} /> : <Upload size={18} />}
                </div>
                <div className={styles.itemBody}>
                  <p className={styles.itemTitle}>{moduleLabel(job.url)}</p>
                  <p className={styles.itemSub}>{job.method} · {fmtCreated(job.createdAt)}</p>
                </div>
                {failed ? (
                  <span className={styles.statusFailed} title={job.lastError}>Failed ({job.attempts})</span>
                ) : (
                  <span className={styles.statusPending}>Pending</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <button type="button" className={styles.syncBtn} onClick={handleSync} disabled={syncing || queue.length === 0}>
        <RefreshCw size={16} className={syncing ? styles.spinning : undefined} />
        {syncing ? "Synchronizing…" : "Sync Now"}
      </button>
      <p className={styles.syncHint}>
        {queue.length === 0 ? "Nothing queued for background synchronization." : `${queue.length} item${queue.length === 1 ? "" : "s"} queued for background synchronization`}
      </p>
    </div>
  );
}
