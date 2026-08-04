"use client";

/**
 * MobileSystemHealthContent — bespoke mobile view for System Health.
 *
 * Every field traces back to SystemHealthContent.tsx / SystemHealthScreen.tsx
 * (real Prisma counts, a genuine filesystem write probe, real JWT-secret
 * check, real self-measured latency) — same `metrics`/`logs` props, same
 * getServices() list.
 *
 * Deviations from the Stitch mockup (system_health_indigo_refined):
 *   - "Uptime: 99.8%" and "Active Alerts: 3" have no real backing (no uptime
 *     tracker or alerting system exists) — replaced with real Healthy/Issues
 *     service counts.
 *   - Per-service fake percentages ("Server Load: 85%", "Database Disk: 42%",
 *     "Cloud Storage Space: 12%") don't correspond to anything measured —
 *     replaced with each service's real latency (ms) where measured, or its
 *     real status description where it isn't (e.g. Email Notifications has
 *     no latency, only a real "not configured" state).
 *   - The 6 services shown are the real getServices() list (Database,
 *     Authentication, Storage/Uploads, Email Notifications, Background Sync,
 *     API Gateway) — not the mockup's fictional "Server"/"Cloud Storage"
 *     split, which don't map to anything this app actually monitors.
 *   - "Recent Incidents" (named incidents like "API Latency Spike") are
 *     fabricated — replaced with the real Recent Activity audit log (same
 *     entries as desktop's table).
 *   - Refresh replicates desktop's real handleRefresh(): a brief spin, then
 *     a full reload, which re-fetches all metrics because this route is
 *     force-dynamic.
 */

import { useEffect, useState } from "react";
import { RefreshCw, FileText } from "lucide-react";
import { countSyncQueue } from "@/lib/offline/syncQueue";
import {
  getServices, STATUS_ICON, STATUS_LABEL, actionIsError, initials, fmtTime,
} from "@/screens/desktop/SystemHealthScreen/SystemHealthContent";
import type { SystemHealthContentProps, SvcStatus } from "@/screens/desktop/SystemHealthScreen/SystemHealthContent";
import styles from "./MobileSystemHealthContent.module.css";

export function MobileSystemHealthContent({ metrics, logs }: SystemHealthContentProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [syncQueueDepth, setSyncQueueDepth] = useState<number | null>(null);

  useEffect(() => {
    countSyncQueue().then(setSyncQueueDepth).catch(() => setSyncQueueDepth(0));
  }, []);

  const services = getServices(metrics, syncQueueDepth);
  const healthyCount = services.filter((s) => s.status === "healthy").length;
  const issueCount = services.length - healthyCount;
  const downCount = services.filter((s) => s.status === "down").length;
  const degradedCount = services.filter((s) => s.status === "degraded" || s.status === "not_configured").length;
  const overallStatus: SvcStatus = downCount > 0 ? "down" : degradedCount > 0 ? "degraded" : "healthy";

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); window.location.reload(); }, 800);
  }

  return (
    <div className={styles.root}>
      <div className={styles.actionRow}>
        <button type="button" className={`${styles.refreshBtn} ${refreshing ? styles.refreshing : ""}`} onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? styles.spinning : undefined} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <section className={`${styles.hero} ${styles[`hero_${overallStatus}`]}`}>
        <div className={styles.heroTop}>
          <span className={`${styles.heroDot} ${overallStatus === "healthy" ? styles.heroDotPulse : ""}`} />
          <h2 className={styles.heroTitle}>
            {overallStatus === "healthy" ? "All Systems Operational" : overallStatus === "degraded" ? "Partial Degradation" : "Incident Active"}
          </h2>
        </div>
        <div className={styles.heroStatsRow}>
          <div>
            <p className={styles.heroStatLabel}>Healthy</p>
            <p className={styles.heroStatValue}>{healthyCount}/{services.length}</p>
          </div>
          <div>
            <p className={styles.heroStatLabel}>Issues</p>
            <p className={styles.heroStatValue}>{issueCount}</p>
          </div>
        </div>
        <div className={styles.heroFooter}>Last check: {fmtTime(metrics.checkedAt)}</div>
      </section>

      <section>
        <h3 className={styles.sectionTitle}>Infrastructure Health</h3>
        <div className={styles.serviceList}>
          {services.map((svc) => {
            const Icon = svc.Icon;
            const StatusIcon = STATUS_ICON[svc.status];
            const warn = svc.status === "degraded" || svc.status === "not_configured";
            const down = svc.status === "down";
            return (
              <div key={svc.name} className={`${styles.serviceCard} ${warn ? styles.serviceCardWarn : ""} ${down ? styles.serviceCardDown : ""}`}>
                <div className={styles.serviceLeft}>
                  <div className={`${styles.serviceIconWrap} ${warn ? styles.serviceIconWrapWarn : ""} ${down ? styles.serviceIconWrapDown : ""}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className={styles.serviceName}>{svc.name}</p>
                    <div className={styles.serviceStatusRow}>
                      <StatusIcon size={12} className={warn ? styles.statusIconWarn : down ? styles.statusIconDown : styles.statusIconOk} />
                      <span className={warn ? styles.statusTextWarn : down ? styles.statusTextDown : styles.statusTextOk}>{STATUS_LABEL[svc.status]}</span>
                    </div>
                  </div>
                </div>
                <div className={styles.serviceRight}>
                  {svc.latencyMs !== null ? (
                    <span className={styles.serviceMetric}>{svc.latencyMs}ms</span>
                  ) : (
                    <span className={styles.serviceDesc}>{svc.description}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className={styles.sectionTitle}>Recent Activity</h3>
        {logs.length === 0 ? (
          <div className={styles.emptyState}>
            <FileText size={28} style={{ opacity: 0.3 }} />
            <p>No recent audit events.</p>
          </div>
        ) : (
          <div className={styles.activityList}>
            {logs.map((log) => (
              <div key={log.id} className={styles.activityRow}>
                <div className={styles.activityAvatar}>{initials(log.userName)}</div>
                <div className={styles.activityBody}>
                  <div className={styles.activityTop}>
                    <span className={styles.activityUser}>{log.userName}</span>
                    <span className={styles.activityTime}>{fmtTime(log.createdAt)}</span>
                  </div>
                  <div className={styles.activityBottom}>
                    <span className={`${styles.actionPill} ${actionIsError(log.action) ? styles.actionPillError : ""}`}>{log.action}</span>
                    <span className={styles.activityEntity}>{log.entity}{log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
