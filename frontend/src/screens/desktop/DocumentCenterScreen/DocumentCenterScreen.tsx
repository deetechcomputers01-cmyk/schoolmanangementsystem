"use client";

import { useState } from "react";
import {
  FolderOpen, Plus, Search, Trash2,
  FileText, AlertTriangle, X, Lock, Globe,
  Users, PenLine, Archive, Tag, Download, ChevronDown,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import styles from "./DocumentCenterScreen.module.css";

type DocStatus     = "active" | "pending_review" | "archived" | "restricted";
type Visibility    = "public" | "internal" | "restricted" | "class_only";
type Category      = "academic" | "administrative" | "financial" | "template" | "policy" | "hr" | "forms" | "reports";
type TabFilter      = "all" | "templates";

interface SchoolDocument {
  id: string;
  name: string;
  category: Category;
  fileUrl: string;
  fileSize: string;
  fileType: string;
  visibility: Visibility;
  status: DocStatus;
  classDept?: string | null;
  needsSign: boolean;
  isTemplate: boolean;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; name: string; role: string };
}

interface DocStats {
  total: number;
  pendingReview: number;
  needsSign: number;
  restricted: number;
  archived: number;
}

interface FolderCounts { [k: string]: number }

interface Props {
  initialDocs:    SchoolDocument[];
  initialStats:   DocStats;
  initialFolders: FolderCounts;
}

const STATUS_META: Record<DocStatus, { label: string; pillClass: string }> = {
  active:         { label: "Active",         pillClass: "pillActive" },
  pending_review: { label: "Pending Review", pillClass: "pillPending" },
  archived:       { label: "Archived",       pillClass: "pillArchived" },
  restricted:     { label: "Restricted",     pillClass: "pillRestricted" },
};

const VIS_META: Record<Visibility, { label: string; icon: React.ReactNode }> = {
  public:     { label: "Public",      icon: <Globe size={12} /> },
  internal:   { label: "Internal",    icon: <Users size={12} /> },
  restricted: { label: "Restricted",  icon: <Lock size={12} /> },
  class_only: { label: "Class Only",  icon: <Users size={12} /> },
};

