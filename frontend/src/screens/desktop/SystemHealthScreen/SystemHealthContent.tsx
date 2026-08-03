"use client";

import { useEffect, useState } from "react";
import {
  Database, Shield, Server, Mail, RefreshCw, Wifi,
  CheckCircle2, AlertTriangle, XCircle, Zap,
  FileText,
} from "lucide-react";
import { countSyncQueue } from "@/lib/offline/syncQueue";
import styles from "./SystemHealthScreen.module.css";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Metrics {
  dbLatencyMs: number;
  dbStatus: "healthy" | "degraded" | "down";
  storageWritable: boolean;
  storageLatencyMs: number;
  usingDevJwtSecret: boolean;
  loginAttempts24h: number;
  loginSuccess24h: number;
  apiGatewayLatencyMs: number;
  userCount: number;
  studentCount: number;
  staffCount: number;
  examCount: number;
  attendanceCount: number;
  auditCount24h: number;
  failedLogins24h: number;
  activeUsers1h: number;
  totalRecords: number;
  checkedAt: string;
}

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userName: string;
  userRole: string;
  createdAt: string;
}

interface Props {
  metrics: Metrics;
  logs: AuditEntry[];
}

// ── Constants ─────────────────────────────────────────────────────────────────
type SvcStatus = "healthy" | "degraded" | "down" | "not_configured";

interface Service {
  name: string;
  description: string;
  status: SvcStatus;
  latencyMs: number | null;
  Icon: typeof Database;
}

function getServices(m: Metrics, syncQueueDepth: number | null): Service[] {
  return [
    { name: "Database", description: "Primary data store",
      status: m.dbStatus, latencyMs: m.dbLatencyMs, Icon: Database },
    { name: "Authentication", description: m.usingDevJwtSecret
        ? "Using default dev JWT secret"
        : `${m.loginSuccess24h}/${m.loginAttempts24h || 0} logins succeeded (24h)`,
      status: m.usingDevJwtSecret ? "degraded" : "healthy", latencyMs: null, Icon: Shield },
    { name: "Storage / Uploads", description: m.storageWritable ? "Uploads directory is writable" : "Uploads directory is NOT writable",
      status: m.storageWritable ? "healthy" : "down", latencyMs: m.storageLatencyMs, Icon: Server },
    { name: "Email Notifications", description: "No SMTP integration configured",
      status: "not_configured", latencyMs: null, Icon: Mail },
    { name: "Background Sync", description: syncQueueDepth === null ? "Checking device queue…" : `${syncQueueDepth} item(s) queued on this device`,
      status: syncQueueDepth === null ? "healthy" : syncQueueDepth === 0 ? "healthy" : syncQueueDepth < 10 ? "degraded" : "down",
      latencyMs: null, Icon: Wifi },
    { name: "API Gateway", description: "This request's own measured latency",
      status: "healthy", latencyMs: m.apiGatewayLatencyMs, Icon: Zap },
  ];
}

const STATUS_ICON: Record<SvcStatus, typeof CheckCircle2> = {
  healthy: CheckCircle2, degraded: AlertTriangle, down: XCircle, not_configured: AlertTriangle,
};
const STATUS_LABEL: Record<SvcStatus, string> = {
  healthy: "Healthy", degraded: "Degraded", down: "Down", not_configured: "Not Connected",
};
const STATUS_DOT: Record<SvcStatus, string> = {
  healthy: "dotHealthy", degraded: "dotDegraded", down: "dotDown", not_configured: "dotDegraded",
};

