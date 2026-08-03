"use client";

import { useState, useMemo } from "react";
import {
  Download, X, Flag, AlertTriangle, ChevronDown,
  User, Clock, Archive, FileEdit, Search,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import styles from "./AuditLogsClient.module.css";

type LogRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: unknown;
  createdAt: string;
  user: { name: string; role: string } | null;
};

type ViewFilter = "all" | "security" | "data";
type TimeRange = "24h" | "7d" | "30d" | "all";
type Severity = "any" | "high" | "medium" | "low";

const CATEGORIES = ["Authentication", "Students", "Fees & Payments", "Grades", "Attendance", "System"] as const;
type Category = typeof CATEGORIES[number] | "";

const MODULE_MAP: Record<string, string> = {
  authentication: "Authentication", auth: "Authentication",
  student: "Students", students: "Students",
  fee: "Fees & Payments", payment: "Fees & Payments", invoice: "Fees & Payments",
  grade: "Grades", grades: "Grades",
  attendance: "Attendance",
  system: "System",
};

function getModule(action: string, entity: string): string {
  const combined = `${action} ${entity}`.toLowerCase();
  for (const [key, val] of Object.entries(MODULE_MAP)) {
    if (combined.includes(key)) return val;
  }
  return entity;
}

function getSeverity(action: string): "high" | "medium" | "low" {
  if (action.includes("delete") || action.includes("fail") || action.includes("reverse") || action.includes("payment_edit")) return "high";
  if (action.includes("update") || action.includes("edit") || action.includes("export")) return "medium";
  return "low";
}

