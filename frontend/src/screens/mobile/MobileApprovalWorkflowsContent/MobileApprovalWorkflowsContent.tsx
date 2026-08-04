"use client";

/**
 * MobileApprovalWorkflowsContent — bespoke mobile view for Approval Workflows.
 *
 * Every field/action traces back to ApprovalWorkflowsContent.tsx (the real
 * desktop component) and the real /api/approvals endpoints — same client-side
 * fetch-on-tab-change pattern (GET /api/approvals?scope=queue|mine|all) and
 * decide() handler (POST /api/approvals/:id/decide).
 *
 * The real `ApprovalRequest` model is genuinely generic (type/title/requester/
 * steps), but today the ONLY real producer is Expenses (every new expense
 * auto-creates a request with type "expense", single principal-approval
 * step) — Scholarships/Payroll/etc. do NOT raise approval requests yet. The
 * Stitch mockup's "Teacher Transfer"/"Budget Overrun"/"Curriculum Change"
 * examples are illustrative flavor text on Stitch's part, not real current
 * data — this screen renders `type`/`title` generically from whatever the
 * API actually returns instead of hardcoding those examples, so it stays
 * correct if/when more modules start raising requests.
 *
 * "High/Medium Priority" badges from the mockup have no backing field on
 * `ApprovalRequestRow` — omitted (no severity/priority concept exists on
 * approval requests, only expenses have amounts which aren't in this model).
 */