function actionIsError(action: string) {
  return /delete|fail|reverse/.test(action.toLowerCase());
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function SystemHealthContent({ metrics, logs }: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const [syncQueueDepth, setSyncQueueDepth] = useState<number | null>(null);

  useEffect(() => {
    countSyncQueue().then(setSyncQueueDepth).catch(() => setSyncQueueDepth(0));
  }, []);

  const services = getServices(metrics, syncQueueDepth);
  const healthyCount  = services.filter((s) => s.status === "healthy").length;
  const degradedCount = services.filter((s) => s.status === "degraded" || s.status === "not_configured").length;
  const downCount     = services.filter((s) => s.status === "down").length;

  const overallStatus: SvcStatus =
    downCount > 0 ? "down" : degradedCount > 0 ? "degraded" : "healthy";

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); window.location.reload(); }, 800);
  }

  const loginSuccessRate = metrics.loginAttempts24h > 0 ? Math.round((metrics.loginSuccess24h / metrics.loginAttempts24h) * 1000) / 10 : 100;
  const loginFailRate = Math.round((100 - loginSuccessRate) * 10) / 10;

  const dataVolume = [
    { label: "Users",      count: metrics.userCount },
    { label: "Students",   count: metrics.studentCount },
    { label: "Staff",      count: metrics.staffCount },
    { label: "Exams",      count: metrics.examCount },
    { label: "Attendance", count: metrics.attendanceCount },
  ];

  return (
    <div className={styles.root}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.breadcrumb}>
            <span>Administration</span>
            <span className={styles.breadcrumbSep}>›</span>
            <span className={styles.breadcrumbActive}>System Health</span>
          </div>
          <h1 className={styles.title}>System Health</h1>
          <p className={styles.subtitle}>
            Live infrastructure status · Last checked {fmtTime(metrics.checkedAt)}
            <span className={`${styles.overallPill} ${styles[`overall_${overallStatus}`]}`}>
              {overallStatus === "healthy" ? "All systems operational" : overallStatus === "degraded" ? "Partial degradation" : "Incident active"}
            </span>
          </p>
        </div>
        <button className={`${styles.refreshBtn} ${refreshing ? styles.refreshing : ""}`} onClick={handleRefresh}>
          <RefreshCw size={16} className={refreshing ? styles.spinning : ""} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Service status cards */}
      <div>
        <p className={styles.sectionLabel}>Service Status</p>
        <div className={styles.serviceGrid}>
          {services.map((svc) => {
            const Icon = STATUS_ICON[svc.status];
            return (
              <div key={svc.name} className={`${styles.serviceCard} ${svc.status === "down" ? styles.serviceCardDown : svc.status === "degraded" || svc.status === "not_configured" ? styles.serviceCardDegraded : ""}`}>
                <div className={styles.serviceTop}>
                  <span className={`${styles.serviceLabel} ${svc.status === "down" ? styles.serviceLabelDown : ""}`}>{svc.name}</span>
                  <svc.Icon size={20} className={`${styles.serviceIcon} ${svc.status === "down" ? styles.serviceIconDown : ""}`} />
                </div>
                <div className={styles.serviceStatusRow}>
                  <span className={`${styles.serviceDot} ${styles[STATUS_DOT[svc.status]]}`} />
                  <span className={svc.status === "down" ? styles.serviceValueDown : styles.serviceValue}>{STATUS_LABEL[svc.status]}</span>
                </div>
                {svc.latencyMs !== null ? (
                  <span className={styles.serviceSub}>Latency: <span className={styles.serviceSubAccent}>{svc.latencyMs}ms</span></span>
                ) : (
                  <span className={styles.serviceSub}>{svc.description}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* User & volume stats */}
      <div>
        <p className={styles.sectionLabel}>Users &amp; Data Volume</p>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Active Users (1h)</span>
            <span className={styles.statValue}>{metrics.activeUsers1h}</span>
            <span className={styles.serviceSub}>{metrics.userCount} total users</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Login Attempts (24h)</span>
            <span className={styles.statValue}>{metrics.loginAttempts24h}</span>
            <div className={styles.statSubRow}>
              <span className={styles.statSubGood}>Success {loginSuccessRate}%</span>
              <span className={styles.statSubBad}>Failed {loginFailRate}%</span>
            </div>
          </div>
          <div className={`${styles.statCard} ${metrics.failedLogins24h > 5 ? styles.statCardError : ""}`}>
            <span className={styles.statLabel}>Failed Logins (24h)</span>
            <span className={`${styles.statValue} ${metrics.failedLogins24h > 5 ? styles.statValueError : ""}`}>{metrics.failedLogins24h}</span>
            <span className={styles.serviceSub}>{metrics.auditCount24h} audit events (24h)</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Data Volume</span>
            <span className={styles.statValue}>{metrics.totalRecords.toLocaleString()}</span>
            <div className={styles.tagList}>
              {dataVolume.map((d) => (
                <span key={d.label} className={styles.tag}>{d.label} {d.count.toLocaleString()}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity — single flat table, matching design */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Recent Activity</h2>
          <div className={styles.panelMeta}>
            <RefreshCw size={14} className={styles.spinIcon} />
            <span>Auto-refreshing view</span>
          </div>
        </div>
        {logs.length === 0 ? (
          <div className={styles.feedEmpty}>
            <FileText size={28} className={styles.feedEmptyIcon} />
            <p>No recent audit events.</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Timestamp</th>
                  <th className={styles.th}>User</th>
                  <th className={styles.th}>Action</th>
                  <th className={styles.th}>Entity</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className={styles.tr}>
                    <td className={`${styles.td} ${styles.tdMuted} ${styles.tdMono}`}>{fmtTime(log.createdAt)}</td>
                    <td className={styles.td}>
                      <div className={styles.actorCell}>
                        <div className={styles.avatar}>{initials(log.userName)}</div>
                        <div>
                          <div className={styles.actorName}>{log.userName}</div>
                          <div className={styles.actorRole}>{log.userRole.replace("_", " ")}</div>
                        </div>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <span className={`${styles.actionPill} ${actionIsError(log.action) ? styles.actionPillError : ""}`}>{log.action}</span>
                    </td>
                    <td className={`${styles.td} ${styles.tdMuted}`} style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>{log.entity}{log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className={styles.paginationBar}>
          <span className={styles.paginationLabel}>Showing <strong>{logs.length}</strong> most recent events</span>
        </div>
      </div>
    </div>
  );
}
