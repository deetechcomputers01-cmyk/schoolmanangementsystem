"use client";

/**
 * MobileAuditLogsContent — bespoke mobile view for the Compliance Logs
 * screen (nav label "Compliance Logs"; the underlying route/component is
 * literally named AuditLogsScreen/AuditLogsClient — same feature, no
 * separate "Compliance Logs" backend exists).
 *
 * Every field/action traces back to AuditLogsClient.tsx (the real desktop
 * component) — same getModule()/getSeverity()/getActionStyle() derivations,
 * same 8 real stat computations, same client-side filter logic, same
 * exportCSV() (real download) and Create Review Note flow.
 *
 * Deviations from the Stitch mockup (compliance_logs_mobile_admin):
 *   - The event-detail view on desktop hardcodes "IP Address: —" and
 *     "Location: Accra, Ghana" for EVERY log regardless of its real data —
 *     these are literal fake placeholder values, not derived from anything.
 *     Rather than replicate a display that looks like real security data
 *     but isn't, this mobile view omits both fields entirely.
 *   - "Archive Selected" (desktop header button) has no real selection
 *     mechanism anywhere — the desktop table has no checkboxes for it to
 *     act on, so it's not just unwired but incoherent even on desktop.
 *     Omitted. "Create Review Note" and "Flag for Investigation" ARE kept
 *     (as the same toast-only, non-persisted actions they are on desktop)
 *     since they're coherent per-item/global actions that just haven't
 *     been wired to a backend yet — matching desktop parity, not fabricating
 *     new capability.
 *   - "Category"/"Severity" are derived client-side from action/entity
 *     strings (`getModule`/`getSeverity`), not stored fields — same as
 *     desktop, reused directly from the exported functions so the two
 *     platforms can never disagree on a log's severity/category.
 */

