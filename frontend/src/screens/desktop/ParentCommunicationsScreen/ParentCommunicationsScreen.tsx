"use client";

import { useState } from "react";
import {
  Send, Plus, AlertTriangle, X, RefreshCw, ChevronDown,
  MessageSquare, Mail, Phone, Bell, Trash2, Megaphone,
  CheckCircle2, Clock, XCircle, Smartphone,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import styles from "./ParentCommunicationsScreen.module.css";

export type BroadcastStatus = "draft" | "pending" | "delivered" | "scheduled" | "failed" | "partial";

export interface Broadcast {
  id: string;
  subject: string;
  body: string;
  audience: string;
  channels: string[];
  status: BroadcastStatus;
  scheduledAt?: string | null;
  sentAt?: string | null;
  delivered: number;
  failed: number;
  pending: number;
  isConsent: boolean;
  sentBy: { id: string; name: string; role: string };
  createdAt: string;
  updatedAt: string;
}

export interface BroadcastStats {
  totalSent: number;
  totalFailed: number;
  totalPending: number;
  consents: number;
}

export interface ClassOption { id: string; name: string }

export interface ParentCommunicationsContentProps {
  initialBroadcasts: Broadcast[];
  initialStats:      BroadcastStats;
  classes:           ClassOption[];
}
type Props = ParentCommunicationsContentProps;

export const STATUS_META: Record<BroadcastStatus, { label: string; pillClass: string }> = {
  draft:     { label: "Draft",     pillClass: "pillDraft" },
  pending:   { label: "Sending…",  pillClass: "pillPending" },
  delivered: { label: "Delivered", pillClass: "pillDelivered" },
  scheduled: { label: "Scheduled", pillClass: "pillScheduled" },
  failed:    { label: "Failed",    pillClass: "pillFailed" },
  partial:   { label: "Partial",   pillClass: "pillScheduled" },
};

export const FIXED_AUDIENCE_LABEL: Record<string, string> = {
  all:        "All Parents",
  defaulters: "Fee Defaulters",
  boarding:   "Boarding Students' Parents",
  pta:        "PTA Committee",
};

export const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  sms:      <Phone size={12} />,
  email:    <Mail size={12} />,
  push:     <Bell size={12} />,
  whatsapp: <MessageSquare size={12} />,
};

export function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function audienceLabel(value: string, classes: ClassOption[]): string {
  if (FIXED_AUDIENCE_LABEL[value]) return FIXED_AUDIENCE_LABEL[value];
  if (value.startsWith("class:")) {
    const cls = classes.find((c) => c.id === value.slice("class:".length));
    return cls ? `${cls.name} Parents` : value;
  }
  return value;
}

export function DeliveryBar({ delivered, failed, pending }: { delivered: number; failed: number; pending: number }) {
  const total = delivered + failed + pending;
  if (total === 0) return <span className={styles.deliveryDash}>—</span>;
  const dPct = Math.round((delivered / total) * 100);
  const fPct = Math.round((failed / total) * 100);
  return (
    <div>
      <div className={styles.deliveryBar}>
        <div className={styles.deliveryDelivered} style={{ width: `${dPct}%` }} />
        <div className={styles.deliveryFailed} style={{ width: `${fPct}%` }} />
        <div className={styles.deliveryPending} />
      </div>
      <div className={styles.deliveryLabel}>{delivered} del · {failed} fail · {pending} pend</div>
    </div>
  );
}

