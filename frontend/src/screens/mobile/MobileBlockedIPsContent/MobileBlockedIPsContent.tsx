"use client";

/**
 * MobileBlockedIPsContent — bespoke mobile view for the Blocked IPs screen.
 *
 * Every field/action traces back to BlockedIPsContent.tsx (the real desktop
 * component) and the real /api/admin/blocked-ips endpoints — same
 * submitBlock() (POST) and unblock() (DELETE) handlers.
 *
 * Deviations from the Stitch mockup (blocked_ips_mobile_admin):
 *   - "Active Threat Alerts" stat and the "System Alert: Last firewall
 *     synchronization…" decorative card have no backing data anywhere
 *     (no threat-alert or firewall-sync model/service) — omitted. Kept the
 *     one real stat (Currently Blocked count).
 *   - Status pill "Active"/"Expired" IS real — derived from `expiresAt`
 *     vs now, same logic as desktop's `expired` check.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldOff, ShieldAlert, Search, Trash2 } from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import { fmtDate } from "@/screens/desktop/BlockedIPsScreen/BlockedIPsContent";
import type { BlockedIPsContentProps } from "@/screens/desktop/BlockedIPsScreen/BlockedIPsContent";
import styles from "./MobileBlockedIPsContent.module.css";

export function MobileBlockedIPsContent({ blocked }: BlockedIPsContentProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const filtered = useMemo(() => blocked.filter((b) =>
    search === "" || b.ip.includes(search) || (b.reason ?? "").toLowerCase().includes(search.toLowerCase())
  ), [blocked, search]);

  async function unblock(id: string, ipAddress: string) {
    const sure = await confirm({ message: `Unblock ${ipAddress}?`, confirmLabel: "Unblock" });
    if (!sure) return;
    setUnblockingId(id);
    try {
      const res = await fetch(`/api/admin/blocked-ips/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      showToast(`${ipAddress} unblocked`);
      router.refresh();
    } catch {
      showToast("Failed to unblock IP", "error");
    } finally {
      setUnblockingId(null);
    }
  }

  // ── Block IP sheet ────────────────────────────────────────────────────
  const [sheetOpen, setSheetOpen] = useState(false);
  const [ip, setIp] = useState("");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);

  function openSheet() {
    setIp(""); setReason(""); setExpiresAt("");
    setSheetOpen(true);
  }

  async function submitBlock() {
    if (!ip.trim()) { showToast("IP address is required.", "error"); return; }
    setSaving(true);
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
      if (!res.ok) throw new Error("Failed");
      setSheetOpen(false);
      showToast(`${ip.trim()} blocked`);
      router.refresh();
    } catch {
      showToast("Failed to block IP", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.summaryCard}>
        <p className={styles.summaryLabel}>Currently Blocked</p>
        <span className={styles.summaryValue}>{blocked.length}</span>
      </div>

      <button type="button" className={styles.addBtn} onClick={openSheet}><ShieldOff size={16} /> Block IP Address</button>

      <label className={kit.searchWrap}>
        <Search size={16} className={kit.searchIcon} />
        <input className={`${kit.input} ${kit.searchInput}`} placeholder="Filter by IP address or reason" value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <ShieldAlert size={28} style={{ opacity: 0.3 }} />
            <p>{blocked.length === 0 ? "No blocked IPs yet." : "No blocked IPs match your search."}</p>
          </div>
        ) : filtered.map((b) => {
          const expired = b.expiresAt ? new Date(b.expiresAt) < new Date() : false;
          return (
            <article key={b.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.ipBadge}><ShieldOff size={16} /></div>
                <div className={styles.cardText}>
                  <span className={styles.ip}>{b.ip}</span>
                  <span className={styles.reason}>{b.reason ?? "No reason given"}</span>
                </div>
                <span className={`${styles.statusPill} ${expired ? styles.statusExpired : b.expiresAt ? styles.statusActive : styles.statusIndefinite}`}>
                  {b.expiresAt ? (expired ? "Expired" : "Active") : "Indefinite"}
                </span>
              </div>
              <div className={styles.cardMeta}>
                <span>By {b.blockedByName}</span>
                <span>{fmtDate(b.createdAt)}</span>
                <span>{b.expiresAt ? `Expires ${fmtDate(b.expiresAt)}` : "Never expires"}</span>
              </div>
              <button type="button" className={styles.unblockBtn} disabled={unblockingId === b.id} onClick={() => unblock(b.id, b.ip)}>
                <Trash2 size={13} /> {unblockingId === b.id ? "Unblocking…" : "Unblock"}
              </button>
            </article>
          );
        })}
      </div>

      <MobileSheet
        open={sheetOpen}
        onClose={() => !saving && setSheetOpen(false)}
        title="Block IP Address"
        compact
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => setSheetOpen(false)} disabled={saving}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={submitBlock} disabled={saving}>{saving ? "Blocking…" : "Block IP"}</button>
        </>}
      >
        <div className={kit.field}>
          <label>IPv4 Address *</label>
          <input className={kit.input} style={{ fontFamily: "monospace" }} placeholder="e.g. 192.168.1.100" value={ip} onChange={(e) => setIp(e.target.value)} />
        </div>
        <div className={kit.field}>
          <label>Reason</label>
          <input className={kit.input} placeholder="e.g. Repeated failed login attempts" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <div className={kit.field}>
          <label>Expires At</label>
          <input className={kit.input} type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          <p className={kit.helperText}>Leave blank to block indefinitely.</p>
        </div>
      </MobileSheet>
    </div>
  );
}