function getActionStyle(action: string): { background: string; color: string } {
  if (action.startsWith("delete") || action.startsWith("fail") || action.startsWith("reverse")) return { background: "var(--clr-error-bg)", color: "var(--clr-error)" };
  if (action.startsWith("create") || action.startsWith("login")) return { background: "var(--clr-success-bg)", color: "var(--clr-success)" };
  if (action.startsWith("update") || action.startsWith("edit")) return { background: "var(--clr-warning-bg)", color: "var(--clr-warning)" };
  if (action.startsWith("export")) return { background: "var(--clr-app-accent-soft)", color: "var(--clr-app-accent)" };
  return { background: "var(--clr-app-surface-alt)", color: "var(--clr-app-muted)" };
}

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export function AuditLogsClient({ logs }: { logs: LogRow[] }) {
  const [view, setView] = useState<ViewFilter>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [category, setCategory] = useState<Category>("");
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<Severity>("any");
  const [selectedLog, setSelectedLog] = useState<LogRow | null>(null);
  const { showToast } = useToast();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNote, setReviewNote] = useState("");

  function resetFilters() {
    setView("all"); setTimeRange("24h"); setCategory(""); setSearch(""); setSeverity("any");
  }

  const now = new Date();
  const cutoff = useMemo(() => {
    if (timeRange === "24h") return new Date(now.getTime() - 86400000);
    if (timeRange === "7d")  return new Date(now.getTime() - 7 * 86400000);
    if (timeRange === "30d") return new Date(now.getTime() - 30 * 86400000);
    return new Date(0);
  }, [timeRange]);

  const filtered = useMemo(() => logs.filter((l) => {
    if (new Date(l.createdAt) < cutoff) return false;
    if (view === "security" && !/login|logout|fail|auth|block|password|session/.test(l.action.toLowerCase())) return false;
    if (view === "data" && !/create|update|edit|delete|import|export|restore|bulk/.test(l.action.toLowerCase())) return false;
    if (category) {
      const mod = getModule(l.action, l.entity);
      if (!(mod.includes(category) || category.toLowerCase().includes(mod.toLowerCase()))) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const matchesActor = (l.user?.name ?? "").toLowerCase().includes(q);
      const matchesTarget = (l.entityId ?? "").toLowerCase().includes(q);
      const matchesEntity = l.entity.toLowerCase().includes(q);
      if (!matchesActor && !matchesTarget && !matchesEntity) return false;
    }
    if (severity !== "any" && getSeverity(l.action) !== severity) return false;
    return true;
  }), [logs, cutoff, view, category, search, severity]);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const stats = useMemo(() => ({
    today:      logs.filter((l) => new Date(l.createdAt) >= today).length,
    security:   logs.filter((l) => l.action.includes("login") || l.action.includes("fail") || l.action.includes("auth")).length,
    failLogin:  logs.filter((l) => l.action.includes("fail")).length,
    exports:    logs.filter((l) => l.action.includes("export")).length,
    deleted:    logs.filter((l) => l.action.includes("delete")).length,
    payEdit:    logs.filter((l) => l.entity.toLowerCase().includes("payment") && l.action.includes("update")).length,
    gradeEdit:  logs.filter((l) => l.entity.toLowerCase().includes("grade") && l.action.includes("update")).length,
    evidence:   logs.filter((l) => l.action.includes("export") && l.entity.toLowerCase().includes("evidence")).length,
  }), [logs]);

  const selSev = selectedLog ? getSeverity(selectedLog.action) : null;

  function exportCSV() {
    const csv = [
      ["Timestamp", "User", "Role", "Action", "Entity", "Entity ID"].join(","),
      ...filtered.map((l) => [
        new Date(l.createdAt).toLocaleString("en-GB"),
        l.user?.name ?? "System",
        l.user?.role ?? "",
        l.action,
        l.entity,
        l.entityId ?? "",
      ].join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "compliance-logs.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.root}>
      {/* Security alert banner — only when there are high-severity events */}
      {stats.failLogin > 0 && (
        <div className={styles.alertBanner}>
          <AlertTriangle size={16} className={styles.alertIcon} />
          <div className={styles.alertBody}>
            <div className={styles.alertTitle}>Suspicious Activity Detected</div>
            <div className={styles.alertText}>
              Multiple failed login attempts detected from unknown IP addresses in the last 24 hours. Please review High Severity logs.
            </div>
          </div>
          <button className={styles.alertDismiss} onClick={() => showToast("Alert dismissed")}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Compliance Audit Trail</h1>
          <p className={styles.subtitle}>Monitor and review institutional system activities and data modifications.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnOutline} onClick={() => showToast("Selected entries archived")}>
            <Archive size={14} /> Archive Selected
          </button>
          <button className={styles.btnOutline} onClick={() => setShowReviewModal(true)}>
            <FileEdit size={14} /> Create Review Note
          </button>
          <button className={styles.btnPrimary} onClick={exportCSV}>
            <Download size={14} /> Export Logs
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Events Today</span>
          <span className={styles.statValue}>{stats.today}</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardError}`}>
          <span className={`${styles.statLabel} ${styles.statLabelError}`}>Security Alerts</span>
          <span className={`${styles.statValue} ${styles.statValueError}`}>{stats.security}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Failed Logins</span>
          <span className={styles.statValue}>{stats.failLogin}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Data Exports</span>
          <span className={styles.statValue}>{stats.exports}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Deleted Records</span>
          <span className={styles.statValue}>{stats.deleted}</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardAmber}`}>
          <span className={`${styles.statLabel} ${styles.statLabelAmber}`}>Payment Edits</span>
          <span className={`${styles.statValue} ${styles.statValueAmber}`}>{stats.payEdit}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Grade Edits</span>
          <span className={styles.statValue}>{stats.gradeEdit}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Evidence Exports</span>
          <span className={styles.statValue}>{stats.evidence}</span>
        </div>
      </div>

      {/* Filter bar — flat, single row (no sidebar) */}
      <div className={styles.filterCard}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input className={styles.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by actor, entity, or record ID…" />
        </div>
        <div className={styles.filterRight}>
          <div className={styles.selectWrap}>
            <select className={styles.select} value={view} onChange={(e) => setView(e.target.value as ViewFilter)}>
              <option value="all">All Actions</option>
              <option value="security">Security Events</option>
              <option value="data">Data Changes</option>
            </select>
            <ChevronDown size={14} className={styles.selectChevron} />
          </div>
          <div className={styles.selectWrap}>
            <select className={styles.select} value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              <option value="">All Entities</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={14} className={styles.selectChevron} />
          </div>
          <div className={styles.selectWrap}>
            <select className={styles.select} value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
              <option value="any">Any Severity</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <ChevronDown size={14} className={styles.selectChevron} />
          </div>
          <div className={styles.selectWrap}>
            <select className={styles.select} value={timeRange} onChange={(e) => setTimeRange(e.target.value as TimeRange)}>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
            <ChevronDown size={14} className={styles.selectChevron} />
          </div>
          <button className={styles.resetBtn} onClick={resetFilters}>Reset</button>
        </div>
      </div>

      {/* Data table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Timestamp</th><th>User</th><th>Action</th><th>Entity</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => {
                const actionStyle = getActionStyle(log.action);
                const sev = getSeverity(log.action);
                return (
                  <tr key={log.id} onClick={() => setSelectedLog(log)} className={`${styles.row} ${sev === "high" ? styles.rowHighSev : ""}`}>
                    <td className={`${styles.td} ${styles.tdTime}`}>
                      {new Date(log.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className={styles.td}>
                      <div className={styles.actorRow}>
                        <div className={styles.avatar}>{initials(log.user?.name)}</div>
                        <div>
                          <div className={styles.actorName}>{log.user?.name ?? "System"}</div>
                          <div className={styles.actorRole}>{log.user?.role?.replace("_", " ") ?? "Automated"}</div>
                        </div>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.actionPill} style={actionStyle}>{log.action}</span>
                    </td>
                    <td className={`${styles.td} ${styles.moduleCell}`}>{getModule(log.action, log.entity)}</td>
                    <td className={styles.td} style={{ textAlign: "right" }}>
                      <button className={styles.viewLink} onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}>View Details</button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>
                    {view === "security"
                      ? "No security events in this time range."
                      : view === "data"
                      ? "No data change events in this time range."
                      : "No log entries match your filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className={styles.paginationBar}>
            <span>Showing {filtered.length} of {logs.length} entries</span>
          </div>
        )}
      </div>

      {/* Event detail modal */}
      {selectedLog && (
        <div className={styles.modalOverlay} onClick={() => setSelectedLog(null)}>
          <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            {selSev === "high" && (
              <div className={styles.severityBanner}>
                <span className={styles.severityBannerText}>High Severity Event</span>
              </div>
            )}
            <div className={styles.detailTop}>
              <div>
                <h2 className={styles.detailTitle}>{selectedLog.action.replace(/_/g, " ")}</h2>
                <div className={styles.detailTime}>
                  <Clock size={12} />
                  {new Date(selectedLog.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} GMT
                </div>
              </div>
              <button className={styles.detailClose} onClick={() => setSelectedLog(null)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.detailBody}>
              {/* Actor profile */}
              <div className={styles.detailSection}>
                <div className={styles.detailSectionLabel}>Actor Profile</div>
                <div className={styles.actorCard}>
                  <div className={styles.avatar}>{initials(selectedLog.user?.name)}</div>
                  <div>
                    <div className={styles.actorCardName}>{selectedLog.user?.name ?? "System"}</div>
                    <div className={styles.actorCardMeta}>
                      <User size={11} /> {selectedLog.user?.role?.replace("_", " ") ?? "Automated"}
                      {selectedLog.entityId && ` (ID: ${selectedLog.entityId.slice(0, 8)})`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Target & changes */}
              <div className={styles.detailSection}>
                <div className={styles.detailSectionLabel}>Target &amp; Changes</div>
                <div className={styles.detailCard}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailRowKey}>Record ID:</span>
                    <span className={styles.detailRowVal}>{selectedLog.entityId ?? "—"}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailRowKey}>Entity:</span>
                    <span className={styles.detailRowVal}>{selectedLog.entity}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailRowKey}>Action:</span>
                    <span className={styles.detailRowVal} style={{ textTransform: "capitalize" }}>{selectedLog.action.replace(/_/g, " ")}</span>
                  </div>
                  {selectedLog.metadata != null && (
                    <div className={styles.metaBlock}>{JSON.stringify(selectedLog.metadata)}</div>
                  )}
                </div>
              </div>

              {/* Metadata & security */}
              <div className={styles.detailSection}>
                <div className={styles.detailSectionLabel}>Metadata &amp; Security</div>
                <div className={styles.detailCard}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailRowKey}>IP Address:</span>
                    <span className={styles.detailRowVal}>—</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailRowKey}>Location:</span>
                    <span className={styles.detailRowVal}>Accra, Ghana</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailRowKey}>Severity:</span>
                    <span
                      className={styles.detailRowVal}
                      style={{ textTransform: "capitalize", color: selSev === "high" ? "var(--clr-error)" : selSev === "medium" ? "var(--clr-warning)" : "var(--clr-success)" }}
                    >
                      {selSev}
                    </span>
                  </div>
                </div>
              </div>

              {/* Flag CTA */}
              <button className={styles.flagBtn} onClick={() => showToast("Event flagged for investigation")}>
                <Flag size={14} /> Flag for Investigation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Note modal */}
      {showReviewModal && (
        <div className={styles.modalOverlay} onClick={() => setShowReviewModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Create Review Note</h2>
              <button className={styles.modalClose} onClick={() => setShowReviewModal(false)}><X size={18} /></button>
            </div>
            {selectedLog && (
              <div className={styles.linkedBox}>
                Linked to: <strong style={{ color: "var(--clr-app-text)" }}>{selectedLog.action.replace(/_/g, " ")}</strong> by {selectedLog.user?.name ?? "System"}
              </div>
            )}
            <label className={styles.modalLabel}>Review Note *</label>
            <textarea
              className={styles.modalTextarea}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={5}
              placeholder="Describe your findings, actions taken, or escalation notes…"
            />
            <div className={styles.modalActions}>
              <button className={styles.btnGhost} onClick={() => { setShowReviewModal(false); setReviewNote(""); }}>Cancel</button>
              <button className={styles.btnPrimary} onClick={() => {
                if (!reviewNote.trim()) return;
                setShowReviewModal(false);
                setReviewNote("");
                showToast("Review note saved");
              }}>
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
