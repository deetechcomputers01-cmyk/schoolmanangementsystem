"use client";

import { useMemo, useState } from "react";
import {
  HardDrive, Plus, RefreshCw, Trash2, DownloadCloud, AlertTriangle,
  CheckCircle, Clock, X, ShieldCheck, Search, ChevronDown, ChevronLeft, ChevronRight,
  Download, Loader, RotateCcw, Server,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import styles from "./BackupRestoreScreen.module.css";

export type BackupStatus = "running" | "healthy" | "failed" | "pending" | "expired";
export type BackupType   = "full" | "incremental" | "differential" | "schema_only";
export type Target       = "local";

export interface BackupRecord {
  id: string;
  name: string;
  backupType: BackupType;
  sizeBytes: string | number;
  target: Target;
  status: BackupStatus;
  duration?: number | null;
  encryption: string;
  checksum?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  initiator: { id: string; name: string; role: string } | null;
}

export interface BackupStats {
  total: number;
  byStatus: { status: string; _count: { _all: number } }[];
  latest?: BackupRecord | null;
}

export interface BackupRestoreContentProps {
  initialBackups: BackupRecord[];
  initialStats:   BackupStats;
}
type Props = BackupRestoreContentProps;

export const STATUS_META: Record<BackupStatus, { label: string; badgeClass: string; icon: React.ReactNode }> = {
  running:  { label: "Running",  badgeClass: "badgeRunning", icon: <Loader  size={11} /> },
  healthy:  { label: "Healthy",  badgeClass: "badgeHealthy", icon: <CheckCircle size={11} /> },
  failed:   { label: "Failed",   badgeClass: "badgeFailed",  icon: <AlertTriangle size={11} /> },
  pending:  { label: "Pending",  badgeClass: "badgePending", icon: <Clock size={11} /> },
  expired:  { label: "Expired",  badgeClass: "badgeExpired", icon: <AlertTriangle size={11} /> },
};

export const TARGET_LABEL: Record<Target, { label: string; icon: React.ReactNode }> = {
  local: { label: "Local Disk", icon: <Server size={13} /> },
};

export const TYPE_LABEL: Record<BackupType, string> = {
  full:          "Full",
  incremental:   "Incremental",
  differential:  "Differential",
  schema_only:   "Schema Only",
};

export function bytesToNum(bytes: string | number): number {
  const n = typeof bytes === "string" ? parseInt(bytes, 10) : Number(bytes);
  return isNaN(n) ? 0 : n;
}

export function fmt(bytes: string | number): string {
  const n = bytesToNum(bytes);
  if (n === 0) return "—";
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

export function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function fmtRelative(d: string) {
  const diffMs = Date.now() - new Date(d).getTime();
  const h = Math.floor(diffMs / 3600000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function fmtDuration(sec?: number | null) {
  if (!sec) return "—";
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

export function StatusBadge({ s }: { s: BackupStatus }) {
  const m = STATUS_META[s];
  return (
    <span className={`${styles.badge} ${styles[m.badgeClass]}`}>
      {m.icon}{m.label}
    </span>
  );
}

const PAGE_SIZE = 8;

export function BackupRestoreScreen({ initialBackups, initialStats }: Props) {
  const [backups, setBackups]     = useState<BackupRecord[]>(initialBackups);
  const [stats, setStats]         = useState<BackupStats>(initialStats);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [delConfirm, setDelConfirm] = useState<string | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState<BackupRecord | null>(null);
  const [restoreTyped, setRestoreTyped] = useState("");
  const [restoring, setRestoring] = useState(false);
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [newName, setNewName]     = useState("");
  const [newType, setNewType]     = useState<BackupType>("full");

  const [search, setSearch]       = useState("");
  const [typeFilter, setTypeFilter] = useState<BackupType | "">("");
  const [statusFilter, setStatusFilter] = useState<BackupStatus | "">("");
  const [page, setPage] = useState(1);

  const selected = backups.find(b => b.id === selectedId);

  function showMsg(msg: string, type: "ok" | "error" = "ok") {
    showToast(msg, type === "error" ? "error" : "success");
  }

  async function refresh() {
    const [bRes, sRes] = await Promise.all([
      fetch("/api/backup"),
      fetch("/api/backup?stats=1"),
    ]);
    if (bRes.ok) setBackups(await bRes.json());
    if (sRes.ok) setStats(await sRes.json());
  }

  async function handleCreate() {
    if (!newName.trim()) return showMsg("Name is required.", "error");
    setLoading(true);
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, backupType: newType }),
      });
      if (res.ok) {
        const record = await res.json();
        setBackups(prev => [record, ...prev]);
        setSelectedId(record.id);
        setShowNew(false);
        setNewName("");
        showMsg(record.status === "healthy" ? "Backup completed." : "Backup failed — check server logs.", record.status === "healthy" ? "ok" : "error");
        refresh();
      } else {
        showMsg("Failed to start backup.", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/backup/${id}`, { method: "DELETE" });
    if (res.ok) {
      setBackups(prev => prev.filter(b => b.id !== id));
      if (selectedId === id) setSelectedId(null);
      showMsg("Backup record deleted.");
    } else {
      showMsg("Failed to delete.", "error");
    }
    setDelConfirm(null);
  }

  async function bulkDelete() {
    if (checkedIds.size === 0) return;
    const confirmed = await confirm({
      message: `Delete ${checkedIds.size} selected backup record${checkedIds.size !== 1 ? "s" : ""}? This permanently deletes both the records and their encrypted files on disk. It cannot be undone.`,
      tone: "danger",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;
    setBulkDeleting(true);
    try {
      const results = await Promise.allSettled(
        Array.from(checkedIds).map((id) => fetch(`/api/backup/${id}`, { method: "DELETE" }).then((r) => ({ id, ok: r.ok })))
      );
      const succeededIds = results.filter((r): r is PromiseFulfilledResult<{ id: string; ok: boolean }> => r.status === "fulfilled" && r.value.ok).map((r) => r.value.id);
      const failed = results.length - succeededIds.length;
      setBackups((prev) => prev.filter((b) => !succeededIds.includes(b.id)));
      if (selectedId && succeededIds.includes(selectedId)) setSelectedId(null);
      showMsg(`${succeededIds.length} backup${succeededIds.length !== 1 ? "s" : ""} deleted${failed ? `, ${failed} failed` : ""}.`, failed ? "error" : "ok");
      setCheckedIds(new Set());
      refresh();
    } finally {
      setBulkDeleting(false);
    }
  }

  async function handleRestore() {
    if (!restoreConfirm || restoreTyped !== restoreConfirm.name) return;
    setRestoring(true);
    try {
      const res = await fetch(`/api/backup/${restoreConfirm.id}/restore`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        showMsg("Restore complete. All data now matches this backup.");
      } else {
        showMsg(body?.error ?? "Restore failed.", "error");
      }
    } finally {
      setRestoring(false);
      setRestoreConfirm(null);
      setRestoreTyped("");
    }
  }

  function exportCsv() {
    const headers = ["Name", "Type", "Target", "Size", "Duration", "Encryption", "Status", "Initiated By", "Date"];
    const rows = [
      headers.join(","),
      ...filtered.map((b) => [
        b.name, TYPE_LABEL[b.backupType], TARGET_LABEL[b.target]?.label ?? b.target, fmt(b.sizeBytes),
        fmtDuration(b.duration), b.encryption, STATUS_META[b.status].label, b.initiator?.name ?? "System", fmtDate(b.createdAt),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "backups.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const healthyCount = (stats.byStatus ?? []).find(s => s.status === "healthy")?._count._all ?? 0;
  const failedCount  = (stats.byStatus ?? []).find(s => s.status === "failed")?._count._all ?? 0;
  const expiredCount = (stats.byStatus ?? []).find(s => s.status === "expired")?._count._all ?? 0;

  const totalStorage = useMemo(() => backups.reduce((sum, b) => sum + bytesToNum(b.sizeBytes), 0), [backups]);

  const filtered = useMemo(() => backups.filter((b) =>
    (search === "" || b.name.toLowerCase().includes(search.toLowerCase())) &&
    (typeFilter === "" || b.backupType === typeFilter) &&
    (statusFilter === "" || b.status === statusFilter)
  ), [backups, search, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageBackups = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Backup &amp; Restore</h1>
          <p className={styles.subtitle}>Full-database dumps written to local disk. Restoring a backup replaces all current data with that backup&apos;s data.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnOutline} onClick={refresh}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className={styles.btnPrimary} onClick={() => setShowNew(true)}>
            <DownloadCloud size={15} /> Run Backup Now
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Last Backup Status</span>
          {stats.latest ? (
            <>
              <div className={styles.statValueRow}>
                <StatusBadge s={stats.latest.status} />
              </div>
              <span className={styles.statSub}>{fmtRelative(stats.latest.createdAt)}</span>
            </>
          ) : (
            <>
              <span className={styles.statValue}>—</span>
              <span className={styles.statSub}>No backups yet</span>
            </>
          )}
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Storage Used</span>
          <span className={styles.statValue}>{fmt(totalStorage)}</span>
          <span className={styles.statSub}>On local disk</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Backups</span>
          <span className={styles.statValue}>{stats.total}</span>
          <span className={styles.statSub}>{healthyCount} healthy{failedCount > 0 ? `, ${failedCount} failed` : ""}</span>
        </div>
        <div className={`${styles.statCard} ${expiredCount > 0 ? styles.statCardError : ""}`}>
          <span className={styles.statLabel}>Expired</span>
          <span className={`${styles.statValue} ${expiredCount > 0 ? styles.statValueError : ""}`}>{expiredCount}</span>
          <span className={styles.statSub}>Exceeding 90-day retention</span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input className={styles.searchInput} placeholder="Search backups…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className={styles.filterRight}>
            <div className={styles.selectWrap}>
              <select className={styles.select} value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value as BackupType | ""); setPage(1); }}>
                <option value="">All Types</option>
                <option value="full">Full</option>
                <option value="incremental">Incremental</option>
                <option value="differential">Differential</option>
                <option value="schema_only">Schema Only</option>
              </select>
              <ChevronDown size={13} className={styles.selectChevron} />
            </div>
            <div className={styles.selectWrap}>
              <select className={styles.select} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as BackupStatus | ""); setPage(1); }}>
                <option value="">All Statuses</option>
                <option value="healthy">Healthy</option>
                <option value="running">Running</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
              </select>
              <ChevronDown size={13} className={styles.selectChevron} />
            </div>
            <button className={styles.btnOutline} onClick={exportCsv} disabled={filtered.length === 0}>
              <Download size={15} /> Export CSV
            </button>
          </div>
        </div>

        {checkedIds.size > 0 && (
          <div className={styles.filterBar} style={{ background: "var(--clr-success-bg)", borderBottom: "1px solid var(--clr-success-border)" }}>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--clr-success)" }}>{checkedIds.size} selected</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className={styles.btnOutline} style={{ background: "var(--clr-error)", borderColor: "var(--clr-error)", color: "#fff" }} onClick={bulkDelete} disabled={bulkDeleting}>
                <Trash2 size={14} /> {bulkDeleting ? "Deleting…" : "Delete Selected"}
              </button>
              <button className={styles.btnOutline} onClick={() => setCheckedIds(new Set())}>Clear</button>
            </div>
          </div>
        )}

        {pageBackups.length === 0 ? (
          <div className={styles.emptyState}>
            <HardDrive size={32} className={styles.emptyIcon} />
            <p>{backups.length === 0 ? 'No backups yet. Click "Run Backup Now" to start one.' : "No backups match your filters."}</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      checked={pageBackups.length > 0 && pageBackups.every(b => checkedIds.has(b.id))}
                      onChange={() => {
                        const next = new Set(checkedIds);
                        if (pageBackups.every(b => checkedIds.has(b.id))) pageBackups.forEach(b => next.delete(b.id));
                        else pageBackups.forEach(b => next.add(b.id));
                        setCheckedIds(next);
                      }}
                    />
                  </th>
                  <th>Name / Timestamp</th>
                  <th>Type</th>
                  <th>Target</th>
                  <th className={styles.right}>Size</th>
                  <th>Duration</th>
                  <th>Encryption</th>
                  <th>Status</th>
                  <th>Initiated By</th>
                  <th className={styles.center}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageBackups.map((b) => (
                  <tr key={b.id} onClick={() => setSelectedId(b.id === selectedId ? null : b.id)}
                    className={`${styles.dataRow} ${selectedId === b.id ? styles.dataRowActive : ""}`}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={checkedIds.has(b.id)}
                        onChange={() => {
                          const next = new Set(checkedIds);
                          if (next.has(b.id)) next.delete(b.id); else next.add(b.id);
                          setCheckedIds(next);
                        }}
                      />
                    </td>
                    <td>
                      <div className={styles.nameCell}>{b.name}</div>
                      <div className={styles.nameSub}>{fmtDate(b.createdAt)}</div>
                    </td>
                    <td><span className={styles.typePill}>{TYPE_LABEL[b.backupType]}</span></td>
                    <td>
                      <span className={styles.targetCell}>
                        {TARGET_LABEL[b.target]?.icon}{TARGET_LABEL[b.target]?.label ?? b.target}
                      </span>
                    </td>
                    <td className={`${styles.right} ${styles.tdMono}`}>{fmt(b.sizeBytes)}</td>
                    <td className={`${styles.tdMuted} ${styles.tdMono}`}>{fmtDuration(b.duration)}</td>
                    <td><span className={styles.encPill}>{b.encryption}</span></td>
                    <td><StatusBadge s={b.status} /></td>
                    <td className={styles.tdMuted}>{b.initiator?.name ?? "System"}</td>
                    <td className={styles.center}>
                      <div className={styles.rowActions}>
                        {b.status === "healthy" && (
                          <button className={`${styles.iconBtn} ${styles.iconBtnAccent}`} onClick={(e) => { e.stopPropagation(); setRestoreConfirm(b); }} title="Restore this backup">
                            <RotateCcw size={14} />
                          </button>
                        )}
                        <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={(e) => { e.stopPropagation(); setDelConfirm(b.id); }} title="Delete record">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className={styles.paginationBar}>
            <span>Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} entries</span>
            <div className={styles.pageButtons}>
              <button className={styles.pageBtn} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={14} /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className={styles.pageBtn} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}

        {selected && (
          <div className={styles.detailPanel}>
            <div className={styles.detailHeader}>
              <h3 className={styles.detailTitle}>{selected.name}</h3>
              <button className={styles.iconBtn} onClick={() => setSelectedId(null)}><X size={16} /></button>
            </div>
            <div className={styles.detailGrid}>
              {[
                { label: "Status",     value: <StatusBadge s={selected.status} /> },
                { label: "Type",       value: TYPE_LABEL[selected.backupType] },
                { label: "Target",     value: TARGET_LABEL[selected.target]?.label ?? selected.target },
                { label: "Size",       value: fmt(selected.sizeBytes) },
                { label: "Duration",   value: fmtDuration(selected.duration) },
                { label: "Encryption", value: selected.encryption },
                { label: "Checksum",   value: selected.checksum ? selected.checksum.slice(0, 12) + "…" : "—" },
                { label: "Expires",    value: selected.expiresAt ? fmtDate(selected.expiresAt) : "—" },
                { label: "Created By", value: selected.initiator?.name ?? "System" },
                { label: "Created At", value: fmtDate(selected.createdAt) },
              ].map((row, i) => (
                <div key={i} className={styles.detailCell}>
                  <div className={styles.detailLabel}>{row.label}</div>
                  <div className={styles.detailValue}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New backup modal */}
      {showNew && (
        <div className={styles.modalOverlay} onClick={() => setShowNew(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}><HardDrive size={16} />New Backup</h3>
              <button className={styles.modalClose} onClick={() => setShowNew(false)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Backup Name *</label>
                <input className={styles.formInput} value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Pre-migration Full Backup" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Type</label>
                <select className={styles.formSelect} value={newType} onChange={e => setNewType(e.target.value as BackupType)}>
                  <option value="full">Full Backup</option>
                  <option value="incremental">Incremental</option>
                  <option value="differential">Differential</option>
                  <option value="schema_only">Schema Only</option>
                </select>
              </div>
              <div className={styles.hintBox}>
                <ShieldCheck size={13} />Written to local disk, encrypted with AES-256-GCM, and expires after 90 days.
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setShowNew(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleCreate} disabled={loading}>
                <DownloadCloud size={14} />{loading ? "Backing up…" : "Start Backup"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {delConfirm && (
        <div className={styles.modalOverlay} onClick={() => setDelConfirm(null)}>
          <div className={`${styles.modal} ${styles.modalDanger}`} onClick={(e) => e.stopPropagation()} style={{ width: 380 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}><AlertTriangle size={18} color="var(--clr-error)" />Delete Backup Record?</h3>
              <button className={styles.modalClose} onClick={() => setDelConfirm(null)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.warnText}>This permanently deletes both the record and the encrypted backup file on disk. It cannot be undone.</p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setDelConfirm(null)}>Cancel</button>
              <button className={styles.btnDanger} onClick={() => handleDelete(delConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Restore confirm */}
      {restoreConfirm && (
        <div className={styles.modalOverlay} onClick={() => { setRestoreConfirm(null); setRestoreTyped(""); }}>
          <div className={`${styles.modal} ${styles.modalDanger}`} onClick={(e) => e.stopPropagation()} style={{ width: 440 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}><AlertTriangle size={18} color="var(--clr-error)" />Restore &quot;{restoreConfirm.name}&quot;?</h3>
              <button className={styles.modalClose} onClick={() => { setRestoreConfirm(null); setRestoreTyped(""); }}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.warnText}>
                This <strong>replaces every current record</strong> across the whole system (students, staff, fees, exams, everything) with the data from this backup, taken {fmtDate(restoreConfirm.createdAt)}. Anything created or changed since then will be lost. This cannot be undone.
              </p>
              <div>
                <label className={styles.confirmLabel}>
                  Type the backup name to confirm: <strong>{restoreConfirm.name}</strong>
                </label>
                <input className={styles.formInput} value={restoreTyped} onChange={e => setRestoreTyped(e.target.value)} placeholder={restoreConfirm.name} />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => { setRestoreConfirm(null); setRestoreTyped(""); }}>Cancel</button>
              <button className={styles.btnDanger} onClick={handleRestore} disabled={restoreTyped !== restoreConfirm.name || restoring}>
                {restoring ? "Restoring…" : "Restore & Overwrite"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
