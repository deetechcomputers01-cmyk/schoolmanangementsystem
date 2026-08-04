"use client";

/**
 * MobileBackupRestoreContent — bespoke mobile view for Backup & Restore.
 *
 * Every field/action traces back to BackupRestoreScreen.tsx (the real
 * desktop component — this screen has no separate Content.tsx, the whole
 * thing lives in one file) and the real /api/backup endpoints — same
 * handleCreate()/handleDelete()/handleRestore() logic.
 *
 * Deviations from the Stitch mockup (backup_restore_indigo_refined):
 *   - "Storage Usage 1.24 TB / 2.0 TB" progress bar implies a storage
 *     quota — no such quota concept exists anywhere (BackupStats has no
 *     capacity field). Replaced with the real "Total Storage Used" stat
 *     (sum of actual backup file sizes) with no fake denominator.
 *   - "Schedule" quick action has no backing — there is no backup
 *     scheduling feature anywhere in this codebase. Omitted; kept the two
 *     real actions (Run Backup, and tapping a healthy backup's Restore).
 *   - The Restore flow's real safety mechanism (typing the exact backup
 *     name to confirm before a full-database wipe-and-restore) is
 *     preserved as its own sheet rather than weakened to a plain Yes/No —
 *     this is a genuinely destructive, irreversible operation on desktop
 *     too, so the same friction is kept on mobile.
 */

