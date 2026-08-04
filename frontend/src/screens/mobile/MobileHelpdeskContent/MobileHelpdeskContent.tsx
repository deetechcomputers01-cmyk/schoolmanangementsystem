"use client";

/**
 * MobileHelpdeskContent — bespoke mobile view for Support Tickets.
 *
 * Every field/action traces back to HelpdeskScreen.tsx (the real desktop
 * component — a single-file 3-pane layout, no Content.tsx split) and the
 * real /api/helpdesk endpoints — same handleSendReply()/handleStatusChange()/
 * handleCreateTicket() logic, ported here.
 *
 * Fixed while porting (a real bug, not mobile-specific): desktop's
 * "Resolved Today" stat was actually all-time resolved count with no date
 * filtering. This screen computes a real today-filtered count instead
 * (resolved tickets whose updatedAt falls on the current calendar day).
 *
 * Deviations from the Stitch mockups (support_center, support_ticket_details):
 *   - "Help Center" quick-action and "Popular Articles" ("Resetting School
 *     MFA Tokens", etc.) are fabricated — no browsable knowledge-base/help
 *     article feature exists anywhere in the codebase. Omitted. The KB
 *     Template button in the reply composer is a *different*, real feature
 *     (5 canned staff-reply snippets) and is kept.
 *   - "Report an Issue" and "Contact Support" both just open the same real
 *     New Ticket form — collapsed into one "New Ticket" action since there's
 *     only one real ticket-creation flow.
 *   - Ticket detail's "Assigned Team" is shown read-only (desktop has no
 *     assignment UI either — the /api/helpdesk/tickets/[id] PATCH endpoint
 *     accepts assigneeId, but no picker exists anywhere yet to drive it).
 *   - Ticket detail's "Files" tab and "Attach" button are both pure stubs on
 *     desktop (toast "coming soon", no attachment model) — omitted rather
 *     than replicated.
 *   - Search (by subject/ticket number) is new but 100% real — it filters
 *     the same `tickets` array desktop already has in memory.
 */