const CATEGORY_COLOR: Record<Category, string> = {
  academic:       "var(--clr-app-info)",
  administrative: "var(--clr-app-muted)",
  financial:      "var(--clr-warning)",
  template:       "var(--clr-success)",
  policy:         "var(--clr-error)",
  hr:             "var(--clr-success)",
  forms:          "var(--clr-app-info)",
  reports:        "var(--clr-app-muted)",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function DocumentCenterScreen({ initialDocs, initialStats }: Props) {
  const [docs, setDocs]             = useState<SchoolDocument[]>(initialDocs);
  const [stats, setStats]           = useState<DocStats>(initialStats);
  const [tab, setTab]               = useState<TabFilter>("all");
  const [search, setSearch]         = useState("");
  const [catFilter, setCatFilter]   = useState<Category | "">("");
  const [visFilter, setVisFilter]   = useState<Visibility | "">("");
  const [statusFilter, setStatusFilter] = useState<DocStatus | "">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew]       = useState(false);
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [loading, setLoading]       = useState(false);
  const [delConfirm, setDelConfirm] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy]     = useState(false);

  const [newName, setNewName]       = useState("");
  const [newCat, setNewCat]         = useState<Category>("academic");
  const [newVis, setNewVis]         = useState<Visibility>("internal");
  const [newDept, setNewDept]       = useState("");
  const [newTemplate, setNewTemplate] = useState(false);
  const [newNeedsSign, setNewNeedsSign] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);

  const selected = docs.find(d => d.id === selectedId);

  function showMsg(msg: string, type: "ok" | "error" = "ok") {
    showToast(msg, type === "error" ? "error" : "success");
  }

  async function refresh() {
    const [dRes, sRes] = await Promise.all([
      fetch("/api/documents"),
      fetch("/api/documents?stats=1"),
    ]);
    if (dRes.ok) setDocs(await dRes.json());
    if (sRes.ok) {
      const { stats: s } = await sRes.json();
      setStats(s);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return showMsg("Name is required.", "error");
    if (!newFile) return showMsg("Choose a file to upload.", "error");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", newFile);
      fd.append("name", newName);
      fd.append("category", newCat);
      fd.append("visibility", newVis);
      if (newDept) fd.append("classDept", newDept);
      fd.append("isTemplate", String(newTemplate));

      const res = await fetch("/api/documents", { method: "POST", body: fd });
      if (res.ok) {
        const doc = await res.json();
        setDocs(prev => [doc, ...prev]);
        setSelectedId(doc.id);
        setShowNew(false);
        setNewName(""); setNewDept(""); setNewTemplate(false); setNewNeedsSign(false); setNewFile(null);
        showMsg("Document uploaded.");
        await refresh();
      } else {
        const err = await res.json().catch(() => null);
        showMsg(err?.error ?? "Failed to upload document.", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id: string, status: DocStatus) {
    const res = await fetch(`/api/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setDocs(prev => prev.map(d => d.id === id ? { ...d, ...updated } : d));
      showMsg(`Status updated to ${STATUS_META[status].label}.`);
    } else {
      showMsg("Failed to update.", "error");
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDocs(prev => prev.filter(d => d.id !== id));
      if (selectedId === id) setSelectedId(null);
      showMsg("Document deleted.");
      await refresh();
    } else {
      showMsg("Failed to delete.", "error");
    }
    setDelConfirm(null);
  }

  async function bulkArchive() {
    if (checkedIds.size === 0) return;
    setBulkBusy(true);
    try {
      const results = await Promise.allSettled(
        Array.from(checkedIds).map((id) =>
          fetch(`/api/documents/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "archived" }),
          })
        )
      );
      const succeeded = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;
      const failed = results.length - succeeded;
      showMsg(`${succeeded} document${succeeded !== 1 ? "s" : ""} archived${failed ? `, ${failed} failed` : ""}.`, failed ? "error" : "ok");
      setCheckedIds(new Set());
      await refresh();
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkDelete() {
    if (checkedIds.size === 0) return;
    const confirmed = await confirm({
      message: `Delete ${checkedIds.size} selected document${checkedIds.size !== 1 ? "s" : ""}? This permanently removes the records from ScholarSphere.`,
      tone: "danger",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;
    setBulkBusy(true);
    try {
      const results = await Promise.allSettled(
        Array.from(checkedIds).map((id) => fetch(`/api/documents/${id}`, { method: "DELETE" }).then((r) => ({ id, ok: r.ok })))
      );
      const succeededIds = results.filter((r): r is PromiseFulfilledResult<{ id: string; ok: boolean }> => r.status === "fulfilled" && r.value.ok).map((r) => r.value.id);
      const failed = results.length - succeededIds.length;
      setDocs((prev) => prev.filter((d) => !succeededIds.includes(d.id)));
      if (selectedId && succeededIds.includes(selectedId)) setSelectedId(null);
      showMsg(`${succeededIds.length} document${succeededIds.length !== 1 ? "s" : ""} deleted${failed ? `, ${failed} failed` : ""}.`, failed ? "error" : "ok");
      setCheckedIds(new Set());
      await refresh();
    } finally {
      setBulkBusy(false);
    }
  }

  const categories: Category[] = ["academic", "administrative", "financial", "template", "policy", "hr", "forms", "reports"];

  const filtered = docs.filter(d => {
    if (tab === "templates" && !d.isTemplate) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter && d.category !== catFilter) return false;
    if (visFilter && d.visibility !== visFilter) return false;
    if (statusFilter && d.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Document Center</h1>
          <p className={styles.subtitle}>Centralized repository for institutional files and records.</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowNew(true)}>
          <Plus size={15} /> Upload Document
        </button>
      </div>

      {/* Tab bar */}
      <div className={styles.tabBar}>
        <button className={`${styles.tabBtn} ${tab === "all" ? styles.tabBtnActive : ""}`} onClick={() => setTab("all")}>All Documents</button>
        <button className={`${styles.tabBtn} ${tab === "templates" ? styles.tabBtnActive : ""}`} onClick={() => setTab("templates")}>Templates</button>
      </div>

      {/* KPI cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Documents</span>
          <span className={styles.statValue}>{stats.total}</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardAmber}`}>
          <span className={styles.statLabel}>Pending Review</span>
          <span className={`${styles.statValue} ${styles.statValueAmber}`}>{stats.pendingReview}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Needs Signature</span>
          <span className={styles.statValue}>{stats.needsSign}</span>
        </div>
        <div className={`${styles.statCard} ${stats.restricted > 0 ? styles.statCardError : ""}`}>
          <span className={styles.statLabel}>Restricted</span>
          <span className={`${styles.statValue} ${stats.restricted > 0 ? styles.statValueError : ""}`}>{stats.restricted}</span>
        </div>
      </div>

      {/* Filter row (flat, no card) */}
      <div className={styles.filterRow}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input className={styles.searchInput} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files…" />
        </div>
        <div className={styles.selectWrap}>
          <select className={styles.select} value={catFilter} onChange={e => setCatFilter(e.target.value as Category | "")}>
            <option value="">Category: All</option>
            {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <ChevronDown size={14} className={styles.selectChevron} />
        </div>
        <div className={styles.selectWrap}>
          <select className={styles.select} value={visFilter} onChange={e => setVisFilter(e.target.value as Visibility | "")}>
            <option value="">Visibility: All</option>
            <option value="public">Public</option>
            <option value="internal">Internal</option>
            <option value="restricted">Restricted</option>
            <option value="class_only">Class Only</option>
          </select>
          <ChevronDown size={14} className={styles.selectChevron} />
        </div>
        <div className={styles.selectWrap}>
          <select className={styles.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value as DocStatus | "")}>
            <option value="">Status: All</option>
            <option value="active">Active</option>
            <option value="pending_review">Pending Review</option>
            <option value="archived">Archived</option>
            <option value="restricted">Restricted</option>
          </select>
          <ChevronDown size={14} className={styles.selectChevron} />
        </div>
        <span className={styles.countLabel}>{filtered.length} document(s)</span>
      </div>

      {checkedIds.size > 0 && (
        <div className={styles.filterRow} style={{ background: "var(--clr-success-bg)", border: "1px solid var(--clr-success-border)", borderRadius: "var(--radius-sm)", padding: "10px 16px" }}>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--clr-success)" }}>{checkedIds.size} selected</span>
          <button className={`${styles.actionBtn} ${styles.actionBtnArchive}`} onClick={bulkArchive} disabled={bulkBusy}>
            <Archive size={13} style={{ marginRight: 4 }} />Archive
          </button>
          <button className={`${styles.actionBtn} ${styles.actionBtnRestrict}`} onClick={bulkDelete} disabled={bulkBusy}>
            <Trash2 size={13} style={{ marginRight: 4 }} />{bulkBusy ? "Working…" : "Delete"}
          </button>
          <button className={styles.actionBtn} onClick={() => setCheckedIds(new Set())}>Clear</button>
        </div>
      )}

      {/* Document table */}
      <div className={styles.tableCard}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <FolderOpen size={32} className={styles.emptyIcon} />
            <p>{docs.length === 0 ? "No documents registered yet." : "No documents match your filters."}</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && filtered.every(d => checkedIds.has(d.id))}
                      onChange={() => {
                        const next = new Set(checkedIds);
                        if (filtered.every(d => checkedIds.has(d.id))) filtered.forEach(d => next.delete(d.id));
                        else filtered.forEach(d => next.add(d.id));
                        setCheckedIds(next);
                      }}
                    />
                  </th>
                  <th>Document Name</th><th>Category</th><th>Visibility</th><th>Status</th><th>Owner</th><th>Class/Dept</th><th>Updated</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id} onClick={() => setSelectedId(d.id === selectedId ? null : d.id)}
                    className={`${styles.row} ${selectedId === d.id ? styles.rowActive : ""}`}>
                    <td className={styles.td} onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={checkedIds.has(d.id)}
                        onChange={() => {
                          const next = new Set(checkedIds);
                          if (next.has(d.id)) next.delete(d.id); else next.add(d.id);
                          setCheckedIds(next);
                        }}
                      />
                    </td>
                    <td className={styles.td}>
                      <div className={styles.nameCell}>
                        <FileText size={16} style={{ color: CATEGORY_COLOR[d.category], flexShrink: 0 }} />
                        <div>
                          <div className={styles.nameText}>{d.name}</div>
                          <div className={styles.nameSub}>
                            {d.fileType.toUpperCase()} {d.fileSize && `· ${d.fileSize}`}
                            {d.isTemplate && <span className={styles.templateTag}>TEMPLATE</span>}
                            {d.needsSign && <PenLine size={11} style={{ color: "var(--clr-warning)" }} />}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.catCell} style={{ color: CATEGORY_COLOR[d.category] }}>
                        <span className={styles.catDot} style={{ background: CATEGORY_COLOR[d.category] }} />
                        {d.category}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.visCell}>
                        {VIS_META[d.visibility]?.icon}{VIS_META[d.visibility]?.label}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span className={`${styles.pill} ${styles[STATUS_META[d.status].pillClass]}`}>{STATUS_META[d.status].label}</span>
                    </td>
                    <td className={`${styles.td} ${styles.tdMuted}`}>{d.owner.name}</td>
                    <td className={`${styles.td} ${styles.tdMuted}`}>{d.classDept || "—"}</td>
                    <td className={`${styles.td} ${styles.tdMuted}`}>{fmtDate(d.updatedAt)}</td>
                    <td className={styles.td}>
                      <div className={styles.rowActions}>
                        <button className={`${styles.iconBtn} ${styles.iconBtnAccent}`} onClick={e => { e.stopPropagation(); showMsg("Download coming soon."); }} title="Download"><Download size={14} /></button>
                        <button className={`${styles.iconBtn} ${styles.iconBtnWarn}`} onClick={e => { e.stopPropagation(); handleStatusChange(d.id, d.status === "archived" ? "active" : "archived"); }} title={d.status === "archived" ? "Restore" : "Archive"}><Archive size={14} /></button>
                        <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={e => { e.stopPropagation(); setDelConfirm(d.id); }} title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className={styles.paginationBar}>
            <span>Showing {filtered.length} of {docs.length} entries</span>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className={styles.detailPanel}>
          <div className={styles.detailHeader}>
            <div className={styles.detailHeaderLeft}>
              <FileText size={16} style={{ color: CATEGORY_COLOR[selected.category] }} />
              <h3 className={styles.detailTitle}>{selected.name}</h3>
            </div>
            <button className={styles.detailClose} onClick={() => setSelectedId(null)}><X size={18} /></button>
          </div>
          <div className={styles.detailGrid}>
            {[
              { label: "Status",     value: <span className={`${styles.pill} ${styles[STATUS_META[selected.status].pillClass]}`}>{STATUS_META[selected.status].label}</span> },
              { label: "Category",   value: <span style={{ textTransform: "capitalize" }}>{selected.category}</span> },
              { label: "Visibility", value: VIS_META[selected.visibility]?.label },
              { label: "File Type",  value: selected.fileType.toUpperCase() },
              { label: "File Size",  value: selected.fileSize || "—" },
              { label: "Owner",      value: selected.owner.name },
              { label: "Needs Sign", value: selected.needsSign ? "Yes" : "No" },
              { label: "Template",   value: selected.isTemplate ? "Yes" : "No" },
              { label: "Class/Dept", value: selected.classDept || "—" },
              { label: "Expires",    value: selected.expiresAt ? fmtDate(selected.expiresAt) : "—" },
              { label: "Created",    value: fmtDate(selected.createdAt) },
              { label: "Updated",    value: fmtDate(selected.updatedAt) },
            ].map((row, i) => (
              <div key={i} className={styles.detailCell}>
                <div className={styles.detailLabel}>{row.label}</div>
                <div className={styles.detailValue}>{row.value}</div>
              </div>
            ))}
          </div>
          <div className={styles.detailActions}>
            <button className={`${styles.actionBtn} ${styles.actionBtnActive}`} onClick={() => handleStatusChange(selected.id, "active")}>Mark Active</button>
            <button className={`${styles.actionBtn} ${styles.actionBtnRestrict}`} onClick={() => handleStatusChange(selected.id, "restricted")}>Restrict</button>
            <button className={`${styles.actionBtn} ${styles.actionBtnArchive}`} onClick={() => handleStatusChange(selected.id, "archived")}>Archive</button>
            <button className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => setDelConfirm(selected.id)}>Delete</button>
          </div>
        </div>
      )}

      {/* New document modal */}
      {showNew && (
        <div className={styles.modalOverlay} onClick={() => setShowNew(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}><Plus size={16} />Register Document</h3>
              <button className={styles.modalClose} onClick={() => setShowNew(false)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>File *</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xlsx,.jpg,.jpeg,.png"
                  onChange={e => {
                    const f = e.target.files?.[0] ?? null;
                    setNewFile(f);
                    if (f && !newName.trim()) setNewName(f.name.replace(/\.[^.]+$/, ""));
                  }}
                  style={{ width: "100%", fontSize: "var(--text-sm)" }}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Document Name *</label>
                <input className={styles.formInput} value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. School Fee Schedule 2026" />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category</label>
                  <select className={styles.formSelect} value={newCat} onChange={e => setNewCat(e.target.value as Category)}>
                    {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Visibility</label>
                  <select className={styles.formSelect} value={newVis} onChange={e => setNewVis(e.target.value as Visibility)}>
                    <option value="internal">Internal</option>
                    <option value="public">Public</option>
                    <option value="restricted">Restricted</option>
                    <option value="class_only">Class Only</option>
                  </select>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Class / Department (optional)</label>
                <input className={styles.formInput} value={newDept} onChange={e => setNewDept(e.target.value)} placeholder="e.g. Form 3A, Finance Dept" />
              </div>
              <div className={styles.checkboxRow}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={newTemplate} onChange={e => setNewTemplate(e.target.checked)} />
                  Mark as template
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={newNeedsSign} onChange={e => setNewNeedsSign(e.target.checked)} />
                  Requires signature
                </label>
              </div>
              <div className={styles.hintBox}>
                <Tag size={13} />Document will be created with status &quot;Pending Review&quot; until approved.
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setShowNew(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleCreate} disabled={loading}>
                <Plus size={14} />{loading ? "Creating…" : "Create Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {delConfirm && (
        <div className={styles.modalOverlay} onClick={() => setDelConfirm(null)}>
          <div className={`${styles.modal} ${styles.modalDanger}`} onClick={(e) => e.stopPropagation()} style={{ width: 380 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}><AlertTriangle size={18} color="var(--clr-error)" />Delete Document?</h3>
              <button className={styles.modalClose} onClick={() => setDelConfirm(null)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.warnText}>This will permanently remove the document record from ScholarSphere.</p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setDelConfirm(null)}>Cancel</button>
              <button className={styles.btnDanger} onClick={() => handleDelete(delConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