import { useMemo, useState } from "react";
import {
  HardDrive, Plus, RefreshCw, Trash2, RotateCcw, Search, ShieldCheck,
  ChevronDown, ChevronUp, AlertTriangle,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import {
  STATUS_META, TYPE_LABEL, TARGET_LABEL, fmt, fmtDate, fmtRelative, fmtDuration, bytesToNum, StatusBadge,
} from "@/screens/desktop/BackupRestoreScreen/BackupRestoreScreen";
import type {
  BackupRecord, BackupType, BackupStatus, BackupRestoreContentProps,
} from "@/screens/desktop/BackupRestoreScreen/BackupRestoreScreen";
import styles from "./MobileBackupRestoreContent.module.css";

export function MobileBackupRestoreContent({ initialBackups, initialStats }: BackupRestoreContentProps) {
  const [backups, setBackups] = useState<BackupRecord[]>(initialBackups);
  const [stats, setStats] = useState(initialStats);
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<BackupType | "">("");
  const [statusFilter, setStatusFilter] = useState<BackupStatus | "">("");
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showToast } = useToast();
  const confirm = useConfirm();

  async function refresh() {
    setRefreshing(true);
    try {
      const [bRes, sRes] = await Promise.all([fetch("/api/backup"), fetch("/api/backup?stats=1")]);
      if (bRes.ok) setBackups(await bRes.json());
      if (sRes.ok) setStats(await sRes.json());
    } finally {
      setRefreshing(false);
    }
  }

  const healthyCount = (stats.byStatus ?? []).find((s) => s.status === "healthy")?._count._all ?? 0;
  const failedCount = (stats.byStatus ?? []).find((s) => s.status === "failed")?._count._all ?? 0;
  const expiredCount = (stats.byStatus ?? []).find((s) => s.status === "expired")?._count._all ?? 0;
  const totalStorage = useMemo(() => backups.reduce((sum, b) => sum + bytesToNum(b.sizeBytes), 0), [backups]);

  const filtered = useMemo(() => backups.filter((b) =>
    (search === "" || b.name.toLowerCase().includes(search.toLowerCase())) &&
    (typeFilter === "" || b.backupType === typeFilter) &&
    (statusFilter === "" || b.status === statusFilter)
  ), [backups, search, typeFilter, statusFilter]);

  async function handleDelete(b: BackupRecord) {
    const sure = await confirm({ message: `Delete "${b.name}"? This permanently deletes both the record and the encrypted backup file on disk. It cannot be undone.`, confirmLabel: "Delete" });
    if (!sure) return;
    setDeletingId(b.id);
    try {
      const res = await fetch(`/api/backup/${b.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setBackups((prev) => prev.filter((x) => x.id !== b.id));
      showToast("Backup record deleted");
    } catch {
      showToast("Failed to delete", "error");
    } finally {
      setDeletingId(null);
    }
  }

  // ── New Backup sheet ─────────────────────────────────────────────────
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<BackupType>("full");
  const [creating, setCreating] = useState(false);

  function openNew() {
    setNewName(""); setNewType("full");
    setShowNew(true);
  }

  async function handleCreate() {
    if (!newName.trim()) { showToast("Name is required.", "error"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, backupType: newType }),
      });
      if (!res.ok) throw new Error("Failed");
      const record = await res.json();
      setBackups((prev) => [record, ...prev]);
      setShowNew(false);
      showToast(record.status === "healthy" ? "Backup completed" : "Backup failed — check server logs", record.status === "healthy" ? "success" : "error");
      refresh();
    } catch {
      showToast("Failed to start backup", "error");
    } finally {
      setCreating(false);
    }
  }

  // ── Restore sheet (typed-name confirmation, matches desktop's safety gate) ──
  const [restoreTarget, setRestoreTarget] = useState<BackupRecord | null>(null);
  const [restoreTyped, setRestoreTyped] = useState("");
  const [restoring, setRestoring] = useState(false);

  async function handleRestore() {
    if (!restoreTarget || restoreTyped !== restoreTarget.name) return;
    setRestoring(true);
    try {
      const res = await fetch(`/api/backup/${restoreTarget.id}/restore`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        showToast("Restore complete. All data now matches this backup.");
      } else {
        showToast(body?.error ?? "Restore failed.", "error");
      }
    } finally {
      setRestoring(false);
      setRestoreTarget(null);
      setRestoreTyped("");
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.actionRow}>
        <button type="button" className={styles.addBtn} onClick={openNew}><Plus size={16} /> Run Backup Now</button>
        <button type="button" className={styles.refreshBtn} onClick={refresh} disabled={refreshing} title="Refresh">
          <RefreshCw size={16} className={refreshing ? styles.spinning : undefined} />
        </button>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Last Backup</span>
          {stats.latest ? (
            <>
              <StatusBadge s={stats.latest.status} />
              <span className={styles.kpiSub}>{fmtRelative(stats.latest.createdAt)}</span>
            </>
          ) : <strong className={styles.kpiValue}>—</strong>}
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Storage Used</span>
          <strong className={styles.kpiValue}>{fmt(totalStorage)}</strong>
          <span className={styles.kpiSub}>On local disk</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Backups</span>
          <strong className={styles.kpiValue}>{stats.total}</strong>
          <span className={styles.kpiSub}>{healthyCount} healthy{failedCount > 0 ? `, ${failedCount} failed` : ""}</span>
        </div>
        <div className={`${styles.kpiCard} ${expiredCount > 0 ? styles.kpiCardError : ""}`}>
          <span className={styles.kpiLabel}>Expired</span>
          <strong className={expiredCount > 0 ? styles.kpiValueError : styles.kpiValue}>{expiredCount}</strong>
          <span className={styles.kpiSub}>Past 90-day retention</span>
        </div>
      </div>

      <label className={kit.searchWrap}>
        <Search size={16} className={kit.searchIcon} />
        <input className={`${kit.input} ${kit.searchInput}`} placeholder="Search backups" value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>

      <div className={styles.chipRow}>
        <button type="button" className={`${styles.chip} ${typeFilter === "" ? styles.chipActive : ""}`} onClick={() => setTypeFilter("")}>All Types</button>
        {(Object.keys(TYPE_LABEL) as BackupType[]).map((t) => (
          <button key={t} type="button" className={`${styles.chip} ${typeFilter === t ? styles.chipActive : ""}`} onClick={() => setTypeFilter(typeFilter === t ? "" : t)}>{TYPE_LABEL[t]}</button>
        ))}
      </div>
      <div className={styles.chipRow}>
        <button type="button" className={`${styles.chip} ${statusFilter === "" ? styles.chipActive : ""}`} onClick={() => setStatusFilter("")}>All Statuses</button>
        {(Object.keys(STATUS_META) as BackupStatus[]).map((s) => (
          <button key={s} type="button" className={`${styles.chip} ${statusFilter === s ? styles.chipActive : ""}`} onClick={() => setStatusFilter(statusFilter === s ? "" : s)}>{STATUS_META[s].label}</button>
        ))}
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <HardDrive size={28} style={{ opacity: 0.3 }} />
            <p>{backups.length === 0 ? 'No backups yet. Tap "Run Backup Now" to start one.' : "No backups match your filters."}</p>
          </div>
        ) : filtered.map((b) => {
          const isOpen = openId === b.id;
          return (
            <article key={b.id} className={styles.card}>
              <button type="button" className={styles.cardHeader} onClick={() => setOpenId(isOpen ? null : b.id)}>
                <div className={styles.cardHeaderText}>
                  <span className={styles.name}>{b.name}</span>
                  <span className={styles.meta}>{fmtDate(b.createdAt)} • {fmt(b.sizeBytes)}</span>
                </div>
                <StatusBadge s={b.status} />
                {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {isOpen && (
                <div className={styles.cardDetail}>
                  <div className={styles.detailRow}><span>Type</span><strong>{TYPE_LABEL[b.backupType]}</strong></div>
                  <div className={styles.detailRow}><span>Target</span><strong>{TARGET_LABEL[b.target]?.label ?? b.target}</strong></div>
                  <div className={styles.detailRow}><span>Duration</span><strong>{fmtDuration(b.duration)}</strong></div>
                  <div className={styles.detailRow}><span>Encryption</span><strong>{b.encryption}</strong></div>
                  <div className={styles.detailRow}><span>Checksum</span><strong>{b.checksum ? `${b.checksum.slice(0, 12)}…` : "—"}</strong></div>
                  <div className={styles.detailRow}><span>Expires</span><strong>{b.expiresAt ? fmtDate(b.expiresAt) : "—"}</strong></div>
                  <div className={styles.detailRow}><span>Initiated By</span><strong>{b.initiator?.name ?? "System"}</strong></div>

                  <div className={styles.actionRow}>
                    {b.status === "healthy" && (
                      <button type="button" className={styles.restoreBtn} onClick={() => setRestoreTarget(b)}>
                        <RotateCcw size={13} /> Restore
                      </button>
                    )}
                    <button type="button" className={styles.deleteBtn} disabled={deletingId === b.id} onClick={() => handleDelete(b)}>
                      <Trash2 size={13} /> {deletingId === b.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <MobileSheet
        open={showNew}
        onClose={() => !creating && setShowNew(false)}
        title="New Backup"
        compact
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => setShowNew(false)} disabled={creating}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={handleCreate} disabled={creating}>{creating ? "Backing up…" : "Run Backup"}</button>
        </>}
      >
        <div className={kit.field}>
          <label>Backup Name *</label>
          <input className={kit.input} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Pre-migration Full Backup" />
        </div>
        <div className={kit.field}>
          <label>Type</label>
          <select className={kit.select} value={newType} onChange={(e) => setNewType(e.target.value as BackupType)}>
            {(Object.keys(TYPE_LABEL) as BackupType[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
        </div>
        <div className={`${kit.banner} ${kit.bannerInfo}`}>
          <ShieldCheck size={14} /> Written to local disk, encrypted with AES-256-GCM, and expires after 90 days.
        </div>
      </MobileSheet>

      <MobileSheet
        open={!!restoreTarget}
        onClose={() => { if (!restoring) { setRestoreTarget(null); setRestoreTyped(""); } }}
        title={`Restore "${restoreTarget?.name ?? ""}"?`}
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => { setRestoreTarget(null); setRestoreTyped(""); }} disabled={restoring}>Cancel</button>
          <button type="button" className={kit.btnDanger} onClick={handleRestore} disabled={!restoreTarget || restoreTyped !== restoreTarget.name || restoring}>
            {restoring ? "Restoring…" : "Restore & Overwrite"}
          </button>
        </>}
      >
        {restoreTarget && (
          <>
            <div className={`${kit.banner} ${kit.bannerDanger}`}>
              <AlertTriangle size={14} />
              This <strong>replaces every current record</strong> across the whole system with the data from this backup, taken {fmtDate(restoreTarget.createdAt)}. Anything created or changed since then will be lost. This cannot be undone.
            </div>
            <div className={kit.field}>
              <label>Type the backup name to confirm: <strong>{restoreTarget.name}</strong></label>
              <input className={kit.input} value={restoreTyped} onChange={(e) => setRestoreTyped(e.target.value)} placeholder={restoreTarget.name} />
            </div>
          </>
        )}
      </MobileSheet>
    </div>
  );
}
