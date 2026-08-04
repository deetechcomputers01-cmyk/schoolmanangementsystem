"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check, CheckCircle2, XCircle, LayoutGrid, FileCheck2, Hourglass,
  Search, ChevronDown, Download,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import styles from "./ApprovalWorkflowsScreen.module.css";

export type StepDecision = "pending" | "approved" | "rejected";
export type RequestStatus = "pending" | "approved" | "rejected";
export type Scope = "queue" | "mine" | "all";

export interface Step {
  id: string;
  order: number;
  approverRole: string | null;
  approverId: string | null;
  decision: StepDecision;
  reason: string | null;
  decidedAt: string | null;
}
export interface Requester { id: string; name: string; email: string; role: string }
export interface ApprovalRequestRow {
  id: string;
  type: string;
  title: string;
  status: RequestStatus;
  currentStepIndex: number;
  steps: Step[];
  requester: Requester;
  createdAt: string;
  updatedAt: string;
}

const TABS: { key: Scope; label: string }[] = [
  { key: "queue", label: "Review Queue" },
  { key: "mine",  label: "My Requests" },
];

export function stepLabel(step: Step) {
  return step.approverRole ? `${step.approverRole.replace("_", " ")} approval` : "Approver review";
}

export function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export function relTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function isThisMonth(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function exportCsv(rows: ApprovalRequestRow[]) {
  const headers = ["Title", "Type", "Requester", "Status", "Step", "Submitted"];
  const csvRows = [
    headers.join(","),
    ...rows.map((r) => [
      `"${r.title.replace(/"/g, '""')}"`, r.type, `"${r.requester.name}"`, r.status,
      `${r.currentStepIndex + 1}/${r.steps.length}`, new Date(r.createdAt).toISOString().slice(0, 10),
    ].join(",")),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "approval-requests.csv"; a.click();
  URL.revokeObjectURL(url);
}

export function ApprovalWorkflowsContent({ isAdmin }: { isAdmin: boolean }) {
  const tabs = isAdmin ? [...TABS, { key: "all" as Scope, label: "All Requests" }] : TABS;
  const [tab, setTab] = useState<Scope>("queue");
  const [requests, setRequests] = useState<ApprovalRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deciding, setDeciding] = useState(false);
  const [reason, setReason] = useState("");
  const { showToast } = useToast();

  const [queueCount, setQueueCount] = useState(0);
  const [summary, setSummary] = useState<ApprovalRequestRow[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    setSelectedId(null);
    fetch(`/api/approvals?scope=${tab}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [tab]);

  // KPI data: the review queue count is always fetched (regardless of active tab), and a
  // broader summary list (all requests for admins, own requests for everyone else) drives
  // the "Total Active" / "Approved" / "Rejected" tiles.
  useEffect(() => {
    fetch(`/api/approvals?scope=queue`)
      .then((r) => r.ok ? r.json() : [])
      .then((rows: ApprovalRequestRow[]) => setQueueCount(rows.length))
      .catch(() => setQueueCount(0));
    fetch(`/api/approvals?scope=${isAdmin ? "all" : "mine"}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setSummary)
      .catch(() => setSummary([]));
  }, [isAdmin, tab]);

  const totalActive = summary.filter((r) => r.status === "pending").length;
  const approvedMTD = summary.filter((r) => r.status === "approved" && isThisMonth(r.updatedAt)).length;
  const rejectedMTD = summary.filter((r) => r.status === "rejected" && isThisMonth(r.updatedAt)).length;

  const uniqueTypes = useMemo(() => Array.from(new Set(requests.map((r) => r.type))).sort(), [requests]);

  const filteredRequests = useMemo(() => requests.filter((r) =>
    (statusFilter === "" || r.status === statusFilter) &&
    (typeFilter === "" || r.type === typeFilter) &&
    (search === "" || r.title.toLowerCase().includes(search.toLowerCase()) || r.requester.name.toLowerCase().includes(search.toLowerCase()))
  ), [requests, statusFilter, typeFilter, search]);

  const selected = requests.find((r) => r.id === selectedId) ?? null;

  async function decide(decision: "approved" | "rejected") {
    if (!selected) return;
    setDeciding(true);
    try {
      const res = await fetch(`/api/approvals/${selected.id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason: reason.trim() || undefined }),
      });
      if (res.ok) {
        showToast(decision === "approved" ? "Request approved" : "Request rejected", decision === "approved" ? "success" : "info");
        setRequests((prev) => prev.filter((r) => r.id !== selected.id));
        setSelectedId(null);
        setReason("");
      } else {
        const err = await res.json().catch(() => null);
        showToast(err?.error ?? "Failed to record decision", "error");
      }
    } finally {
      setDeciding(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Approval Workflows</h1>
          <p className={styles.subtitle}>Review pending requests from Expenses, Scholarships, and other modules, and keep decisions accountable.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnOutline} onClick={() => exportCsv(filteredRequests)} disabled={filteredRequests.length === 0}>
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCardAccent}`}>
          <div className={styles.statTop}>
            <span className={`${styles.statLabel} ${styles.statLabelAccent}`}>Pending My Review</span>
            <Hourglass size={18} className={styles.statIconAccent} />
          </div>
          <div className={styles.statValueRow}><span className={styles.statValue}>{queueCount}</span></div>
          <span className={styles.statSub}>Requires your immediate action</span>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Total Active</span>
            <FileCheck2 size={18} className={styles.statIcon} />
          </div>
          <div className={styles.statValueRow}><span className={styles.statValue}>{totalActive}</span></div>
          <span className={styles.statSub}>In progress {isAdmin ? "across departments" : "on your requests"}</span>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={`${styles.statLabel} ${styles.statLabelSuccess}`}>Approved (MTD)</span>
            <CheckCircle2 size={18} className={styles.statIconSuccess} />
          </div>
          <div className={styles.statValueRow}><span className={styles.statValue}>{approvedMTD}</span></div>
          <span className={styles.statSub}>Requests finalized this month</span>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={`${styles.statLabel} ${styles.statLabelError}`}>Rejected (MTD)</span>
            <XCircle size={18} className={styles.statIconError} />
          </div>
          <div className={styles.statValueRow}><span className={styles.statValue}>{rejectedMTD}</span></div>
          <span className={styles.statSub}>Denied applications</span>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.tablePanel}>
          <div className={styles.tabBar}>
            {tabs.map((t) => (
              <button key={t.key} className={`${styles.tabBtn} ${tab === t.key ? styles.tabBtnActive : ""}`} onClick={() => setTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          <div className={styles.filterBar}>
            <div className={styles.searchWrap}>
              <Search size={13} className={styles.searchIcon} />
              <input className={styles.searchInput} placeholder="Search requests…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div className={styles.selectWrap}>
                <select className={styles.select} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="">All Types</option>
                  {uniqueTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={12} className={styles.selectChevron} />
              </div>
              <div className={styles.selectWrap}>
                <select className={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <ChevronDown size={12} className={styles.selectChevron} />
              </div>
              <span className={styles.filterCount}>Showing {filteredRequests.length} of {requests.length}</span>
            </div>
          </div>

          <div className={styles.tableWrap}>
            {loading ? (
              <div className={styles.emptyState}><p className={styles.emptyText}>Loading…</p></div>
            ) : filteredRequests.length === 0 ? (
              <div className={styles.emptyState}>
                <LayoutGrid size={36} className={styles.emptyIcon} />
                <p className={styles.emptyText}>
                  {requests.length === 0
                    ? (tab === "queue" ? "Nothing is waiting on your review." : tab === "mine" ? "You haven't submitted any requests." : "No approval requests yet.")
                    : "No requests match your filters."}
                </p>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Request Information</th>
                    <th>Requester</th>
                    <th>Current Status</th>
                    <th className={styles.right}>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((r) => {
                    const isCurrentForMe = tab === "queue" && r.status === "pending";
                    return (
                      <tr
                        key={r.id}
                        className={`${styles.dataRow} ${isCurrentForMe ? styles.dataRowCurrent : ""} ${r.id === selectedId ? styles.dataRowSelected : ""}`}
                        onClick={() => setSelectedId(r.id)}
                      >
                        <td>
                          <span className={styles.reqTitle}>{r.title}</span>
                          <span className={styles.reqType}>{r.type}</span>
                        </td>
                        <td>
                          <div className={styles.requesterCell}>
                            <div className={styles.avatar}>{initials(r.requester.name)}</div>
                            <span>{r.requester.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${r.status === "approved" ? styles.badgeApproved : r.status === "rejected" ? styles.badgeRejected : styles.badgePending}`}>
                            {r.status === "pending" ? "Pending Review" : r.status}
                          </span>
                        </td>
                        <td className={`${styles.right} ${styles.tdMuted}`}>{relTime(r.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <aside className={styles.detailPanel}>
          <div className={styles.detailPanelHead}>
            <div className={styles.detailPanelHeadTop}>
              <span className={styles.detailPanelTitle}>Approval Trail</span>
              {selected && <span className={styles.appRef}>{selected.type.toUpperCase()} · {selected.id.slice(0, 8)}</span>}
            </div>
            {selected && <div className={styles.detailReqTitle}>{selected.title}</div>}
          </div>

          {selected ? (
            <div className={styles.detailBody}>
              <div className={styles.requesterRow}>Submitted by {selected.requester.name}</div>

              <div className={styles.stepsSection}>
                {selected.steps.map((step, i) => {
                  const isCurrent = i === selected.currentStepIndex && selected.status === "pending";
                  const isDone = step.decision !== "pending";
                  const isFuture = !isDone && !isCurrent;
                  return (
                    <div className={styles.step} key={step.id}>
                      <div className={styles.stepConnector}>
                        <div className={isDone ? styles.stepDotDone : isCurrent ? styles.stepDotCurrent : styles.stepDotFuture}>
                          {isDone ? <Check size={12} color="#ffffff" /> : isCurrent ? <span className={styles.stepPulse} /> : null}
                        </div>
                        {i < selected.steps.length - 1 && <div className={styles.stepLine} />}
                      </div>
                      <div className={`${styles.stepMeta} ${isFuture ? styles.stepMetaFuture : ""}`}>
                        <div className={styles.stepStatusRow}>
                          <span className={`${styles.stepStatus} ${isCurrent ? styles.stepStatusCurrent : ""}`}>
                            {stepLabel(step)}
                          </span>
                          {isCurrent && <span className={styles.stepBadgeCurrent}>CURRENT</span>}
                          {step.decidedAt && <span className={styles.stepDate}>{new Date(step.decidedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>}
                        </div>
                        <div className={styles.stepLabel}>
                          {step.decision === "pending" ? (isCurrent ? "Pending your decision" : "Not reached yet") : step.decision === "approved" ? "Approved" : "Rejected"}
                        </div>
                        {step.reason && <div className={styles.stepReasonBox}>&ldquo;{step.reason}&rdquo;</div>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selected.status === "pending" && (
                <>
                  <textarea
                    className={styles.reasonInput}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Optional note for your decision…"
                  />
                  <div className={styles.detailActions}>
                    <button className={styles.btnApprove} disabled={deciding} onClick={() => decide("approved")}>
                      Approve Request
                    </button>
                    <button className={styles.btnReject} disabled={deciding} onClick={() => decide("rejected")}>
                      Reject
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className={styles.noSelection}>
              <LayoutGrid size={28} className={styles.emptyIcon} />
              <p>Select a request to view its approval trail.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
