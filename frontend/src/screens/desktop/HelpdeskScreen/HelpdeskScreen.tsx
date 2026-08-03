"use client";

import { useState, useCallback } from "react";
import {
  LifeBuoy, Plus, AlertTriangle, Clock, CheckCircle, Users, MessageSquare,
  Filter, ChevronDown, X, Send, Paperclip, Lock, ExternalLink, RefreshCw,
  Tag, UserCog, ArrowUpRight, BookOpen, ChevronRight, Inbox, BarChart2,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";

type TicketStatus   = "open" | "in_progress" | "resolved" | "closed" | "escalated";
type TicketPriority = "urgent" | "high" | "medium" | "low";
type Queue          = "parent" | "teacher" | "it" | "finance" | "maintenance" | "general";
type ActiveTab      = "timeline" | "internal" | "files";

interface TicketMessage {
  id: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  from: { id: string; name: string; role: string };
}

interface Ticket {
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

interface Stats {
  total: number;
  byStatus: { status: string; _count: { _all: number } }[];
  byPriority: { priority: string; _count: { _all: number } }[];
  byQueue: { queue: string; _count: { _all: number } }[];
}

interface Props {
  initialTickets: Ticket[];
  initialStats:   Stats;
}

const PRIORITY_COLOR: Record<TicketPriority, { bg: string; text: string; label: string }> = {
  urgent: { bg: "#ffdad6", text: "#93000a",  label: "Urgent"  },
  high:   { bg: "#ffddb7", text: "#653e00",  label: "High"    },
  medium: { bg: "#c1e9fb", text: "#244c5a",  label: "Medium"  },
  low:    { bg: "#c9ecc4", text: "#314d31",  label: "Low"     },
};

const STATUS_COLOR: Record<TicketStatus, { bg: string; text: string; label: string }> = {
  open:        { bg: "#c1e9fb", text: "#244c5a", label: "Open"        },
  in_progress: { bg: "#ffddb7", text: "#653e00", label: "In Progress" },
  resolved:    { bg: "#c9ecc4", text: "#314d31", label: "Resolved"    },
  closed:      { bg: "#e0e9f2", text: "#41484b", label: "Closed"      },
  escalated:   { bg: "#ffdad6", text: "#93000a", label: "Escalated"   },
};

const QUEUE_COLOR: Record<Queue, string> = {
  parent:      "#244c5a",
  teacher:     "#314d31",
  it:          "#653e00",
  finance:     "#41484b",
  maintenance: "#93000a",
  general:     "#71787c",
};

const KB_TEMPLATES = [
  "Thank you for contacting ScholarSphere support. We have received your request (#TICKET_NO) and will respond within 24 hours.",
  "This issue has been escalated to the relevant department. You will receive an update within 2 business days.",
  "Your issue has been resolved. Please let us know if you need further assistance. Reply to this message to reopen.",
  "We need additional information to process your request. Please provide the following details: [specify]",
  "Your request has been forwarded to the Finance department. They will contact you within 1 business day.",
];

function PriorityBadge({ p }: { p: TicketPriority }) {
  const c = PRIORITY_COLOR[p];
  return <span style={{ background: c.bg, color: c.text, padding: "2px 8px", borderRadius: 999, fontSize: "var(--text-xs)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>{c.label}</span>;
}

function StatusBadge({ s }: { s: TicketStatus }) {
  const c = STATUS_COLOR[s];
  return <span style={{ background: c.bg, color: c.text, padding: "2px 8px", borderRadius: 999, fontSize: "var(--text-xs)", fontWeight: 700 }}>{c.label}</span>;
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "#244c5a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function HelpdeskScreen({ initialTickets, initialStats }: Props) {
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

  const countBy = (key: string, val: string) => stats.byStatus?.find((s: any) => s[key] === val)?._count._all ?? stats.byStatus?.find((s: any) => s.status === val)?._count._all ?? 0;

  const openCount    = (stats.byStatus ?? []).find(s => s.status === "open")?._count._all ?? 0;
  const urgentCount  = (stats.byPriority ?? []).find(p => p.priority === "urgent")?._count._all ?? 0;
  const resolvedCount= (stats.byStatus ?? []).find(s => s.status === "resolved")?._count._all ?? 0;

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

  const border = "1px solid #D8DDD8";
  const cardBg = "#ffffff";
  const text   = "#141d23";
  const muted  = "#41484b";
  const panelBg = "#f5faff";

  const queues: Queue[] = ["parent", "teacher", "it", "finance", "maintenance", "general"];

  return (
    <div style={{ display: "flex", height: "100%", fontFamily: "Inter, sans-serif", fontSize: "var(--text-sm)" }}>

      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <aside style={{ width: 210, flexShrink: 0, background: "#e6eff8", borderRight: border, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <div style={{ padding: "12px 10px 8px" }}>
          <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>VIEWS</p>
          {([
            { id: "all",    label: "All Tickets", count: tickets.length },
            { id: "urgent", label: "Urgent",       count: urgentCount },
          ] as const).map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{
              display: "flex", justifyContent: "space-between", width: "100%", padding: "7px 10px", borderRadius: 6,
              border: "none", cursor: "pointer", fontSize: "var(--text-xs)", fontWeight: view === v.id ? 700 : 500, marginBottom: 2,
              background: view === v.id ? "#c9ecc4" : "transparent",
              color: view === v.id ? "#314d31" : muted,
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {v.id === "urgent" ? <AlertTriangle size={13} /> : <Inbox size={13} />}
                {v.label}
              </span>
              <span style={{ fontSize: "var(--text-xs)" }}>{v.count}</span>
            </button>
          ))}
        </div>

        <div style={{ padding: "8px 10px", borderTop: border }}>
          <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>QUEUES</p>
          <button onClick={() => setQueueFilter("")} style={{
            display: "flex", justifyContent: "space-between", width: "100%", padding: "7px 10px", borderRadius: 6,
            border: "none", cursor: "pointer", fontSize: "var(--text-xs)", fontWeight: queueFilter === "" ? 700 : 400, marginBottom: 2,
            background: queueFilter === "" ? "#c9ecc4" : "transparent",
            color: queueFilter === "" ? "#314d31" : muted,
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Users size={12} />All Queues</span>
            <span>{tickets.length}</span>
          </button>
          {queues.map(q => (
            <button key={q} onClick={() => setQueueFilter(q === queueFilter ? "" : q)} style={{
              display: "flex", justifyContent: "space-between", width: "100%", padding: "6px 10px", borderRadius: 6,
              border: "none", cursor: "pointer", fontSize: "var(--text-xs)", fontWeight: queueFilter === q ? 700 : 400, marginBottom: 2,
              background: queueFilter === q ? "#c9ecc4" : "transparent",
              color: queueFilter === q ? "#314d31" : muted,
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: QUEUE_COLOR[q], display: "inline-block" }} />
                {q.charAt(0).toUpperCase() + q.slice(1)}
              </span>
              <span>{getQueueCount(q)}</span>
            </button>
          ))}
        </div>

        <div style={{ padding: "8px 10px", borderTop: border, marginTop: "auto" }}>
          <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: muted, textTransform: "uppercase", marginBottom: 6 }}>FILTERS</p>
          <div style={{ marginBottom: 6 }}>
            <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: text, display: "block", marginBottom: 2 }}>Priority</label>
            <select value={prioFilter} onChange={e => setPrioFilter(e.target.value as TicketPriority | "")}
              style={{ width: "100%", padding: "4px 6px", border, borderRadius: 4, fontSize: "var(--text-xs)", background: panelBg }}>
              <option value="">All</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: text, display: "block", marginBottom: 2 }}>Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as TicketStatus | "")}
              style={{ width: "100%", padding: "4px 6px", border, borderRadius: 4, fontSize: "var(--text-xs)", background: panelBg }}>
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

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "16px 20px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <LifeBuoy size={22} color="#073543" />
                <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: text, margin: 0 }}>Support Tickets</h1>
              </div>
              <p style={{ color: muted, marginTop: 3, fontSize: "var(--text-xs)" }}>Track and resolve individual issues raised by staff and guardians — each ticket is a two-way conversation through to resolution.</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={refreshTickets} title="Refresh" style={{ padding: "7px 10px", background: "transparent", border, borderRadius: 4, cursor: "pointer", color: muted, display: "flex", alignItems: "center" }}>
                <RefreshCw size={14} />
              </button>
              <button onClick={() => setShowNewModal(true)} style={{ padding: "8px 16px", background: "#073543", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600, fontSize: "var(--text-xs)", display: "flex", alignItems: "center", gap: 6 }}>
                <Plus size={15} /> New Ticket
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 8, marginBottom: 12 }}>
            {[
              { icon: <Inbox size={14} />,          label: "Open",           value: openCount,     color: "#244c5a" },
              { icon: <AlertTriangle size={14} />,   label: "Urgent",         value: urgentCount,   color: "#93000a" },
              { icon: <ArrowUpRight size={14} />,    label: "Escalated",      value: (stats.byStatus ?? []).find(s => s.status === "escalated")?._count._all ?? 0, color: "#B64B4B" },
              { icon: <CheckCircle size={14} />,     label: "Resolved Today", value: resolvedCount, color: "#486647" },
              { icon: <Users size={14} />,           label: "Parent Queue",   value: getQueueCount("parent") },
              { icon: <Users size={14} />,           label: "Teacher Queue",  value: getQueueCount("teacher") },
              { icon: <Tag size={14} />,             label: "IT Queue",       value: getQueueCount("it") },
              { icon: <BarChart2 size={14} />,       label: "In Progress",    value: (stats.byStatus ?? []).find(s => s.status === "in_progress")?._count._all ?? 0 },
            ].map((s, i) => (
              <div key={i} style={{ background: cardBg, border, borderRadius: 6, padding: "8px 10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4, color: s.color ?? muted }}>{s.icon}</div>
                <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: s.color ?? text }}>{s.value}</div>
                <div style={{ fontSize: "var(--text-xs)", color: muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* SLA breach warning */}
          {tickets.some(t => t.priority === "urgent" && t.status === "open") && (
            <div style={{ background: "#ffdad6", border: "1px solid #B64B4B", borderRadius: 6, padding: "8px 14px", marginBottom: 8, fontSize: "var(--text-xs)", color: "#93000a", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={14} />
              <strong>{tickets.filter(t => t.priority === "urgent" && t.status === "open").length} urgent ticket(s)</strong> are open and require immediate attention.
            </div>
          )}
        </div>

        {/* Body: ticket list + detail */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>

          {/* Ticket list */}
          <div style={{ width: 380, flexShrink: 0, borderRight: border, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-xs)" }}>
              <thead style={{ position: "sticky", top: 0, background: panelBg, zIndex: 1 }}>
                <tr>
                  {["ID", "Subject / Requester", "Status", "Priority"].map(h => (
                    <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: 600, color: muted, borderBottom: border }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: 32, textAlign: "center", color: muted }}>
                    <LifeBuoy size={28} style={{ opacity: 0.3, display: "block", margin: "0 auto 8px" }} />
                    No tickets match the current filter.
                  </td></tr>
                )}
                {filtered.map(t => (
                  <tr key={t.id} onClick={() => setSelectedId(t.id)} style={{
                    borderBottom: border, cursor: "pointer",
                    background: selectedId === t.id ? "#e6eff8" : "transparent",
                  }}>
                    <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: "var(--text-xs)", fontWeight: 700, color: "#073543", whiteSpace: "nowrap" }}>{t.ticketNo}</td>
                    <td style={{ padding: "9px 12px", maxWidth: 160 }}>
                      <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "var(--text-xs)" }}>{t.subject}</div>
                      <div style={{ fontSize: "var(--text-xs)", color: muted }}>{t.requester.name} · <span style={{ textTransform: "capitalize" }}>{t.queue}</span></div>
                    </td>
                    <td style={{ padding: "9px 12px" }}><StatusBadge s={t.status} /></td>
                    <td style={{ padding: "9px 12px" }}><PriorityBadge p={t.priority} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ticket detail pane */}
          {selected ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

              {/* Ticket header */}
              <div style={{ padding: "12px 20px", borderBottom: border, flexShrink: 0, background: panelBg }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 5 }}>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#073543", fontSize: "var(--text-xs)" }}>{selected.ticketNo}</span>
                      <StatusBadge s={selected.status} />
                      <PriorityBadge p={selected.priority} />
                      <span style={{ fontSize: "var(--text-xs)", background: "#e6eff8", color: muted, padding: "2px 7px", borderRadius: 999, textTransform: "capitalize" }}>{selected.queue} queue</span>
                    </div>
                    <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: text, margin: "0 0 4px" }}>{selected.subject}</h3>
                    <div style={{ fontSize: "var(--text-xs)", color: muted }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                        <Users size={12} />
                        {selected.requester.name}
                        <span style={{ color: "#D8DDD8" }}>|</span>
                        <Clock size={12} />
                        {fmtDate(selected.createdAt)}
                        {selected.assignee && <><span style={{ color: "#D8DDD8" }}>|</span><UserCog size={12} />Assigned: {selected.assignee.name}</>}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => handleStatusChange(selected.id, "escalated")}
                      style={{ padding: "5px 12px", border: "1px solid #B64B4B", color: "#B64B4B", background: "transparent", borderRadius: 4, cursor: "pointer", fontSize: "var(--text-xs)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                      <ArrowUpRight size={12} />Escalate
                    </button>
                    <button onClick={() => handleStatusChange(selected.id, "resolved")}
                      style={{ padding: "5px 12px", background: "#073543", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "var(--text-xs)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle size={12} />Resolve
                    </button>
                    <button onClick={() => handleStatusChange(selected.id, "closed")}
                      style={{ padding: "5px 12px", background: "transparent", color: muted, border, borderRadius: 4, cursor: "pointer", fontSize: "var(--text-xs)" }}>
                      <X size={12} style={{ display: "inline" }} />
                    </button>
                  </div>
                </div>

                {/* Description (if any) */}
                {selected.description && (
                  <div style={{ marginTop: 8, padding: "8px 12px", background: "#e6eff8", borderRadius: 6, fontSize: "var(--text-xs)", color: text, borderLeft: "3px solid #073543" }}>
                    {selected.description}
                  </div>
                )}
              </div>

              {/* Sub-tabs */}
              <div style={{ display: "flex", borderBottom: border, padding: "0 20px", flexShrink: 0 }}>
                {(["timeline", "internal", "files"] as ActiveTab[]).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} style={{
                    padding: "8px 14px", border: "none", background: "transparent", cursor: "pointer", fontSize: "var(--text-xs)", fontWeight: 600, textTransform: "capitalize",
                    color: activeTab === t ? "#073543" : muted,
                    borderBottom: activeTab === t ? "2px solid #073543" : "2px solid transparent",
                    display: "flex", alignItems: "center", gap: 5,
                  }}>
                    {t === "timeline" ? <MessageSquare size={12} /> : t === "internal" ? <Lock size={12} /> : <Paperclip size={12} />}
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                    {t === "internal" && selected.messages.filter(m => m.isInternal).length > 0 &&
                      <span style={{ background: "#ffddb7", color: "#653e00", borderRadius: 999, padding: "0 5px", fontSize: "var(--text-xs)" }}>{selected.messages.filter(m => m.isInternal).length}</span>}
                  </button>
                ))}
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                {activeTab === "timeline" && (
                  selected.messages.filter(m => !m.isInternal).length === 0
                    ? <div style={{ textAlign: "center", color: muted, paddingTop: 32 }}>
                        <MessageSquare size={28} style={{ opacity: 0.3, display: "block", margin: "0 auto 8px" }} />
                        No messages yet. Send the first reply below.
                      </div>
                    : selected.messages.filter(m => !m.isInternal).map((m) => {
                      const isStaff = m.from.role === "super_admin" || m.from.role === "principal" || m.from.role === "staff";
                      return (
                        <div key={m.id} style={{ display: "flex", gap: 10, flexDirection: isStaff ? "row-reverse" : "row" }}>
                          <Avatar name={m.from.name} />
                          <div style={{ maxWidth: "68%" }}>
                            <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 4, flexDirection: isStaff ? "row-reverse" : "row" }}>
                              <span style={{ fontWeight: 600, fontSize: "var(--text-xs)" }}>{m.from.name}</span>
                              <span style={{ fontSize: "var(--text-xs)", color: muted }}>{fmtDate(m.createdAt)}</span>
                            </div>
                            <div style={{ background: isStaff ? "#073543" : "#f0f4f8", color: isStaff ? "#fff" : text, padding: "10px 14px", borderRadius: 8, fontSize: "var(--text-xs)", lineHeight: 1.6 }}>
                              {m.body}
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}

                {activeTab === "internal" && (
                  selected.messages.filter(m => m.isInternal).length === 0
                    ? <div style={{ padding: 16, background: "#fffde7", borderRadius: 6, border: "1px solid #E8A957", color: "#653e00", fontSize: "var(--text-xs)", display: "flex", alignItems: "center", gap: 8 }}>
                        <Lock size={14} /> Internal notes are visible only to staff. None added yet.
                      </div>
                    : selected.messages.filter(m => m.isInternal).map(m => (
                      <div key={m.id} style={{ padding: 12, background: "#fffde7", borderRadius: 6, border: "1px solid #E8A957" }}>
                        <div style={{ fontSize: "var(--text-xs)", color: "#653e00", marginBottom: 4 }}><Lock size={11} style={{ display: "inline", marginRight: 4 }} />{m.from.name} · {fmtDate(m.createdAt)}</div>
                        <div style={{ fontSize: "var(--text-xs)", color: text }}>{m.body}</div>
                      </div>
                    ))
                )}

                {activeTab === "files" && (
                  <div style={{ color: muted, fontSize: "var(--text-xs)", textAlign: "center", paddingTop: 32 }}>
                    <Paperclip size={28} style={{ opacity: 0.3, display: "block", margin: "0 auto 8px" }} />
                    No files attached to this ticket.
                    <br />
                    <button onClick={() => showMsg("File upload coming soon.")} style={{ marginTop: 10, padding: "6px 14px", border, borderRadius: 4, cursor: "pointer", fontSize: "var(--text-xs)" }}>
                      Attach File
                    </button>
                  </div>
                )}
              </div>

              {/* Reply composer */}
              <div style={{ borderTop: border, padding: "12px 20px", flexShrink: 0, background: panelBg }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "var(--text-xs)", cursor: "pointer", color: isInternal ? "#653e00" : muted }}>
                    <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                    <Lock size={12} />Internal note (staff only)
                  </label>
                </div>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={isInternal ? "Add an internal note..." : "Type your reply to the requester..."}
                  style={{
                    width: "100%", padding: "10px 12px", border: isInternal ? "1px solid #E8A957" : border,
                    borderRadius: 6, fontSize: "var(--text-xs)", resize: "none", minHeight: 76, fontFamily: "Inter, sans-serif",
                    boxSizing: "border-box", background: isInternal ? "#fffde7" : "#fff",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setShowKb(true)} style={{ padding: "5px 10px", border, borderRadius: 4, background: "transparent", color: muted, cursor: "pointer", fontSize: "var(--text-xs)", display: "flex", alignItems: "center", gap: 4 }}>
                      <BookOpen size={12} />KB Template
                    </button>
                    <button onClick={() => showMsg("File attach coming soon.")} style={{ padding: "5px 10px", border, borderRadius: 4, background: "transparent", color: muted, cursor: "pointer", fontSize: "var(--text-xs)", display: "flex", alignItems: "center", gap: 4 }}>
                      <Paperclip size={12} />Attach
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <select value={nextStatus} onChange={e => setNextStatus(e.target.value as TicketStatus)}
                      style={{ padding: "5px 8px", border, borderRadius: 4, fontSize: "var(--text-xs)", background: "#f0f4f8" }}>
                      <option value="open">Keep Open</option>
                      <option value="in_progress">Mark In Progress</option>
                      <option value="resolved">Mark Resolved</option>
                      <option value="closed">Close</option>
                    </select>
                    <button onClick={handleSendReply} disabled={loading || !replyText.trim()}
                      style={{ padding: "7px 20px", background: loading ? "#ccc" : "#073543", color: "#fff", border: "none", borderRadius: 4, cursor: loading ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "var(--text-xs)", display: "flex", alignItems: "center", gap: 6 }}>
                      <Send size={13} />{loading ? "Sending…" : "Send Reply"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: muted, flexDirection: "column", gap: 8 }}>
              <LifeBuoy size={40} style={{ opacity: 0.2 }} />
              <p>Select a ticket to view its details</p>
            </div>
          )}
        </div>
      </div>

      {/* ── KB Templates Modal ──────────────────────────────────────────────── */}
      {showKb && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(23,32,38,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: cardBg, borderRadius: 8, padding: 24, width: 500, maxWidth: "90vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, color: text, margin: 0, display: "flex", alignItems: "center", gap: 7 }}><BookOpen size={16} />Knowledge Base Templates</h3>
              <button onClick={() => setShowKb(false)} style={{ background: "none", border: "none", cursor: "pointer", color: muted }}><X size={18} /></button>
            </div>
            {KB_TEMPLATES.map((t, i) => (
              <div key={i} onClick={() => { setReplyText(t.replace("#TICKET_NO", selected?.ticketNo ?? "")); setShowKb(false); }}
                style={{ padding: "10px 12px", border, borderRadius: 6, marginBottom: 8, cursor: "pointer", fontSize: "var(--text-xs)", background: "#f5faff", transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#e6eff8")}
                onMouseLeave={e => (e.currentTarget.style.background = "#f5faff")}>
                {t}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── New Ticket Modal ────────────────────────────────────────────────── */}
      {showNewModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(23,32,38,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: cardBg, borderRadius: 8, padding: 28, width: 480, maxWidth: "90vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, color: text, margin: 0, display: "flex", alignItems: "center", gap: 7 }}><Plus size={16} />New Support Ticket</h3>
              <button onClick={() => setShowNewModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: muted }}><X size={18} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: 4 }}>Subject *</label>
                <input value={nSubject} onChange={e => setNSubject(e.target.value)} placeholder="Brief description of the issue"
                  style={{ width: "100%", padding: "8px 10px", border, borderRadius: 4, fontSize: "var(--text-xs)", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: 4 }}>Description</label>
                <textarea value={nDesc} onChange={e => setNDesc(e.target.value)} placeholder="Provide more details..."
                  style={{ width: "100%", padding: "8px 10px", border, borderRadius: 4, fontSize: "var(--text-xs)", resize: "vertical", minHeight: 72, fontFamily: "Inter", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: 4 }}>Queue</label>
                  <select value={nQueue} onChange={e => setNQueue(e.target.value as Queue)}
                    style={{ width: "100%", padding: "8px 10px", border, borderRadius: 4, fontSize: "var(--text-xs)" }}>
                    <option value="parent">Parent</option>
                    <option value="teacher">Teacher</option>
                    <option value="it">IT</option>
                    <option value="finance">Finance</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: 4 }}>Priority</label>
                  <select value={nPriority} onChange={e => setNPriority(e.target.value as TicketPriority)}
                    style={{ width: "100%", padding: "8px 10px", border, borderRadius: 4, fontSize: "var(--text-xs)" }}>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button onClick={handleCreateTicket} disabled={loading}
                style={{ flex: 1, padding: "10px 0", background: loading ? "#ccc" : "#073543", color: "#fff", border: "none", borderRadius: 4, cursor: loading ? "not-allowed" : "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Plus size={14} />{loading ? "Creating…" : "Create Ticket"}
              </button>
              <button onClick={() => setShowNewModal(false)}
                style={{ flex: 1, padding: "10px 0", background: "transparent", color: text, border, borderRadius: 4, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
