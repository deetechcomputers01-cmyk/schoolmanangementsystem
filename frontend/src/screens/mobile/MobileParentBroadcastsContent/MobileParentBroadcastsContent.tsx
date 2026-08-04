"use client";

/**
 * MobileParentBroadcastsContent — bespoke mobile view for Parent Broadcasts.
 *
 * Every field/action traces back to ParentCommunicationsScreen.tsx (the real
 * "Content" component for this route — the "Screen" role is played by
 * `app/(app)/parent-communications/page.tsx`) and the real /api/broadcasts
 * endpoints — same handleSend() (POST), handleDelete() (DELETE), refresh()
 * (GET x2) logic. Reuses the real `DeliveryBar`/`audienceLabel`/`fmtDate`
 * helpers and `STATUS_META`/`FIXED_AUDIENCE_LABEL`/`CHANNEL_ICONS` constants
 * directly from the desktop file so the delivery-percentage math and status
 * labels can never drift between platforms.
 *
 * Deviations from the Stitch mockup (parent_broadcasts_mobile_admin):
 *   - "Sent Today" KPI has no real per-day breakdown — `BroadcastStats` only
 *     has cumulative totalSent/totalFailed/totalPending/consents. Replaced
 *     the 3-KPI mockup layout with the real 4: Broadcasts Sent, Delivery
 *     Rate, Scheduled/Pending, Failed Deliveries (matching desktop exactly).
 *   - Filter chips (Drafts/Scheduled/Sent) simplified from the mockup's 3
 *     to the real 5-state status filter used on desktop (Delivered/
 *     Scheduled/Sending/Failed/Draft), plus the real Consents tab.
 *   - Card "more_horiz" action → real single action available per row on
 *     desktop is Delete (confirmed via the same `useConfirm()` pattern used
 *     elsewhere in this codebase, replacing desktop's own inline delConfirm
 *     modal since that modal isn't part of the ported mobile sheet).
 */

import { useMemo, useState } from "react";
import {
  Send, Plus, Trash2, RefreshCw, Search, MessageSquare,
  Megaphone, CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import {
  STATUS_META, FIXED_AUDIENCE_LABEL, CHANNEL_ICONS, fmtDate, audienceLabel, DeliveryBar,
} from "@/screens/desktop/ParentCommunicationsScreen/ParentCommunicationsScreen";
import type {
  Broadcast, BroadcastStats, BroadcastStatus, ParentCommunicationsContentProps,
} from "@/screens/desktop/ParentCommunicationsScreen/ParentCommunicationsScreen";
import styles from "./MobileParentBroadcastsContent.module.css";

const STATUS_FILTERS: { value: BroadcastStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "delivered", label: "Delivered" },
  { value: "scheduled", label: "Scheduled" },
  { value: "pending", label: "Sending" },
  { value: "failed", label: "Failed" },
  { value: "draft", label: "Draft" },
];