export function ParentCommunicationsScreen({ initialBroadcasts, initialStats, classes }: Props) {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(initialBroadcasts);
  const [stats, setStats]           = useState<BroadcastStats>(initialStats);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BroadcastStatus | "">("");
  const [tab, setTab]               = useState<"broadcasts" | "consent">("broadcasts");
  const [showNew, setShowNew]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [delConfirm, setDelConfirm] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [nSubject,   setNSubject]   = useState("");
  const [nBody,      setNBody]      = useState("");
  const [nAudience,  setNAudience]  = useState("all");
  const [nChannels,  setNChannels]  = useState<string[]>(["sms", "email"]);
  const [nScheduled, setNScheduled] = useState("");
  const [nConsent,   setNConsent]   = useState(false);

  const selected = broadcasts.find(b => b.id === selectedId);

  function showMsg(msg: string, type: "ok" | "error" = "ok") {
    showToast(msg, type === "error" ? "error" : "success");
  }

  function toggleChannel(c: string) {
    setNChannels(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }

  async function refresh() {
    const [bRes, sRes] = await Promise.all([
      fetch("/api/broadcasts"),
      fetch("/api/broadcasts?stats=1"),
    ]);
    if (bRes.ok) setBroadcasts(await bRes.json());
    if (sRes.ok) setStats(await sRes.json());
  }

  async function handleSend() {
    if (!nSubject.trim()) return showMsg("Subject is required.", "error");
    if (!nBody.trim())    return showMsg("Message body is required.", "error");
    if (nChannels.length === 0) return showMsg("Select at least one channel.", "error");
    setLoading(true);
    try {
      const res = await fetch("/api/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject:     nSubject,
          body:        nBody,
          audience:    nAudience,
          channels:    nChannels,
          scheduledAt: nScheduled || undefined,
          isConsent:   nConsent,
        }),
      });
      if (res.ok) {
        const b = await res.json();
        setBroadcasts(prev => [b, ...prev]);
        setSelectedId(b.id);
        setShowNew(false);
        setNSubject(""); setNBody(""); setNScheduled(""); setNConsent(false); setNChannels(["sms", "email"]);
        showMsg(nScheduled ? "Message scheduled." : "Message sent. Delivery will update shortly.");
        setTimeout(refresh, 9000);
      } else {
        const err = await res.json().catch(() => null);
        showMsg(err?.message ?? "Failed to send.", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/broadcasts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setBroadcasts(prev => prev.filter(b => b.id !== id));
      if (selectedId === id) setSelectedId(null);
      showMsg("Broadcast deleted.");
      await refresh();
    } else {
      showMsg("Failed to delete.", "error");
    }
    setDelConfirm(null);
  }

  async function bulkDelete() {
    if (checkedIds.size === 0) return;
    const confirmed = await confirm({
      message: `Delete ${checkedIds.size} selected broadcast${checkedIds.size !== 1 ? "s" : ""}? Messages already sent to parents are not recalled.`,
      tone: "danger",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;
    setBulkDeleting(true);
    try {
      const results = await Promise.allSettled(
        Array.from(checkedIds).map((id) => fetch(`/api/broadcasts/${id}`, { method: "DELETE" }).then((r) => ({ id, ok: r.ok })))
      );
      const succeededIds = results.filter((r): r is PromiseFulfilledResult<{ id: string; ok: boolean }> => r.status === "fulfilled" && r.value.ok).map((r) => r.value.id);
      const failed = results.length - succeededIds.length;
      setBroadcasts((prev) => prev.filter((b) => !succeededIds.includes(b.id)));
      if (selectedId && succeededIds.includes(selectedId)) setSelectedId(null);
      showMsg(`${succeededIds.length} broadcast${succeededIds.length !== 1 ? "s" : ""} deleted${failed ? `, ${failed} failed` : ""}.`, failed ? "error" : "ok");
      setCheckedIds(new Set());
      await refresh();
    } finally {
      setBulkDeleting(false);
    }
  }

  const filtered = broadcasts.filter(b => {
    if (tab === "consent" && !b.isConsent) return false;
    if (tab === "broadcasts" && b.isConsent) return false;
    if (statusFilter && b.status !== statusFilter) return false;
    return true;
  });

  const deliveryRate = stats.totalSent > 0 ? Math.round(((stats.totalSent - stats.totalFailed) / stats.totalSent) * 1000) / 10 : 0;
  const primaryChannel = selected?.channels?.[0] ?? "sms";

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Parent Broadcasts</h1>
          <p className={styles.subtitle}>Send one-way mass announcements to parent segments via SMS, email, push, and WhatsApp — for individual support requests, see Support Tickets.</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowNew(true)}>
          <Plus size={16} /> New Broadcast
        </button>
      </div>

      {/* KPI cards — all real, derived from stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Broadcasts Sent</span>
            <span className={`${styles.statIcon} ${styles.statIconAccent}`}><Megaphone size={14} /></span>
          </div>
          <span className={styles.statValue}>{stats.totalSent}</span>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Delivery Rate</span>
            <span className={`${styles.statIcon} ${styles.statIconGood}`}><CheckCircle2 size={14} /></span>
          </div>
          <span className={`${styles.statValue} ${styles.statValueGood}`}>{deliveryRate}%</span>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Scheduled / Pending</span>
            <span className={`${styles.statIcon} ${styles.statIconWarn}`}><Clock size={14} /></span>
          </div>
          <span className={styles.statValue}>{stats.totalPending}</span>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Failed Deliveries</span>
            <span className={`${styles.statIcon} ${styles.statIconError}`}><XCircle size={14} /></span>
          </div>
          <span className={`${styles.statValue} ${styles.statValueError}`}>{stats.totalFailed}</span>
        </div>
      </div>

      <div className={styles.controlRow}>
        <div className={styles.tabBar}>
          <button className={`${styles.tabBtn} ${tab === "broadcasts" ? styles.tabBtnActive : ""}`} onClick={() => setTab("broadcasts")}>All Broadcasts</button>
          <button className={`${styles.tabBtn} ${tab === "consent" ? styles.tabBtnActive : ""}`} onClick={() => setTab("consent")}>Consents ({stats.consents})</button>
        </div>
        <div className={styles.filterRight}>
          <div className={styles.selectWrap}>
            <select className={styles.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value as BroadcastStatus | "")}>
              <option value="">All Statuses</option>
              <option value="delivered">Delivered</option>
              <option value="scheduled">Scheduled</option>
              <option value="pending">Sending</option>
              <option value="failed">Failed</option>
              <option value="draft">Draft</option>
            </select>
            <ChevronDown size={14} className={styles.selectChevron} />
          </div>
          <button className={styles.iconBtn} onClick={refresh} title="Refresh"><RefreshCw size={15} /></button>
        </div>
      </div>

      {checkedIds.size > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkLabel}>{checkedIds.size} selected</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className={styles.btnDanger} onClick={bulkDelete} disabled={bulkDeleting}>
              <Trash2 size={13} /> {bulkDeleting ? "Deleting…" : "Delete Selected"}
            </button>
            <button className={styles.btnOutline} onClick={() => setCheckedIds(new Set())}>Clear</button>
          </div>
        </div>
      )}

      <div className={styles.splitView}>
        {/* Left: broadcast table */}
        <div className={styles.tableCard}>
          {filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <Send size={32} className={styles.emptyIcon} />
              <p>No broadcasts yet. Click &quot;New Broadcast&quot; to send one.</p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>
                      <input
                        type="checkbox"
                        checked={filtered.length > 0 && filtered.every(b => checkedIds.has(b.id))}
                        onChange={() => {
                          const next = new Set(checkedIds);
                          if (filtered.every(b => checkedIds.has(b.id))) filtered.forEach(b => next.delete(b.id));
                          else filtered.forEach(b => next.add(b.id));
                          setCheckedIds(next);
                        }}
                      />
                    </th>
                    <th>Subject</th><th>Audience</th><th>Channels</th><th>Delivery</th><th>Status</th><th>Sent</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b => (
                    <tr key={b.id} onClick={() => setSelectedId(b.id === selectedId ? null : b.id)}
                      className={`${styles.row} ${selectedId === b.id ? styles.rowActive : ""}`}>
                      <td className={styles.td} onClick={e => e.stopPropagation()}>
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
                      <td className={styles.td}>
                        <div className={styles.subjectCell}>{b.subject}</div>
                        <div className={styles.subjectSub}>{b.body.slice(0, 50)}{b.body.length > 50 ? "…" : ""}</div>
                      </td>
                      <td className={`${styles.td} ${styles.tdMuted}`}>{audienceLabel(b.audience, classes)}</td>
                      <td className={styles.td}>
                        <div className={styles.channelRow}>
                          {(b.channels ?? []).map(c => (
                            <span key={c} title={c} className={styles.channelChip}>{CHANNEL_ICONS[c] ?? <MessageSquare size={11} />}</span>
                          ))}
                        </div>
                      </td>
                      <td className={styles.td} style={{ minWidth: 110 }}>
                        <DeliveryBar delivered={b.delivered} failed={b.failed} pending={b.pending} />
                      </td>
                      <td className={styles.td}>
                        <span className={`${styles.pill} ${styles[STATUS_META[b.status].pillClass]}`}>{STATUS_META[b.status].label}</span>
                        {b.isConsent && <span className={styles.consentTag}>CONSENT</span>}
                      </td>
                      <td className={`${styles.td} ${styles.tdMuted}`}>
                        {b.scheduledAt ? `Sched. ${fmtDate(b.scheduledAt)}` : b.sentAt ? fmtDate(b.sentAt) : "—"}
                      </td>
                      <td className={styles.td}>
                        <button className={styles.rowActionBtn} onClick={e => { e.stopPropagation(); setDelConfirm(b.id); }}><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: message preview (phone mockup, real content) */}
        <div className={styles.previewPanel}>
          <div className={styles.previewHeader}>
            <div className={styles.previewHeaderLeft}>
              <Smartphone size={15} color="var(--clr-app-accent)" />
              <span className={styles.previewHeaderTitle}>Message Preview</span>
            </div>
            {selected && <span className={styles.liveTag}>Live View</span>}
          </div>

          {!selected ? (
            <div className={styles.previewEmpty}>
              <MessageSquare size={28} style={{ opacity: 0.3 }} />
              <p>Select a broadcast to preview its message.</p>
            </div>
          ) : (
            <>
              <div className={styles.previewBody}>
                <div className={styles.phoneShell}>
                  <div className={styles.phoneStatusBar}>
                    <span>9:41</span>
                    <span>●●●</span>
                  </div>
                  <div className={styles.phoneAppHeader}>
                    {CHANNEL_ICONS[primaryChannel] ?? <MessageSquare size={12} />}
                    <span className={styles.phoneAppHeaderText}>ScholarSphere Academy</span>
                  </div>
                  <div className={styles.phoneMessages}>
                    <div className={styles.phoneBubble}>
                      {selected.body}
                      <span className={styles.phoneTimestamp}>{selected.sentAt ? fmtDate(selected.sentAt) : "Not sent yet"}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.previewFooter}>
                <div className={styles.previewFooterRow}>
                  <span className={styles.previewFooterKey}>Audience</span>
                  <span className={styles.previewFooterVal}>{audienceLabel(selected.audience, classes)}</span>
                </div>
                <div className={styles.previewFooterRow}>
                  <span className={styles.previewFooterKey}>Character Count</span>
                  <span className={styles.previewFooterVal}>{selected.body.length}</span>
                </div>
                <div className={styles.previewFooterRow}>
                  <span className={styles.previewFooterKey}>Delivered / Failed / Pending</span>
                  <span className={styles.previewFooterVal}>{selected.delivered} / {selected.failed} / {selected.pending}</span>
                </div>
                <div className={styles.previewFooterRow}>
                  <span className={styles.previewFooterKey}>Sent By</span>
                  <span className={styles.previewFooterVal}>{selected.sentBy.name}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New broadcast modal */}
      {showNew && (
        <div className={styles.modalOverlay} onClick={() => setShowNew(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}><Send size={16} />New Broadcast</h3>
              <button className={styles.modalClose} onClick={() => setShowNew(false)}><X size={18} /></button>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Subject *</label>
              <input className={styles.formInput} value={nSubject} onChange={e => setNSubject(e.target.value)} placeholder="e.g. End-of-term fee notice" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Message Body *</label>
              <textarea className={styles.formTextarea} value={nBody} onChange={e => setNBody(e.target.value)} placeholder="Write your message to parents here…" />
              <div className={styles.formHint}>{nBody.length} characters</div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Audience</label>
              <select className={styles.formSelect} value={nAudience} onChange={e => setNAudience(e.target.value)}>
                {Object.entries(FIXED_AUDIENCE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                {classes.map((c) => <option key={c.id} value={`class:${c.id}`}>{c.name} Parents</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Channels *</label>
              <div className={styles.channelPickerRow}>
                {["sms", "email", "push", "whatsapp"].map(c => (
                  <div key={c} onClick={() => toggleChannel(c)} className={`${styles.channelOption} ${nChannels.includes(c) ? styles.channelOptionActive : ""}`}>
                    {CHANNEL_ICONS[c]}{c}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Schedule (optional)</label>
              <input className={styles.formInput} type="datetime-local" value={nScheduled} onChange={e => setNScheduled(e.target.value)} />
              <div className={styles.formHint}>Leave blank to send immediately.</div>
            </div>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={nConsent} onChange={e => setNConsent(e.target.checked)} />
              This is a consent / permission form request
            </label>
            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={() => setShowNew(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSend} disabled={loading}>
                <Send size={14} />{loading ? "Sending…" : nScheduled ? "Schedule" : "Send Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {delConfirm && (
        <div className={styles.modalOverlay} onClick={() => setDelConfirm(null)}>
          <div className={`${styles.modal} ${styles.modalDanger}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}><AlertTriangle size={18} color="var(--clr-error)" />Delete Broadcast?</h3>
              <button className={styles.modalClose} onClick={() => setDelConfirm(null)}><X size={18} /></button>
            </div>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--clr-app-muted)", marginBottom: 20 }}>This removes the broadcast record. Messages already sent to parents are not recalled.</p>
            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={() => setDelConfirm(null)}>Cancel</button>
              <button className={styles.btnDanger} onClick={() => handleDelete(delConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
