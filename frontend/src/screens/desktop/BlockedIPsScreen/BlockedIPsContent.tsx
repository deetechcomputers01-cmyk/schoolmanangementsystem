"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldOff, ShieldAlert, Search, ChevronLeft, ChevronRight, Download, X, Trash2 } from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import styles from "./BlockedIPsScreen.module.css";

interface BlockedIPRow {
  id: string;
  ip: string;
  reason: string | null;
  blockedByName: string;
  createdAt: string;
  expiresAt: string | null;
}

interface Props {
  blocked: BlockedIPRow[];
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function exportCsv(rows: BlockedIPRow[]) {
  const headers = ["IP Address", "Reason", "Blocked By", "Date Blocked", "Expiry"];
  const csvRows = [
    headers.join(","),
    ...rows.map((r) => [r.ip, r.reason ?? "", r.blockedByName, fmtDate(r.createdAt), r.expiresAt ? fmtDate(r.expiresAt) : "Never"]
      .map((v) => `"${v.replace(/"/g, '""')}"`).join(",")),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "blocked-ips.csv"; a.click();
  URL.revokeObjectURL(url);
}

export function BlockedIPsContent({ blocked }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [ip, setIp] = useState("");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUnblocking, setBulkUnblocking] = useState(false);

  const filtered = useMemo(() => blocked.filter((b) =>
    search === "" || b.ip.includes(search) || (b.reason ?? "").toLowerCase().includes(search.toLowerCase())
  ), [blocked, search]);

  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((b) => selectedIds.has(b.id));
  function toggleSelectAll() {
    const next = new Set(selectedIds);
    if (allOnPageSelected) pageRows.forEach((b) => next.delete(b.id));
    else pageRows.forEach((b) => next.add(b.id));
    setSelectedIds(next);
  }
  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  }

  async function bulkUnblock() {
    if (selectedIds.size === 0) return;
    const confirmed = await confirm({
      message: `Unblock ${selectedIds.size} selected IP address${selectedIds.size !== 1 ? "es" : ""}?`,
      confirmLabel: "Unblock",
    });
    if (!confirmed) return;
    setBulkUnblocking(true);
    try {
      const results = await Promise.allSettled(
        Array.from(selectedIds).map((id) => fetch(`/api/admin/blocked-ips/${id}`, { method: "DELETE" }))
      );
      const succeeded = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;
      const failed = results.length - succeeded;
      showToast(`${succeeded} IP${succeeded !== 1 ? "s" : ""} unblocked${failed ? `, ${failed} failed` : ""}.`, failed ? "error" : "success");
      setSelectedIds(new Set());
      router.refresh();
    } finally {
      setBulkUnblocking(false);
    }
  }

  function openModal() {
    setIp(""); setReason(""); setExpiresAt(""); setError("");
    setShowModal(true);
  }

  async function submitBlock() {
    if (!ip.trim()) { setError("IP address is required."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/blocked-ips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip: ip.trim(),
          reason: reason.trim() || undefined,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setError(err?.error?.ip?.[0] ?? err?.error ?? "Failed to block IP.");
        return;
      }
      setShowModal(false);
      showToast(`${ip.trim()} blocked`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function unblock(id: string, ipAddress: string) {
    if (!(await confirm({ message: `Unblock ${ipAddress}?`, confirmLabel: "Unblock" }))) return;
    setUnblockingId(id);
    try {
      const res = await fetch(`/api/admin/blocked-ips/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast(`${ipAddress} unblocked`);
        router.refresh();
      } else {
        showToast("Failed to unblock IP", "error");
      }
    } finally {
      setUnblockingId(null);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Blocked IP Addresses</h1>
          <p className={styles.subtitle}>Manage and review restricted network addresses to secure system access.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnPrimary} onClick={openModal}>
            <ShieldOff size={15} /> Block IP Address
          </button>
        </div>
      </div>

      <div className={styles.summaryCard}>
        <p className={styles.summaryLabel}>Currently Blocked</p>
        <span className={styles.summaryValue}>{blocked.length}</span>
      </div>

      <div className={styles.mainCard}>
        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input className={styles.searchInput} placeholder="Filter by IP address or reason…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <button className={styles.btnOutline} onClick={() => exportCsv(filtered)} disabled={filtered.length === 0}>
            <Download size={15} /> Export
          </button>
        </div>

        {selectedIds.size > 0 && (
          <div className={styles.filterBar} style={{ background: "var(--clr-success-bg)", borderBottom: "1px solid var(--clr-success-border)" }}>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--clr-success)" }}>{selectedIds.size} selected</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className={styles.btnOutline} style={{ background: "var(--clr-error)", borderColor: "var(--clr-error)", color: "#fff" }} onClick={bulkUnblock} disabled={bulkUnblocking}>
                <Trash2 size={14} /> {bulkUnblocking ? "Unblocking…" : "Unblock Selected"}
              </button>
              <button className={styles.btnOutline} onClick={() => setSelectedIds(new Set())}>Clear</button>
            </div>
          </div>
        )}

        {pageRows.length === 0 ? (
          <div className={styles.emptyState}>
            <ShieldAlert size={32} className={styles.emptyIcon} />
            <p>{blocked.length === 0 ? "No blocked IPs yet." : "No blocked IPs match your search."}</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAll} />
                  </th>
                  <th>IP Address</th>
                  <th>Reason</th>
                  <th>Blocked By</th>
                  <th>Date Blocked</th>
                  <th>Expiry</th>
                  <th className={styles.right}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((b) => {
                  const expired = b.expiresAt ? new Date(b.expiresAt) < new Date() : false;
                  return (
                    <tr key={b.id} className={styles.dataRow}>
                      <td>
                        <input type="checkbox" checked={selectedIds.has(b.id)} onChange={() => toggleSelect(b.id)} />
                      </td>
                      <td className={styles.ipCell}>{b.ip}</td>
                      <td className={styles.tdMuted}>{b.reason ?? "—"}</td>
                      <td>{b.blockedByName}</td>
                      <td className={styles.tdMuted}>{fmtDate(b.createdAt)}</td>
                      <td>
                        {b.expiresAt
                          ? <span className={expired ? styles.expiredText : styles.tdMuted}>{fmtDate(b.expiresAt)}</span>
                          : <span className={styles.neverPill}>Never</span>}
                      </td>
                      <td className={styles.right}>
                        <button className={styles.unblockBtn} disabled={unblockingId === b.id} onClick={() => unblock(b.id, b.ip)}>
                          <Trash2 size={13} /> {unblockingId === b.id ? "…" : "Unblock"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className={styles.paginationBar}>
            <span>Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} records</span>
            <div className={styles.pageButtons}>
              <button className={styles.pageBtn} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={14} /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className={styles.pageBtn} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => !saving && setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}><ShieldOff size={17} />Block IP Address</h2>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              {error && <p className={styles.errorText}>{error}</p>}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>IPv4 Address *</label>
                <input className={styles.formInput} placeholder="e.g. 192.168.1.100" value={ip} onChange={(e) => setIp(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Reason</label>
                <input className={styles.formInput} placeholder="e.g. Repeated failed login attempts" value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Expires At</label>
                <input className={styles.formInput} type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
              <button className={styles.btnPrimary} onClick={submitBlock} disabled={saving}>
                {saving ? "Blocking…" : "Block IP"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