export function MobileParentBroadcastsContent({ initialBroadcasts, initialStats, classes }: ParentCommunicationsContentProps) {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(initialBroadcasts);
  const [stats, setStats] = useState<BroadcastStats>(initialStats);
  const [statusFilter, setStatusFilter] = useState<BroadcastStatus | "">("");
  const [tab, setTab] = useState<"broadcasts" | "consent">("broadcasts");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showToast } = useToast();
  const confirm = useConfirm();

  async function refresh() {
    setRefreshing(true);
    try {
      const [bRes, sRes] = await Promise.all([fetch("/api/broadcasts"), fetch("/api/broadcasts?stats=1")]);
      if (bRes.ok) setBroadcasts(await bRes.json());
      if (sRes.ok) setStats(await sRes.json());
    } finally {
      setRefreshing(false);
    }
  }

  const filtered = useMemo(() => broadcasts.filter((b) => {
    if (tab === "consent" && !b.isConsent) return false;
    if (tab === "broadcasts" && b.isConsent) return false;
    if (statusFilter && b.status !== statusFilter) return false;
    if (search && !b.subject.toLowerCase().includes(search.toLowerCase()) && !b.body.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [broadcasts, tab, statusFilter, search]);

  const deliveryRate = stats.totalSent > 0 ? Math.round(((stats.totalSent - stats.totalFailed) / stats.totalSent) * 1000) / 10 : 0;

  async function handleDelete(b: Broadcast) {
    const sure = await confirm({ message: `Delete "${b.subject}"? Messages already sent to parents are not recalled.`, confirmLabel: "Delete" });
    if (!sure) return;
    setDeletingId(b.id);
    try {
      const res = await fetch(`/api/broadcasts/${b.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setBroadcasts((prev) => prev.filter((x) => x.id !== b.id));
      showToast("Broadcast deleted");
      await refresh();
    } catch {
      showToast("Failed to delete broadcast", "error");
    } finally {
      setDeletingId(null);
    }
  }

  // ── New Broadcast sheet ───────────────────────────────────────────────
  const [showNew, setShowNew] = useState(false);
  const [nSubject, setNSubject] = useState("");
  const [nBody, setNBody] = useState("");
  const [nAudience, setNAudience] = useState("all");
  const [nChannels, setNChannels] = useState<string[]>(["sms", "email"]);
  const [nScheduled, setNScheduled] = useState("");
  const [nConsent, setNConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  function toggleChannel(c: string) {
    setNChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }
  function openNew() {
    setNSubject(""); setNBody(""); setNAudience("all"); setNChannels(["sms", "email"]); setNScheduled(""); setNConsent(false);
    setShowNew(true);
  }

  async function handleSend() {
    if (!nSubject.trim()) { showToast("Subject is required.", "error"); return; }
    if (!nBody.trim()) { showToast("Message body is required.", "error"); return; }
    if (nChannels.length === 0) { showToast("Select at least one channel.", "error"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: nSubject, body: nBody, audience: nAudience, channels: nChannels,
          scheduledAt: nScheduled || undefined, isConsent: nConsent,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const b = await res.json();
      setBroadcasts((prev) => [b, ...prev]);
      setShowNew(false);
      showToast(nScheduled ? "Message scheduled" : "Message sent. Delivery will update shortly.");
      setTimeout(refresh, 9000);
    } catch {
      showToast("Failed to send broadcast", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Broadcasts Sent</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValue}>{stats.totalSent}</strong><Megaphone size={18} className={styles.kpiIcon} /></div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Delivery Rate</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValueGood}>{deliveryRate}%</strong><CheckCircle2 size={18} className={styles.kpiIconGood} /></div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Scheduled / Pending</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValue}>{stats.totalPending}</strong><Clock size={18} className={styles.kpiIcon} /></div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Failed Deliveries</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValueBad}>{stats.totalFailed}</strong><XCircle size={18} className={styles.kpiIconBad} /></div>
        </div>
      </div>

      <div className={styles.actionRow}>
        <button type="button" className={styles.addBtn} onClick={openNew}><Plus size={16} /> New Broadcast</button>
        <button type="button" className={styles.refreshBtn} onClick={refresh} disabled={refreshing} title="Refresh">
          <RefreshCw size={16} className={refreshing ? styles.spinning : undefined} />
        </button>
      </div>

      <div className={kit.segmented}>
        <button type="button" className={`${kit.segBtn} ${tab === "broadcasts" ? kit.segBtnActive : ""}`} onClick={() => setTab("broadcasts")}>All Broadcasts</button>
        <button type="button" className={`${kit.segBtn} ${tab === "consent" ? kit.segBtnActive : ""}`} onClick={() => setTab("consent")}>Consents ({stats.consents})</button>
      </div>

      <label className={kit.searchWrap}>
        <Search size={16} className={kit.searchIcon} />
        <input className={`${kit.input} ${kit.searchInput}`} placeholder="Search broadcasts" value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>

      <div className={styles.chipRow}>
        {STATUS_FILTERS.map((f) => (
          <button key={f.value} type="button" className={`${styles.chip} ${statusFilter === f.value ? styles.chipActive : ""}`} onClick={() => setStatusFilter(f.value)}>{f.label}</button>
        ))}
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <p className={kit.emptyText}>No broadcasts yet. Tap &quot;New Broadcast&quot; to send one.</p>
        ) : filtered.map((b) => {
          const isOpen = openId === b.id;
          const meta = STATUS_META[b.status];
          return (
            <article key={b.id} className={styles.card}>
              <button type="button" className={styles.cardHeader} onClick={() => setOpenId(isOpen ? null : b.id)}>
                <div className={styles.cardHeaderText}>
                  <span className={styles.subject}>{b.subject}</span>
                  <span className={styles.bodyPreview}>{b.body.slice(0, 60)}{b.body.length > 60 ? "…" : ""}</span>
                  <span className={styles.audience}>{audienceLabel(b.audience, classes)}</span>
                </div>
                <div className={styles.cardHeaderRight}>
                  <span className={`${styles.statusPill} ${styles[meta.pillClass]}`}>{meta.label}</span>
                  {b.isConsent && <span className={styles.consentTag}>CONSENT</span>}
                </div>
                {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              <div className={styles.channelRow}>
                {(b.channels ?? []).map((c) => (
                  <span key={c} className={styles.channelChip} title={c}>{CHANNEL_ICONS[c] ?? <MessageSquare size={11} />}</span>
                ))}
                <span className={styles.dateText}>{b.scheduledAt ? `Sched. ${fmtDate(b.scheduledAt)}` : b.sentAt ? fmtDate(b.sentAt) : "—"}</span>
              </div>

              {isOpen && (
                <div className={styles.cardDetail}>
                  <p className={styles.fullBody}>{b.body}</p>
                  <DeliveryBar delivered={b.delivered} failed={b.failed} pending={b.pending} />
                  <div className={styles.detailRow}><span>Sent By</span><strong>{b.sentBy.name}</strong></div>
                  <button type="button" className={styles.deleteBtn} disabled={deletingId === b.id} onClick={() => handleDelete(b)}>
                    <Trash2 size={13} /> {deletingId === b.id ? "Deleting…" : "Delete Broadcast"}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <MobileSheet
        open={showNew}
        onClose={() => !loading && setShowNew(false)}
        title="New Broadcast"
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => setShowNew(false)} disabled={loading}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={handleSend} disabled={loading}>
            <Send size={13} /> {loading ? "Sending…" : nScheduled ? "Schedule" : "Send Now"}
          </button>
        </>}
      >
        <div className={kit.field}>
          <label>Subject *</label>
          <input className={kit.input} value={nSubject} onChange={(e) => setNSubject(e.target.value)} placeholder="e.g. End-of-term fee notice" />
        </div>
        <div className={kit.field}>
          <label>Message Body *</label>
          <textarea className={kit.textarea} rows={4} value={nBody} onChange={(e) => setNBody(e.target.value)} placeholder="Write your message to parents here…" />
          <p className={kit.helperText}>{nBody.length} characters</p>
        </div>
        <div className={kit.field}>
          <label>Audience</label>
          <select className={kit.select} value={nAudience} onChange={(e) => setNAudience(e.target.value)}>
            {Object.entries(FIXED_AUDIENCE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            {classes.map((c) => <option key={c.id} value={`class:${c.id}`}>{c.name} Parents</option>)}
          </select>
        </div>
        <div className={kit.field}>
          <label>Channels *</label>
          <div className={kit.chipRow}>
            {["sms", "email", "push", "whatsapp"].map((c) => (
              <div key={c} onClick={() => toggleChannel(c)} className={`${kit.chip} ${nChannels.includes(c) ? kit.chipActive : ""}`}>
                {CHANNEL_ICONS[c]}{c}
              </div>
            ))}
          </div>
        </div>
        <div className={kit.field}>
          <label>Schedule (optional)</label>
          <input className={kit.input} type="datetime-local" value={nScheduled} onChange={(e) => setNScheduled(e.target.value)} />
          <p className={kit.helperText}>Leave blank to send now.</p>
        </div>
        <div className={kit.checkboxRow}>
          <input type="checkbox" checked={nConsent} onChange={(e) => setNConsent(e.target.checked)} />
          <label className={kit.checkboxLabel}>This is a consent / permission form request</label>
        </div>
      </MobileSheet>
    </div>
  );
}