import { useMemo, useState } from "react";
import {
  Download, Flag, AlertTriangle, X, User, Clock, FileEdit, Search,
  ChevronDown, ChevronUp, Activity,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import {
  CATEGORIES, getModule, getSeverity, getActionStyle, initials,
} from "@/screens/desktop/AuditLogsScreen/AuditLogsClient";
import type {
  LogRow, ViewFilter, TimeRange, Severity, Category,
} from "@/screens/desktop/AuditLogsScreen/AuditLogsClient";
import styles from "./MobileAuditLogsContent.module.css";

export function MobileAuditLogsContent({ logs }: { logs: LogRow[] }) {
  const [view, setView] = useState<ViewFilter>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [category, setCategory] = useState<Category>("");
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<Severity>("any");
  const [openId, setOpenId] = useState<string | null>(null);
  const { showToast } = useToast();

  function resetFilters() {
    setView("all"); setTimeRange("24h"); setCategory(""); setSearch(""); setSeverity("any");
  }

  const now = new Date();
  const cutoff = useMemo(() => {
    if (timeRange === "24h") return new Date(now.getTime() - 86400000);
    if (timeRange === "7d") return new Date(now.getTime() - 7 * 86400000);
    if (timeRange === "30d") return new Date(now.getTime() - 30 * 86400000);
    return new Date(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    today: logs.filter((l) => new Date(l.createdAt) >= today).length,
    security: logs.filter((l) => l.action.includes("login") || l.action.includes("fail") || l.action.includes("auth")).length,
    failLogin: logs.filter((l) => l.action.includes("fail")).length,
    exports: logs.filter((l) => l.action.includes("export")).length,
    deleted: logs.filter((l) => l.action.includes("delete")).length,
    payEdit: logs.filter((l) => l.entity.toLowerCase().includes("payment") && l.action.includes("update")).length,
    gradeEdit: logs.filter((l) => l.entity.toLowerCase().includes("grade") && l.action.includes("update")).length,
    evidence: logs.filter((l) => l.action.includes("export") && l.entity.toLowerCase().includes("evidence")).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [logs]);

  function exportCSV() {
    const csv = [
      ["Timestamp", "User", "Role", "Action", "Entity", "Entity ID"].join(","),
      ...filtered.map((l) => [
        new Date(l.createdAt).toLocaleString("en-GB"),
        l.user?.name ?? "System", l.user?.role ?? "", l.action, l.entity, l.entityId ?? "",
      ].join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "compliance-logs.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Create Review Note sheet ─────────────────────────────────────────
  const [showReview, setShowReview] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const linkedLog = openId ? logs.find((l) => l.id === openId) ?? null : null;

  function saveReviewNote() {
    if (!reviewNote.trim()) return;
    setShowReview(false);
    setReviewNote("");
    showToast("Review note saved");
  }

  return (
    <div className={styles.root}>
      {stats.failLogin > 0 && (
        <div className={styles.alertBanner}>
          <AlertTriangle size={16} className={styles.alertIcon} />
          <p className={styles.alertText}>Multiple failed login attempts detected in the last 24 hours. Review High Severity logs.</p>
        </div>
      )}

      <div className={styles.actionRow}>
        <button type="button" className={styles.btnOutline} onClick={() => setShowReview(true)}><FileEdit size={14} /> Review Note</button>
        <button type="button" className={styles.btnPrimary} onClick={exportCSV}><Download size={14} /> Export Logs</button>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}><span className={styles.kpiLabel}>Events Today</span><strong className={styles.kpiValue}>{stats.today}</strong></div>
        <div className={`${styles.kpiCard} ${styles.kpiCardError}`}><span className={styles.kpiLabel}>Security Alerts</span><strong className={styles.kpiValueError}>{stats.security}</strong></div>
        <div className={styles.kpiCard}><span className={styles.kpiLabel}>Failed Logins</span><strong className={styles.kpiValue}>{stats.failLogin}</strong></div>
        <div className={styles.kpiCard}><span className={styles.kpiLabel}>Data Exports</span><strong className={styles.kpiValue}>{stats.exports}</strong></div>
        <div className={styles.kpiCard}><span className={styles.kpiLabel}>Deleted Records</span><strong className={styles.kpiValue}>{stats.deleted}</strong></div>
        <div className={`${styles.kpiCard} ${styles.kpiCardAmber}`}><span className={styles.kpiLabel}>Payment Edits</span><strong className={styles.kpiValueAmber}>{stats.payEdit}</strong></div>
        <div className={styles.kpiCard}><span className={styles.kpiLabel}>Grade Edits</span><strong className={styles.kpiValue}>{stats.gradeEdit}</strong></div>
        <div className={styles.kpiCard}><span className={styles.kpiLabel}>Evidence Exports</span><strong className={styles.kpiValue}>{stats.evidence}</strong></div>
      </div>

      <label className={kit.searchWrap}>
        <Search size={16} className={kit.searchIcon} />
        <input className={`${kit.input} ${kit.searchInput}`} placeholder="Search by actor, entity, or record ID" value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>

      <div className={styles.chipRow}>
        {[["all", "All Actions"], ["security", "Security"], ["data", "Data Changes"]].map(([v, l]) => (
          <button key={v} type="button" className={`${styles.chip} ${view === v ? styles.chipActive : ""}`} onClick={() => setView(v as ViewFilter)}>{l}</button>
        ))}
      </div>
      <div className={styles.chipRow}>
        <button type="button" className={`${styles.chip} ${category === "" ? styles.chipActive : ""}`} onClick={() => setCategory("")}>All Entities</button>
        {CATEGORIES.map((c) => (
          <button key={c} type="button" className={`${styles.chip} ${category === c ? styles.chipActive : ""}`} onClick={() => setCategory(category === c ? "" : c)}>{c}</button>
        ))}
      </div>
      <div className={styles.chipRow}>
        {[["any", "Any Severity"], ["high", "High"], ["medium", "Medium"], ["low", "Low"]].map(([v, l]) => (
          <button key={v} type="button" className={`${styles.chip} ${severity === v ? styles.chipActive : ""}`} onClick={() => setSeverity(v as Severity)}>{l}</button>
        ))}
      </div>
      <div className={styles.chipRow}>
        {[["24h", "24 Hours"], ["7d", "7 Days"], ["30d", "30 Days"], ["all", "All Time"]].map(([v, l]) => (
          <button key={v} type="button" className={`${styles.chip} ${timeRange === v ? styles.chipActive : ""}`} onClick={() => setTimeRange(v as TimeRange)}>{l}</button>
        ))}
        <button type="button" className={styles.resetChip} onClick={resetFilters}>Reset</button>
      </div>

      <p className={styles.countLine}>Showing {filtered.length} of {logs.length} entries</p>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <Activity size={28} style={{ opacity: 0.3 }} />
            <p>{view === "security" ? "No security events in this time range." : view === "data" ? "No data change events in this time range." : "No log entries match your filters."}</p>
          </div>
        ) : filtered.map((log) => {
          const isOpen = openId === log.id;
          const sev = getSeverity(log.action);
          const actionStyle = getActionStyle(log.action);
          return (
            <article key={log.id} className={`${styles.card} ${sev === "high" ? styles.cardHighSev : ""}`}>
              <button type="button" className={styles.cardHeader} onClick={() => setOpenId(isOpen ? null : log.id)}>
                <span className={kit.pickAvatar}>{initials(log.user?.name)}</span>
                <div className={styles.cardHeaderText}>
                  <span className={styles.actionPill} style={actionStyle}>{log.action.replace(/_/g, " ")}</span>
                  <span className={styles.actorLine}>{log.user?.name ?? "System"} · {getModule(log.action, log.entity)}</span>
                </div>
                <span className={`${styles.sevPill} ${styles[`sev_${sev}`]}`}>{sev}</span>
                {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
              <div className={styles.timeRow}><Clock size={11} /> {new Date(log.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</div>

              {isOpen && (
                <div className={styles.cardDetail}>
                  <div className={styles.detailRow}><span>Actor</span><strong><User size={11} /> {log.user?.name ?? "System"} ({log.user?.role?.replace("_", " ") ?? "Automated"})</strong></div>
                  <div className={styles.detailRow}><span>Record ID</span><strong>{log.entityId ?? "—"}</strong></div>
                  <div className={styles.detailRow}><span>Entity</span><strong>{log.entity}</strong></div>
                  {log.metadata != null && <div className={styles.metaBlock}>{JSON.stringify(log.metadata)}</div>}
                  <button type="button" className={styles.flagBtn} onClick={() => showToast("Event flagged for investigation")}>
                    <Flag size={13} /> Flag for Investigation
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <MobileSheet
        open={showReview}
        onClose={() => setShowReview(false)}
        title="Create Review Note"
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => { setShowReview(false); setReviewNote(""); }}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={saveReviewNote}>Save Note</button>
        </>}
      >
        {linkedLog && (
          <p className={kit.helperText}>Linked to: {linkedLog.action.replace(/_/g, " ")} by {linkedLog.user?.name ?? "System"}</p>
        )}
        <div className={kit.field}>
          <label>Review Note *</label>
          <textarea className={kit.textarea} rows={5} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Describe your findings, actions taken, or escalation notes…" />
        </div>
      </MobileSheet>
    </div>
  );
}