import { useEffect, useMemo, useState } from "react";
import {
  Hourglass, FileCheck2, CheckCircle2, XCircle, Search, ClipboardList,
  ChevronDown, ChevronUp, Check, X,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import {
  stepLabel, initials, relTime, isThisMonth,
} from "@/screens/desktop/ApprovalWorkflowsScreen/ApprovalWorkflowsContent";
import type {
  ApprovalRequestRow, Scope,
} from "@/screens/desktop/ApprovalWorkflowsScreen/ApprovalWorkflowsContent";
import styles from "./MobileApprovalWorkflowsContent.module.css";

const TABS: { key: Scope; label: string }[] = [
  { key: "queue", label: "Review Queue" },
  { key: "mine", label: "My Requests" },
];

export function MobileApprovalWorkflowsContent({ isAdmin }: { isAdmin: boolean }) {
  const tabs = isAdmin ? [...TABS, { key: "all" as Scope, label: "All Requests" }] : TABS;
  const [tab, setTab] = useState<Scope>("queue");
  const [requests, setRequests] = useState<ApprovalRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [deciding, setDeciding] = useState(false);
  const [reasonMap, setReasonMap] = useState<Record<string, string>>({});
  const { showToast } = useToast();

  const [queueCount, setQueueCount] = useState(0);
  const [summary, setSummary] = useState<ApprovalRequestRow[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    setOpenId(null);
    fetch(`/api/approvals?scope=${tab}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    fetch(`/api/approvals?scope=queue`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: ApprovalRequestRow[]) => setQueueCount(rows.length))
      .catch(() => setQueueCount(0));
    fetch(`/api/approvals?scope=${isAdmin ? "all" : "mine"}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setSummary)
      .catch(() => setSummary([]));
  }, [isAdmin, tab]);

  const totalActive = summary.filter((r) => r.status === "pending").length;
  const approvedMTD = summary.filter((r) => r.status === "approved" && isThisMonth(r.updatedAt)).length;
  const rejectedMTD = summary.filter((r) => r.status === "rejected" && isThisMonth(r.updatedAt)).length;

  const uniqueTypes = useMemo(() => Array.from(new Set(requests.map((r) => r.type))).sort(), [requests]);

  const filtered = useMemo(() => requests.filter((r) =>
    (statusFilter === "" || r.status === statusFilter) &&
    (typeFilter === "" || r.type === typeFilter) &&
    (search === "" || r.title.toLowerCase().includes(search.toLowerCase()) || r.requester.name.toLowerCase().includes(search.toLowerCase()))
  ), [requests, statusFilter, typeFilter, search]);

  async function decide(r: ApprovalRequestRow, decision: "approved" | "rejected") {
    setDeciding(true);
    try {
      const res = await fetch(`/api/approvals/${r.id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason: (reasonMap[r.id] ?? "").trim() || undefined }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast(decision === "approved" ? "Request approved" : "Request rejected");
      setRequests((prev) => prev.filter((x) => x.id !== r.id));
      setOpenId(null);
    } catch {
      showToast("Failed to record decision", "error");
    } finally {
      setDeciding(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${styles.kpiCardAccent}`}>
          <span className={styles.kpiLabel}>Pending My Review</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValue}>{queueCount}</strong><Hourglass size={18} className={styles.kpiIcon} /></div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Active</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValue}>{totalActive}</strong><FileCheck2 size={18} className={styles.kpiIcon} /></div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Approved (MTD)</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValueGood}>{approvedMTD}</strong><CheckCircle2 size={18} className={styles.kpiIconGood} /></div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Rejected (MTD)</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValueBad}>{rejectedMTD}</strong><XCircle size={18} className={styles.kpiIconBad} /></div>
        </div>
      </div>

      <div className={kit.segmented}>
        {tabs.map((t) => (
          <button key={t.key} type="button" className={`${kit.segBtn} ${tab === t.key ? kit.segBtnActive : ""}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      <label className={kit.searchWrap}>
        <Search size={16} className={kit.searchIcon} />
        <input className={`${kit.input} ${kit.searchInput}`} placeholder="Search requests" value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>

      {uniqueTypes.length > 0 && (
        <div className={styles.chipRow}>
          <button type="button" className={`${styles.chip} ${typeFilter === "" ? styles.chipActive : ""}`} onClick={() => setTypeFilter("")}>All Types</button>
          {uniqueTypes.map((t) => (
            <button key={t} type="button" className={`${styles.chip} ${typeFilter === t ? styles.chipActive : ""}`} onClick={() => setTypeFilter(typeFilter === t ? "" : t)}>{t}</button>
          ))}
        </div>
      )}
      <div className={styles.chipRow}>
        {[["", "All Statuses"], ["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"]].map(([v, l]) => (
          <button key={v} type="button" className={`${styles.chip} ${statusFilter === v ? styles.chipActive : ""}`} onClick={() => setStatusFilter(v)}>{l}</button>
        ))}
      </div>

      <div className={styles.list}>
        {loading ? (
          <p className={kit.emptyText}>Loading…</p>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <ClipboardList size={28} style={{ opacity: 0.3 }} />
            <p>
              {requests.length === 0
                ? (tab === "queue" ? "Nothing is waiting on your review." : tab === "mine" ? "You haven't submitted any requests." : "No approval requests yet.")
                : "No requests match your filters."}
            </p>
          </div>
        ) : filtered.map((r) => {
          const isOpen = openId === r.id;
          return (
            <article key={r.id} className={styles.card}>
              <button type="button" className={styles.cardHeader} onClick={() => setOpenId(isOpen ? null : r.id)}>
                <span className={kit.pickAvatar}>{initials(r.requester.name)}</span>
                <div className={styles.cardHeaderText}>
                  <span className={styles.reqTitle}>{r.title}</span>
                  <span className={styles.reqMeta}>{r.type} • {r.requester.name} • {relTime(r.createdAt)}</span>
                </div>
                <span className={`${styles.statusPill} ${styles[`status_${r.status}`]}`}>{r.status === "pending" ? "Pending" : r.status}</span>
                {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {isOpen && (
                <div className={styles.cardDetail}>
                  <div className={styles.stepsSection}>
                    {r.steps.map((step, i) => {
                      const isCurrent = i === r.currentStepIndex && r.status === "pending";
                      const isDone = step.decision !== "pending";
                      return (
                        <div key={step.id} className={styles.stepRow}>
                          <span className={`${styles.stepDot} ${isDone ? styles.stepDotDone : isCurrent ? styles.stepDotCurrent : styles.stepDotFuture}`}>
                            {isDone ? <Check size={11} /> : null}
                          </span>
                          <div className={styles.stepInfo}>
                            <span className={styles.stepLabelText}>{stepLabel(step)}{isCurrent ? " · CURRENT" : ""}</span>
                            <span className={styles.stepStatusText}>
                              {step.decision === "pending" ? (isCurrent ? "Pending your decision" : "Not reached yet") : step.decision === "approved" ? "Approved" : "Rejected"}
                            </span>
                            {step.reason && <span className={styles.stepReason}>&ldquo;{step.reason}&rdquo;</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {r.status === "pending" && (
                    <>
                      <textarea
                        className={kit.textarea}
                        rows={2}
                        placeholder="Optional note for your decision…"
                        value={reasonMap[r.id] ?? ""}
                        onChange={(e) => setReasonMap((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      />
                      <div className={styles.decideRow}>
                        <button type="button" className={styles.approveBtn} disabled={deciding} onClick={() => decide(r, "approved")}>
                          <Check size={14} /> Approve
                        </button>
                        <button type="button" className={styles.rejectBtn} disabled={deciding} onClick={() => decide(r, "rejected")}>
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
