"use client";

import { useState } from "react";
import {
  LifeBuoy, Plus, AlertTriangle, Clock, CheckCircle, Users, MessageSquare,
  X, Send, Paperclip, Lock, RefreshCw,
  UserCog, ArrowUpRight, BookOpen, Inbox,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import styles from "./HelpdeskScreen.module.css";

export type TicketStatus   = "open" | "in_progress" | "resolved" | "closed" | "escalated";
export type TicketPriority = "urgent" | "high" | "medium" | "low";
export type Queue          = "parent" | "teacher" | "it" | "finance" | "maintenance" | "general";
type ActiveTab      = "timeline" | "internal" | "files";

export interface TicketMessage {
  id: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  from: { id: string; name: string; role: string };
}

export interface Ticket {
  id: string;
  ticketNo: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  queue: Queue;
  createdAt: string;
  updatedAt: string;
  requester: { id: string; name: string; role: string };
  assignee?: { id: string; name: string; role: string } | null;
  messages: TicketMessage[];
  _count?: { messages: number };
}

export interface Stats {
  total: number;
  byStatus: { status: string; _count: { _all: number } }[];
  byPriority: { priority: string; _count: { _all: number } }[];
  byQueue: { queue: string; _count: { _all: number } }[];
}

export interface HelpdeskContentProps {
  initialTickets: Ticket[];
  initialStats:   Stats;
}

export const PRIORITY_COLOR: Record<TicketPriority, { bg: string; text: string; label: string }> = {
  urgent: { bg: "#ffdad6", text: "#93000a",  label: "Urgent"  },
  high:   { bg: "#ffddb7", text: "#653e00",  label: "High"    },
  medium: { bg: "#c1e9fb", text: "#244c5a",  label: "Medium"  },
  low:    { bg: "#c9ecc4", text: "#314d31",  label: "Low"     },
};

export const STATUS_COLOR: Record<TicketStatus, { bg: string; text: string; label: string }> = {
  open:        { bg: "#c1e9fb", text: "#244c5a", label: "Open"        },
  in_progress: { bg: "#ffddb7", text: "#653e00", label: "In Progress" },
  resolved:    { bg: "#c9ecc4", text: "#314d31", label: "Resolved"    },
  closed:      { bg: "#e0e9f2", text: "#41484b", label: "Closed"      },
  escalated:   { bg: "#ffdad6", text: "#93000a", label: "Escalated"   },
};

export const QUEUE_COLOR: Record<Queue, string> = {
  parent:      "#244c5a",
  teacher:     "#314d31",
  it:          "#653e00",
  finance:     "#41484b",
  maintenance: "#93000a",
  general:     "#71787c",
};

export const KB_TEMPLATES = [
  "Thank you for contacting ScholarSphere support. We have received your request (#TICKET_NO) and will respond within 24 hours.",
  "This issue has been escalated to the relevant department. You will receive an update within 2 business days.",
  "Your issue has been resolved. Please let us know if you need further assistance. Reply to this message to reopen.",
  "We need additional information to process your request. Please provide the following details: [specify]",
  "Your request has been forwarded to the Finance department. They will contact you within 1 business day.",
];

export function PriorityBadge({ p }: { p: TicketPriority }) {
  const c = PRIORITY_COLOR[p];
  return <span className={styles.priorityPill} style={{ background: c.bg, color: c.text }}>{c.label}</span>;
}

export function StatusBadge({ s }: { s: TicketStatus }) {
  const c = STATUS_COLOR[s];
  return <span className={styles.statusPill} style={{ background: c.bg, color: c.text }}>{c.label}</span>;
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className={styles.msgAvatar} style={{ width: size, height: size, fontSize: size * 0.32 }}>
      {initials}
    </div>
  );
}

export function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Ticket assignment (assigneeId) is a real, working field on
 *  PATCH /api/helpdesk/tickets/:id — but there is still no picker UI to
 *  drive it (would need a properly-scoped "assignable staff" list endpoint,
 *  since /api/admin/users is super_admin-only and Helpdesk also allows
 *  principal). Shown read-only here; wiring a picker is a follow-up, not
 *  part of this visual refresh. */