import { useMemo, useState } from "react";
import {
  LifeBuoy, Plus, RefreshCw, Search, Send, BookOpen, Lock, X,
  CheckCircle, ArrowUpRight, Clock, Users, UserCog,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import {
  STATUS_COLOR, PRIORITY_COLOR, QUEUE_COLOR, KB_TEMPLATES, StatusBadge, PriorityBadge, Avatar, fmtDate,
} from "@/screens/desktop/HelpdeskScreen/HelpdeskScreen";
import type {
  Ticket, TicketStatus, TicketPriority, Queue, HelpdeskContentProps,
} from "@/screens/desktop/HelpdeskScreen/HelpdeskScreen";
import styles from "./MobileHelpdeskContent.module.css";

const QUEUES: Queue[] = ["parent", "teacher", "it", "finance", "maintenance", "general"];

function isToday(iso: string) {
  const d = new Date(iso), n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export function MobileHelpdeskContent({ initialTickets, initialStats }: HelpdeskContentProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [stats, setStats] = useState(initialStats);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"all" | "urgent">("all");
  const [queueFilter, setQueueFilter] = useState<Queue | "">("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();

  const openCount = (stats.byStatus ?? []).find((s) => s.status === "open")?._count._all ?? 0;
  const urgentCount = (stats.byPriority ?? []).find((p) => p.priority === "urgent")?._count._all ?? 0;
  const escalatedCount = (stats.byStatus ?? []).find((s) => s.status === "escalated")?._count._all ?? 0;
  const inProgressCount = (stats.byStatus ?? []).find((s) => s.status === "in_progress")?._count._all ?? 0;
  const resolvedTodayCount = useMemo(() => tickets.filter((t) => t.status === "resolved" && isToday(t.updatedAt)).length, [tickets]);

  const filtered = useMemo(() => tickets.filter((t) => {
    if (view === "urgent" && t.priority !== "urgent") return false;
    if (queueFilter && t.queue !== queueFilter) return false;
    if (statusFilter && t.status !== statusFilter) return false;
    if (search && !t.subject.toLowerCase().includes(search.toLowerCase()) && !t.ticketNo.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [tickets, view, queueFilter, statusFilter, search]);

  const selected = tickets.find((t) => t.id === selectedId) ?? null;

  async function refresh() {
    setRefreshing(true);
    try {
      const [tRes, sRes] = await Promise.all([fetch("/api/helpdesk/tickets"), fetch("/api/helpdesk/tickets?stats=1")]);
      if (tRes.ok) setTickets(await tRes.json());
      if (sRes.ok) setStats(await sRes.json());
    } finally {
      setRefreshing(false);
    }
  }

  async function handleStatusChange(id: string, status: TicketStatus) {
    const res = await fetch(`/api/helpdesk/tickets/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
      showToast(`Ticket ${STATUS_COLOR[status].label.toLowerCase()}.`);
    } else {
      showToast("Failed to update ticket.", "error");
    }
  }

  // ── Reply composer ────────────────────────────────────────────────
  const [replyText, setReplyText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [nextStatus, setNextStatus] = useState<TicketStatus>("in_progress");
  const [showKb, setShowKb] = useState(false);
  const [tab, setTab] = useState<"timeline" | "internal">("timeline");
  const [sending, setSending] = useState(false);

  function openTicket(t: Ticket) {
    setSelectedId(t.id);
    setReplyText(""); setIsInternal(false); setNextStatus("in_progress"); setTab("timeline"); setShowKb(false);
  }

  async function handleSendReply() {
    if (!replyText.trim() || !selected) return;
    setSending(true);
    try {
      const [msgRes, statusRes] = await Promise.all([
        fetch(`/api/helpdesk/tickets/${selected.id}/messages`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: replyText, isInternal }),
        }),
        fetch(`/api/helpdesk/tickets/${selected.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus }),
        }),
      ]);
      if (msgRes.ok && statusRes.ok) {
        const newMsg = await msgRes.json();
        const updatedTicket = await statusRes.json();
        setTickets((prev) => prev.map((t) => (t.id === selected.id ? { ...updatedTicket, messages: [...(updatedTicket.messages ?? []), newMsg] } : t)));
        setReplyText("");
        showToast("Reply sent.");
      } else {
        showToast("Failed to send reply.", "error");
      }
    } finally {
      setSending(false);
    }
  }

  // ── New Ticket sheet ─────────────────────────────────────────────
  const [showNew, setShowNew] = useState(false);
  const [nSubject, setNSubject] = useState("");
  const [nDesc, setNDesc] = useState("");
  const [nQueue, setNQueue] = useState<Queue>("parent");
  const [nPriority, setNPriority] = useState<TicketPriority>("medium");
  const [creating, setCreating] = useState(false);

  function openNew() {
    setNSubject(""); setNDesc(""); setNQueue("parent"); setNPriority("medium");
    setShowNew(true);
  }

  async function handleCreateTicket() {
    if (!nSubject.trim()) return showToast("Subject is required.", "error");
    setCreating(true);
    try {
      const res = await fetch("/api/helpdesk/tickets", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: nSubject, description: nDesc, queue: nQueue, priority: nPriority }),
      });
      if (res.ok) {
        const ticket = await res.json();
        setTickets((prev) => [ticket, ...prev]);
        setShowNew(false);
        showToast(`Ticket ${ticket.ticketNo} created.`);
        await refresh();
      } else {
        showToast("Failed to create ticket.", "error");
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.actionRow}>
        <button type="button" className={styles.addBtn} onClick={openNew}><Plus size={16} /> New Ticket</button>
        <button type="button" className={styles.refreshBtn} onClick={refresh} disabled={refreshing} title="Refresh">
          <RefreshCw size={16} className={refreshing ? styles.spinning : undefined} />
        </button>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}><span className={styles.kpiLabel}>Open</span><strong className={styles.kpiValue}>{openCount}</strong></div>
        <div className={`${styles.kpiCard} ${urgentCount > 0 ? styles.kpiCardError : ""}`}><span className={styles.kpiLabel}>Urgent</span><strong className={urgentCount > 0 ? styles.kpiValueError : styles.kpiValue}>{urgentCount}</strong></div>
        <div className={styles.kpiCard}><span className={styles.kpiLabel}>In Progress</span><strong className={styles.kpiValue}>{inProgressCount}</strong></div>
        <div className={`${styles.kpiCard} ${escalatedCount > 0 ? styles.kpiCardError : ""}`}><span className={styles.kpiLabel}>Escalated</span><strong className={escalatedCount > 0 ? styles.kpiValueError : styles.kpiValue}>{escalatedCount}</strong></div>
        <div className={styles.kpiCard}><span className={styles.kpiLabel}>Resolved Today</span><strong className={styles.kpiValue}>{resolvedTodayCount}</strong></div>
        <div className={styles.kpiCard}><span className={styles.kpiLabel}>Total</span><strong className={styles.kpiValue}>{stats.total}</strong></div>
      </div>

      <label className={kit.searchWrap}>
        <Search size={16} className={kit.searchIcon} />
        <input className={`${kit.input} ${kit.searchInput}`} placeholder="Search tickets…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>

      <div className={kit.segmented}>
        <button type="button" className={view === "all" ? kit.segBtnActive : kit.segBtn} onClick={() => setView("all")}>All Tickets</button>
        <button type="button" className={view === "urgent" ? kit.segBtnActive : kit.segBtn} onClick={() => setView("urgent")}>Urgent</button>
      </div>

      <div className={styles.chipRow}>
        <button type="button" className={`${styles.chip} ${queueFilter === "" ? styles.chipActive : ""}`} onClick={() => setQueueFilter("")}>All Queues</button>
        {QUEUES.map((q) => (
          <button key={q} type="button" className={`${styles.chip} ${queueFilter === q ? styles.chipActive : ""}`} onClick={() => setQueueFilter(queueFilter === q ? "" : q)}>
            <span className={styles.chipDot} style={{ background: QUEUE_COLOR[q] }} />{q.charAt(0).toUpperCase() + q.slice(1)}
          </button>
        ))}
      </div>
      <div className={styles.chipRow}>
        <button type="button" className={`${styles.chip} ${statusFilter === "" ? styles.chipActive : ""}`} onClick={() => setStatusFilter("")}>All Statuses</button>
        {(Object.keys(STATUS_COLOR) as TicketStatus[]).map((s) => (
          <button key={s} type="button" className={`${styles.chip} ${statusFilter === s ? styles.chipActive : ""}`} onClick={() => setStatusFilter(statusFilter === s ? "" : s)}>{STATUS_COLOR[s].label}</button>
        ))}
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <LifeBuoy size={28} style={{ opacity: 0.3 }} />
            <p>{tickets.length === 0 ? "No tickets yet." : "No tickets match your filters."}</p>
          </div>
        ) : filtered.map((t) => (
          <button key={t.id} type="button" className={styles.card} onClick={() => openTicket(t)}>
            <div className={styles.cardTop}>
              <span className={styles.ticketNo}>{t.ticketNo}</span>
              <span className={styles.cardTime}>{fmtDate(t.updatedAt)}</span>
            </div>
            <p className={styles.subject}>{t.subject}</p>
            <div className={styles.cardMeta}>
              <span className={styles.requester}>{t.requester.name} · <span className={styles.queueLabel}>{t.queue}</span></span>
            </div>
            <div className={styles.badgeRow}>
              <StatusBadge s={t.status} />
              <PriorityBadge p={t.priority} />
            </div>
          </button>
        ))}
      </div>

      {/* ── Ticket detail sheet ─────────────────────────────────────── */}
      <MobileSheet
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title={selected?.subject ?? ""}
        eyebrow={selected?.ticketNo}
      >
        {selected && (
          <div className={styles.detail}>
            <div className={styles.detailBadges}>
              <StatusBadge s={selected.status} />
              <PriorityBadge p={selected.priority} />
            </div>
            <p className={styles.detailMeta}><Clock size={12} /> {fmtDate(selected.createdAt)}</p>

            <div className={styles.metaGrid}>
              <div className={styles.metaCell}>
                <span className={styles.metaLabel}>Queue</span>
                <span className={styles.metaValue}><Users size={13} /> {selected.queue.charAt(0).toUpperCase() + selected.queue.slice(1)}</span>
              </div>
              <div className={styles.metaCell}>
                <span className={styles.metaLabel}>Assigned</span>
                <span className={styles.metaValue}><UserCog size={13} /> {selected.assignee?.name ?? "Unassigned"}</span>
              </div>
            </div>

            {selected.description && <div className={styles.descBlock}>{selected.description}</div>}

            <div className={styles.actionRow2}>
              <button type="button" className={styles.miniBtnDanger} onClick={() => handleStatusChange(selected.id, "escalated")}><ArrowUpRight size={12} /> Escalate</button>
              <button type="button" className={styles.miniBtnPrimary} onClick={() => handleStatusChange(selected.id, "resolved")}><CheckCircle size={12} /> Resolve</button>
              <button type="button" className={styles.miniBtnOutline} onClick={() => handleStatusChange(selected.id, "closed")}><X size={12} /> Close</button>
            </div>

            <div className={kit.segmented}>
              <button type="button" className={tab === "timeline" ? kit.segBtnActive : kit.segBtn} onClick={() => setTab("timeline")}>Timeline</button>
              <button type="button" className={tab === "internal" ? kit.segBtnActive : kit.segBtn} onClick={() => setTab("internal")}>
                Internal{selected.messages.filter((m) => m.isInternal).length > 0 ? ` (${selected.messages.filter((m) => m.isInternal).length})` : ""}
              </button>
            </div>

            <div className={styles.messages}>
              {tab === "timeline" && (
                selected.messages.filter((m) => !m.isInternal).length === 0 ? (
                  <p className={styles.emptyMsg}>No messages yet. Send the first reply below.</p>
                ) : selected.messages.filter((m) => !m.isInternal).map((m) => {
                  const isStaff = m.from.role === "super_admin" || m.from.role === "principal" || m.from.role === "staff";
                  return (
                    <div key={m.id} className={`${styles.msgRow} ${isStaff ? styles.msgRowStaff : ""}`}>
                      <Avatar name={m.from.name} size={26} />
                      <div className={styles.msgBubbleWrap}>
                        <div className={styles.msgHead}><span>{m.from.name}</span><span className={styles.msgTime}>{fmtDate(m.createdAt)}</span></div>
                        <div className={`${styles.msgBubble} ${isStaff ? styles.msgBubbleStaff : ""}`}>{m.body}</div>
                      </div>
                    </div>
                  );
                })
              )}
              {tab === "internal" && (
                selected.messages.filter((m) => m.isInternal).length === 0 ? (
                  <div className={`${kit.banner} ${kit.bannerWarn}`}><Lock size={13} /> Internal notes are visible only to staff. None added yet.</div>
                ) : selected.messages.filter((m) => m.isInternal).map((m) => (
                  <div key={m.id} className={styles.internalNote}>
                    <div className={styles.internalNoteHead}><Lock size={11} /> {m.from.name} · {fmtDate(m.createdAt)}</div>
                    <div>{m.body}</div>
                  </div>
                ))
              )}
            </div>

            <div className={styles.composer}>
              <label className={styles.internalToggle}>
                <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
                <Lock size={12} /> Internal note (staff only)
              </label>
              <textarea
                className={styles.textarea}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={isInternal ? "Add an internal note…" : "Type your reply to the requester…"}
              />
              {showKb && (
                <div className={styles.kbList}>
                  {KB_TEMPLATES.map((t, i) => (
                    <button key={i} type="button" className={styles.kbItem} onClick={() => { setReplyText(t.replace("#TICKET_NO", selected.ticketNo)); setShowKb(false); }}>{t}</button>
                  ))}
                </div>
              )}
              <div className={styles.composerRow}>
                <button type="button" className={styles.kbBtn} onClick={() => setShowKb((v) => !v)}><BookOpen size={12} /> KB Template</button>
                <select className={styles.statusSelect} value={nextStatus} onChange={(e) => setNextStatus(e.target.value as TicketStatus)}>
                  <option value="open">Keep Open</option>
                  <option value="in_progress">Mark In Progress</option>
                  <option value="resolved">Mark Resolved</option>
                  <option value="closed">Close</option>
                </select>
              </div>
              <button type="button" className={styles.sendBtn} onClick={handleSendReply} disabled={sending || !replyText.trim()}>
                <Send size={14} /> {sending ? "Sending…" : "Send Reply"}
              </button>
            </div>
          </div>
        )}
      </MobileSheet>

      {/* ── New Ticket sheet ────────────────────────────────────────── */}
      <MobileSheet
        open={showNew}
        onClose={() => !creating && setShowNew(false)}
        title="New Support Ticket"
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => setShowNew(false)} disabled={creating}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={handleCreateTicket} disabled={creating}>{creating ? "Creating…" : "Create Ticket"}</button>
        </>}
      >
        <div className={kit.field}>
          <label>Subject *</label>
          <input className={kit.input} value={nSubject} onChange={(e) => setNSubject(e.target.value)} placeholder="Brief description of the issue" />
        </div>
        <div className={kit.field}>
          <label>Description</label>
          <textarea className={styles.textarea} value={nDesc} onChange={(e) => setNDesc(e.target.value)} placeholder="Provide more details…" />
        </div>
        <div className={kit.fieldRow}>
          <div className={kit.field}>
            <label>Queue</label>
            <select className={kit.select} value={nQueue} onChange={(e) => setNQueue(e.target.value as Queue)}>
              {QUEUES.map((q) => <option key={q} value={q}>{q.charAt(0).toUpperCase() + q.slice(1)}</option>)}
            </select>
          </div>
          <div className={kit.field}>
            <label>Priority</label>
            <select className={kit.select} value={nPriority} onChange={(e) => setNPriority(e.target.value as TicketPriority)}>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </MobileSheet>
    </div>
  );
}