export function HelpdeskScreen({ initialTickets, initialStats }: HelpdeskContentProps) {
  const [tickets, setTickets]         = useState<Ticket[]>(initialTickets);
  const [stats, setStats]             = useState<Stats>(initialStats);
  const [selectedId, setSelectedId]   = useState<string>(initialTickets[0]?.id ?? "");
  const [queueFilter, setQueueFilter] = useState<Queue | "">("");
  const [prioFilter,  setPrioFilter]  = useState<TicketPriority | "">("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "">("");
  const [view, setView]               = useState<"all" | "urgent" | "mine">("all");
  const [activeTab, setActiveTab]     = useState<ActiveTab>("timeline");
  const [replyText, setReplyText]     = useState("");
  const [isInternal, setIsInternal]   = useState(false);
  const [nextStatus, setNextStatus]   = useState<TicketStatus>("in_progress");
  const [showKb, setShowKb]           = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const { showToast } = useToast();
  const [loading, setLoading]         = useState(false);

  // New ticket form
  const [nSubject,  setNSubject]  = useState("");
  const [nDesc,     setNDesc]     = useState("");
  const [nQueue,    setNQueue]    = useState<Queue>("parent");
  const [nPriority, setNPriority] = useState<TicketPriority>("medium");

  function showMsg(msg: string, type: "ok" | "error" = "ok") {
    showToast(msg, type === "error" ? "error" : "success");
  }

  const selected = tickets.find(t => t.id === selectedId) ?? tickets[0];

  const openCount    = (stats.byStatus ?? []).find(s => s.status === "open")?._count._all ?? 0;
  const urgentCount  = (stats.byPriority ?? []).find(p => p.priority === "urgent")?._count._all ?? 0;
  const resolvedCount= (stats.byStatus ?? []).find(s => s.status === "resolved")?._count._all ?? 0;
  const escalatedCount = (stats.byStatus ?? []).find(s => s.status === "escalated")?._count._all ?? 0;
  const inProgressCount = (stats.byStatus ?? []).find(s => s.status === "in_progress")?._count._all ?? 0;

  const getQueueCount = (q: string) => (stats.byQueue ?? []).find(b => b.queue === q)?._count._all ?? 0;

  const filtered = tickets.filter(t => {
    if (view === "urgent" && t.priority !== "urgent") return false;
    if (queueFilter  && t.queue    !== queueFilter)  return false;
    if (prioFilter   && t.priority !== prioFilter)   return false;
    if (statusFilter && t.status   !== statusFilter) return false;
    return true;
  });

  async function refreshTickets() {
    const [tRes, sRes] = await Promise.all([
      fetch("/api/helpdesk/tickets"),
      fetch("/api/helpdesk/tickets?stats=1"),
    ]);
    if (tRes.ok) setTickets(await tRes.json());
    if (sRes.ok) setStats(await sRes.json());
  }

  async function handleSendReply() {
    if (!replyText.trim() || !selected) return;
    setLoading(true);
    try {
      const [msgRes, statusRes] = await Promise.all([
        fetch(`/api/helpdesk/tickets/${selected.id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: replyText, isInternal }),
        }),
        fetch(`/api/helpdesk/tickets/${selected.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        }),
      ]);

      if (msgRes.ok && statusRes.ok) {
        const newMsg = await msgRes.json();
        const updatedTicket = await statusRes.json();
        setTickets(prev => prev.map(t => t.id === selected.id
          ? { ...updatedTicket, messages: [...(updatedTicket.messages ?? []), newMsg] }
          : t
        ));
        setReplyText("");
        showMsg("Reply sent.");
      } else {
        showMsg("Failed to send reply.", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id: string, status: TicketStatus) {
    const res = await fetch(`/api/helpdesk/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
      showMsg(`Ticket ${STATUS_COLOR[status].label.toLowerCase()}.`);
    } else {
      showMsg("Failed to update ticket.", "error");
    }
  }

  async function handleCreateTicket() {
    if (!nSubject.trim()) return showMsg("Subject is required.", "error");
    setLoading(true);
    try {
      const res = await fetch("/api/helpdesk/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: nSubject, description: nDesc, queue: nQueue, priority: nPriority }),
      });
      if (res.ok) {
        const ticket = await res.json();
        setTickets(prev => [ticket, ...prev]);
        setSelectedId(ticket.id);
        setShowNewModal(false);
        setNSubject(""); setNDesc("");
        showMsg(`Ticket ${ticket.ticketNo} created.`);
        await refreshTickets();
      } else {
        showMsg("Failed to create ticket.", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  const queues: Queue[] = ["parent", "teacher", "it", "finance", "maintenance", "general"];

  return (
    <div className={styles.page}>

      {/* ── Left panel ─────────────────────────────────────────────────── */}
      <aside className={styles.leftPane}>
        <div className={styles.paneSection}>
          <p className={styles.paneLabel}>Views</p>
          <button className={`${styles.viewBtn} ${view === "all" ? styles.viewBtnActive : ""}`} onClick={() => setView("all")}>
            <span className={styles.viewLabel}><Inbox size={13} /> All Tickets</span>
            <span className={styles.viewCount}>{tickets.length}</span>
          </button>
          <button className={`${styles.viewBtn} ${view === "urgent" ? styles.viewBtnActive : ""}`} onClick={() => setView("urgent")}>
            <span className={styles.viewLabel}><AlertTriangle size={13} /> Urgent</span>
            <span className={styles.urgentCount}>{urgentCount}</span>
          </button>
        </div>

        <div className={styles.paneSection}>
          <p className={styles.paneLabel}>Queues</p>
          <button className={`${styles.queueBtn} ${queueFilter === "" ? styles.queueBtnActive : ""}`} onClick={() => setQueueFilter("")}>
            <span className={styles.viewLabel}><Users size={12} /> All Queues</span>
            <span className={styles.queueCount}>{tickets.length}</span>
          </button>
          {queues.map(q => (
            <button key={q} className={`${styles.queueBtn} ${queueFilter === q ? styles.queueBtnActive : ""}`} onClick={() => setQueueFilter(q === queueFilter ? "" : q)}>
              <span className={styles.viewLabel}>
                <span className={styles.queueDot} style={{ background: QUEUE_COLOR[q] }} />
                {q.charAt(0).toUpperCase() + q.slice(1)}
              </span>
              <span className={styles.queueCount}>{getQueueCount(q)}</span>
            </button>
          ))}
        </div>

        <div className={styles.paneSection}>
          <p className={styles.paneLabel}>Filters</p>
          <div className={styles.filterField}>
            <label>Priority</label>
            <select className={styles.filterSelect} value={prioFilter} onChange={e => setPrioFilter(e.target.value as TicketPriority | "")}>
              <option value="">All</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className={styles.filterField}>
            <label>Status</label>
            <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value as TicketStatus | "")}>
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className={styles.main}>

        <div className={styles.mainHeader}>
          <div className={styles.headerTop}>
            <div>
              <div className={styles.headerTitleWrap}>
                <LifeBuoy size={20} color="var(--clr-app-accent)" />
                <h1 className={styles.headerTitle}>Support Tickets</h1>
              </div>
              <p className={styles.headerSubtitle}>Track and resolve individual issues raised by staff and guardians.</p>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.refreshBtn} onClick={refreshTickets} title="Refresh"><RefreshCw size={14} /></button>
              <button className={styles.newTicketBtn} onClick={() => setShowNewModal(true)}><Plus size={14} /> New Ticket</button>
            </div>
          </div>

          <div className={styles.statGrid}>
            {[
              { icon: <Inbox size={13} />,        label: "Open",           value: openCount },
              { icon: <AlertTriangle size={13} />, label: "Urgent",         value: urgentCount, tone: styles.statTileUrgent },
              { icon: <ArrowUpRight size={13} />,  label: "Escalated",      value: escalatedCount, tone: styles.statTileEscalated },
              { icon: <CheckCircle size={13} />,   label: "Resolved",       value: resolvedCount, tone: styles.statTileResolved },
              { icon: <Users size={13} />,         label: "Parent Queue",   value: getQueueCount("parent") },
              { icon: <Users size={13} />,         label: "Teacher Queue",  value: getQueueCount("teacher") },
              { icon: <Users size={13} />,         label: "IT Queue",       value: getQueueCount("it") },
              { icon: <MessageSquare size={13} />, label: "In Progress",    value: inProgressCount },
            ].map((s, i) => (
              <div key={i} className={`${styles.statTile} ${s.tone ?? ""}`}>
                <div className={styles.statTileLabel}>{s.label}</div>
                <div className={styles.statTileValue}>{s.value}</div>
              </div>
            ))}
          </div>

          {tickets.some(t => t.priority === "urgent" && t.status === "open") && (
            <div className={styles.warnBanner}>
              <AlertTriangle size={14} />
              <span><strong>{tickets.filter(t => t.priority === "urgent" && t.status === "open").length} urgent ticket(s)</strong> are open and require immediate attention.</span>
            </div>
          )}
        </div>

        <div className={styles.body}>

          <div className={styles.listPane}>
            <div className={styles.listHeaderRow}>
              <span className={styles.listHeaderId}>ID</span>
              <span className={styles.listHeaderSubject}>Subject / Requester</span>
              <span className={styles.listHeaderStatus}>Status</span>
            </div>
            {filtered.length === 0 && (
              <div className={styles.emptyList}>
                <LifeBuoy size={26} style={{ opacity: 0.3, display: "block", margin: "0 auto 8px" }} />
                No tickets match the current filter.
              </div>
            )}
            {filtered.map(t => (
              <button key={t.id} onClick={() => setSelectedId(t.id)} className={`${styles.listRow} ${selectedId === t.id ? styles.listRowActive : ""}`}>
                <span className={styles.rowId}>{t.ticketNo}</span>
                <span className={styles.rowMain}>
                  <div className={styles.rowSubject}>{t.subject}</div>
                  <div className={styles.rowMeta}>{t.requester.name} • {t.queue}</div>
                </span>
                <span className={styles.rowBadges}>
                  <StatusBadge s={t.status} />
                  <PriorityBadge p={t.priority} />
                </span>
              </button>
            ))}
          </div>

          {selected ? (
            <div className={styles.detailPane}>
              <div className={styles.detailHeader}>
                <div className={styles.detailTopRow}>
                  <div className={styles.badgeRow}>
                    <span className={styles.ticketNoChip}>{selected.ticketNo}</span>
                    <StatusBadge s={selected.status} />
                    <PriorityBadge p={selected.priority} />
                    <span className={styles.queueChip}>
                      <span className={styles.queueDot} style={{ background: QUEUE_COLOR[selected.queue] }} />
                      {selected.queue} queue
                    </span>
                  </div>
                  <div className={styles.detailActions}>
                    <button className={styles.escalateBtn} onClick={() => handleStatusChange(selected.id, "escalated")}>
                      <ArrowUpRight size={12} />Escalate
                    </button>
                    <button className={styles.resolveBtn} onClick={() => handleStatusChange(selected.id, "resolved")}>
                      <CheckCircle size={12} />Resolve
                    </button>
                    <button className={styles.closeBtn} onClick={() => handleStatusChange(selected.id, "closed")} title="Close Ticket">
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <h3 className={styles.detailTitle}>{selected.subject}</h3>
                <div className={styles.detailMetaRow}>
                  <span className={styles.detailMetaItem}><Users size={12} /> Requester: <strong>{selected.requester.name}</strong></span>
                  <span className={styles.detailMetaItem}><Clock size={12} /> {fmtDate(selected.createdAt)}</span>
                  {selected.assignee && <span className={styles.detailMetaItem}><UserCog size={12} /> Assignee: <strong>{selected.assignee.name}</strong></span>}
                </div>

                {selected.description && <div className={styles.descBlock}>{selected.description}</div>}
              </div>

              <div className={styles.tabs}>
                {(["timeline", "internal", "files"] as ActiveTab[]).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} className={`${styles.tabBtn} ${activeTab === t ? styles.tabBtnActive : ""}`}>
                    {t === "timeline" ? <MessageSquare size={12} /> : t === "internal" ? <Lock size={12} /> : <Paperclip size={12} />}
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                    {t === "internal" && selected.messages.filter(m => m.isInternal).length > 0 &&
                      <span className={styles.tabBadge}>{selected.messages.filter(m => m.isInternal).length}</span>}
                  </button>
                ))}
              </div>

              <div className={styles.messages}>
                {activeTab === "timeline" && (
                  selected.messages.filter(m => !m.isInternal).length === 0
                    ? <div className={styles.emptyMsg}>
                        <MessageSquare size={26} style={{ opacity: 0.3, display: "block", margin: "0 auto 8px" }} />
                        No messages yet. Send the first reply below.
                      </div>
                    : selected.messages.filter(m => !m.isInternal).map((m) => {
                      const isStaff = m.from.role === "super_admin" || m.from.role === "principal" || m.from.role === "staff";
                      return (
                        <div key={m.id} className={`${styles.msgRow} ${isStaff ? styles.msgRowStaff : ""}`}>
                          <Avatar name={m.from.name} />
                          <div className={styles.msgBubbleWrap}>
                            <div className={styles.msgHead}>
                              <span className={styles.msgAuthor}>{m.from.name}</span>
                              <span className={styles.msgTime}>{fmtDate(m.createdAt)}</span>
                            </div>
                            <div className={`${styles.msgBubble} ${isStaff ? styles.msgBubbleStaff : ""}`}>{m.body}</div>
                          </div>
                        </div>
                      );
                    })
                )}

                {activeTab === "internal" && (
                  selected.messages.filter(m => m.isInternal).length === 0
                    ? <div className={styles.internalEmpty}><Lock size={14} /> Internal notes are visible only to staff. None added yet.</div>
                    : selected.messages.filter(m => m.isInternal).map(m => (
                      <div key={m.id} className={styles.internalNote}>
                        <div className={styles.internalNoteHead}><Lock size={11} />{m.from.name} · {fmtDate(m.createdAt)}</div>
                        <div className={styles.internalNoteBody}>{m.body}</div>
                      </div>
                    ))
                )}

                {activeTab === "files" && (
                  <div className={styles.filesEmpty}>
                    <Paperclip size={26} style={{ opacity: 0.3, display: "block", margin: "0 auto 8px" }} />
                    No files attached to this ticket.
                    <br />
                    <button onClick={() => showMsg("File upload coming soon.")}>Attach File</button>
                  </div>
                )}
              </div>

              <div className={styles.composerWrap}>
                <div className={`${styles.composerBox} ${isInternal ? styles.composerBoxInternal : ""}`}>
                  <textarea
                    className={styles.composerTextarea}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder={isInternal ? "Add an internal note..." : "Type your reply to the requester..."}
                  />
                  <div className={styles.composerFooter}>
                    <div className={styles.composerLeft}>
                      <label className={`${styles.internalToggle} ${isInternal ? styles.internalToggleActive : ""}`}>
                        <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                        <Lock size={12} />Internal note
                      </label>
                      <span className={styles.composerDivider} />
                      <button className={styles.composerIconBtn} onClick={() => setShowKb(true)}><BookOpen size={12} />KB Template</button>
                      <button className={styles.composerIconBtn} onClick={() => showMsg("File attach coming soon.")}><Paperclip size={12} />Attach</button>
                    </div>
                    <div className={styles.composerRight}>
                      <select className={styles.statusSelect} value={nextStatus} onChange={e => setNextStatus(e.target.value as TicketStatus)}>
                        <option value="open">Keep Open</option>
                        <option value="in_progress">Mark In Progress</option>
                        <option value="resolved">Mark Resolved</option>
                        <option value="closed">Close</option>
                      </select>
                      <button className={styles.sendBtn} onClick={handleSendReply} disabled={loading || !replyText.trim()}>
                        <Send size={13} />{loading ? "Sending…" : "Send Reply"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.emptyDetail}>
              <LifeBuoy size={40} style={{ opacity: 0.2 }} />
              <p>Select a ticket to view its details</p>
            </div>
          )}
        </div>
      </div>

      {/* ── KB Templates Modal ──────────────────────────────────────────── */}
      {showKb && (
        <div className={styles.modalBackdrop} onClick={() => setShowKb(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}><BookOpen size={16} />Knowledge Base Templates</h3>
              <button className={styles.modalCloseBtn} onClick={() => setShowKb(false)}><X size={18} /></button>
            </div>
            {KB_TEMPLATES.map((t, i) => (
              <div key={i} className={styles.kbItem} onClick={() => { setReplyText(t.replace("#TICKET_NO", selected?.ticketNo ?? "")); setShowKb(false); }}>
                {t}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── New Ticket Modal ────────────────────────────────────────────── */}
      {showNewModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowNewModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}><Plus size={16} />New Support Ticket</h3>
              <button className={styles.modalCloseBtn} onClick={() => setShowNewModal(false)}><X size={18} /></button>
            </div>
            <div className={styles.formField}>
              <label>Subject *</label>
              <input className={styles.formInput} value={nSubject} onChange={e => setNSubject(e.target.value)} placeholder="Brief description of the issue" />
            </div>
            <div className={styles.formField}>
              <label>Description</label>
              <textarea className={styles.formTextarea} value={nDesc} onChange={e => setNDesc(e.target.value)} placeholder="Provide more details..." />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formField} style={{ flex: 1 }}>
                <label>Queue</label>
                <select className={styles.formSelect} value={nQueue} onChange={e => setNQueue(e.target.value as Queue)}>
                  {queues.map(q => <option key={q} value={q}>{q.charAt(0).toUpperCase() + q.slice(1)}</option>)}
                </select>
              </div>
              <div className={styles.formField} style={{ flex: 1 }}>
                <label>Priority</label>
                <select className={styles.formSelect} value={nPriority} onChange={e => setNPriority(e.target.value as TicketPriority)}>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.modalBtnPrimary} onClick={handleCreateTicket} disabled={loading}>
                <Plus size={14} />{loading ? "Creating…" : "Create Ticket"}
              </button>
              <button className={styles.modalBtnCancel} onClick={() => setShowNewModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
