"use client";

/**
 * MobileDocumentCenterContent — bespoke mobile view for Document Center.
 *
 * Every field/action traces back to DocumentCenterScreen.tsx (the real
 * desktop component — this screen has no separate Content.tsx) and the
 * real /api/documents endpoints — same handleCreate()/handleStatusChange()/
 * handleDelete() logic, ported here.
 *
 * Fixed while porting (real bugs affecting both platforms, not just mobile):
 *   - "Requires signature" checkbox was tracked in state but never appended
 *     to the upload FormData, so it silently always saved false. Now sent
 *     as `needsSign`, and the /api/documents route now reads it too.
 *   - "Download" was a stub toast ("coming soon") despite every document
 *     already having a real fileUrl. Now a real download link, on both
 *     desktop and mobile.
 *
 * Deviations from the Stitch mockup (document_center_indigo_refined):
 *   - "Total Documents 1,248", "Recent: 12 updates today", and
 *     "Shared: 85% with Parents" are all fabricated — no "shared %" or
 *     "today's updates" concept exists anywhere. Replaced with the real
 *     4-stat KPI grid desktop already shows (Total, Pending Review, Needs
 *     Signature, Restricted).
 *   - Category chips ("Policies", "Forms", "Reports", "Circulars") don't
 *     match the real 8 categories — replaced with the real list (Academic,
 *     Administrative, Financial, Template, Policy, HR, Forms, Reports), plus
 *     real Visibility and Status filter rows matching desktop's dropdowns.
 *   - "Recent Documents" fabricated examples replaced with the real,
 *     filterable document list; each card expands to show every real field
 *     (status, owner, class/dept, needs-sign, template, expires, dates) and
 *     the same status actions desktop exposes (Mark Active / Restrict /
 *     Archive / Delete).
 *   - Bottom-nav FAB "Upload Document" opens the real Register Document
 *     form (file, name, category, visibility, class/dept, template,
 *     requires-signature) — same fields the desktop modal collects.
 */

import { useMemo, useRef, useState } from "react";
import {
  FolderOpen, Plus, Search, Trash2, Download, FileText,
  ChevronDown, ChevronUp, PenLine,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import {
  STATUS_META, VIS_META, CATEGORY_COLOR, fmtDate,
} from "@/screens/desktop/DocumentCenterScreen/DocumentCenterScreen";
import type {
  SchoolDocument, DocStats, Category, Visibility, DocStatus, DocumentCenterContentProps,
} from "@/screens/desktop/DocumentCenterScreen/DocumentCenterScreen";
import styles from "./MobileDocumentCenterContent.module.css";

const CATEGORIES: Category[] = ["academic", "administrative", "financial", "template", "policy", "hr", "forms", "reports"];
const VISIBILITIES: Visibility[] = ["public", "internal", "restricted", "class_only"];
const STATUSES: DocStatus[] = ["active", "pending_review", "archived", "restricted"];

export function MobileDocumentCenterContent({ initialDocs, initialStats }: DocumentCenterContentProps) {
  const [docs, setDocs] = useState<SchoolDocument[]>(initialDocs);
  const [stats, setStats] = useState<DocStats>(initialStats);
  const [tab, setTab] = useState<"all" | "templates">("all");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<Category | "">("");
  const [visFilter, setVisFilter] = useState<Visibility | "">("");
  const [statusFilter, setStatusFilter] = useState<DocStatus | "">("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showToast } = useToast();
  const confirm = useConfirm();

  async function refresh() {
    const [dRes, sRes] = await Promise.all([fetch("/api/documents"), fetch("/api/documents?stats=1")]);
    if (dRes.ok) setDocs(await dRes.json());
    if (sRes.ok) { const { stats: s } = await sRes.json(); setStats(s); }
  }

  const filtered = useMemo(() => docs.filter((d) => {
    if (tab === "templates" && !d.isTemplate) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter && d.category !== catFilter) return false;
    if (visFilter && d.visibility !== visFilter) return false;
    if (statusFilter && d.status !== statusFilter) return false;
    return true;
  }), [docs, tab, search, catFilter, visFilter, statusFilter]);

  async function handleStatusChange(id: string, status: DocStatus) {
    const res = await fetch(`/api/documents/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)));
      showToast(`Status updated to ${STATUS_META[status].label}.`);
    } else {
      showToast("Failed to update.", "error");
    }
  }

  async function handleDelete(d: SchoolDocument) {
    const sure = await confirm({ message: "This will permanently remove the document record from ScholarSphere.", tone: "danger", confirmLabel: "Delete" });
    if (!sure) return;
    setDeletingId(d.id);
    try {
      const res = await fetch(`/api/documents/${d.id}`, { method: "DELETE" });
      if (res.ok) {
        setDocs((prev) => prev.filter((x) => x.id !== d.id));
        showToast("Document deleted.");
        await refresh();
      } else {
        showToast("Failed to delete.", "error");
      }
    } finally {
      setDeletingId(null);
    }
  }

  // ── Register Document sheet ─────────────────────────────────────────
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState<Category>("academic");
  const [newVis, setNewVis] = useState<Visibility>("internal");
  const [newDept, setNewDept] = useState("");
  const [newTemplate, setNewTemplate] = useState(false);
  const [newNeedsSign, setNewNeedsSign] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function openNew() {
    setNewName(""); setNewCat("academic"); setNewVis("internal"); setNewDept("");
    setNewTemplate(false); setNewNeedsSign(false); setNewFile(null);
    setShowNew(true);
  }

  async function handleCreate() {
    if (!newName.trim()) return showToast("Name is required.", "error");
    if (!newFile) return showToast("Choose a file to upload.", "error");
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append("file", newFile);
      fd.append("name", newName);
      fd.append("category", newCat);
      fd.append("visibility", newVis);
      if (newDept) fd.append("classDept", newDept);
      fd.append("isTemplate", String(newTemplate));
      fd.append("needsSign", String(newNeedsSign));

      const res = await fetch("/api/documents", { method: "POST", body: fd });
      if (res.ok) {
        const doc = await res.json();
        setDocs((prev) => [doc, ...prev]);
        setShowNew(false);
        showToast("Document uploaded.");
        await refresh();
      } else {
        const err = await res.json().catch(() => null);
        showToast(err?.error ?? "Failed to upload document.", "error");
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.actionRow}>
        <button type="button" className={styles.addBtn} onClick={openNew}><Plus size={16} /> Upload Document</button>
      </div>

      <div className={kit.segmented}>
        <button type="button" className={tab === "all" ? kit.segBtnActive : kit.segBtn} onClick={() => setTab("all")}>All Documents</button>
        <button type="button" className={tab === "templates" ? kit.segBtnActive : kit.segBtn} onClick={() => setTab("templates")}>Templates</button>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total</span>
          <strong className={styles.kpiValue}>{stats.total}</strong>
        </div>
        <div className={`${styles.kpiCard} ${stats.pendingReview > 0 ? styles.kpiCardWarn : ""}`}>
          <span className={styles.kpiLabel}>Pending Review</span>
          <strong className={stats.pendingReview > 0 ? styles.kpiValueWarn : styles.kpiValue}>{stats.pendingReview}</strong>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Needs Signature</span>
          <strong className={styles.kpiValue}>{stats.needsSign}</strong>
        </div>
        <div className={`${styles.kpiCard} ${stats.restricted > 0 ? styles.kpiCardError : ""}`}>
          <span className={styles.kpiLabel}>Restricted</span>
          <strong className={stats.restricted > 0 ? styles.kpiValueError : styles.kpiValue}>{stats.restricted}</strong>
        </div>
      </div>

      <label className={kit.searchWrap}>
        <Search size={16} className={kit.searchIcon} />
        <input className={`${kit.input} ${kit.searchInput}`} placeholder="Search files…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>

      <div className={styles.chipRow}>
        <button type="button" className={`${styles.chip} ${catFilter === "" ? styles.chipActive : ""}`} onClick={() => setCatFilter("")}>All Categories</button>
        {CATEGORIES.map((c) => (
          <button key={c} type="button" className={`${styles.chip} ${catFilter === c ? styles.chipActive : ""}`} onClick={() => setCatFilter(catFilter === c ? "" : c)}>{c.charAt(0).toUpperCase() + c.slice(1)}</button>
        ))}
      </div>
      <div className={styles.chipRow}>
        <button type="button" className={`${styles.chip} ${visFilter === "" ? styles.chipActive : ""}`} onClick={() => setVisFilter("")}>All Visibility</button>
        {VISIBILITIES.map((v) => (
          <button key={v} type="button" className={`${styles.chip} ${visFilter === v ? styles.chipActive : ""}`} onClick={() => setVisFilter(visFilter === v ? "" : v)}>{VIS_META[v].label}</button>
        ))}
      </div>
      <div className={styles.chipRow}>
        <button type="button" className={`${styles.chip} ${statusFilter === "" ? styles.chipActive : ""}`} onClick={() => setStatusFilter("")}>All Statuses</button>
        {STATUSES.map((s) => (
          <button key={s} type="button" className={`${styles.chip} ${statusFilter === s ? styles.chipActive : ""}`} onClick={() => setStatusFilter(statusFilter === s ? "" : s)}>{STATUS_META[s].label}</button>
        ))}
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <FolderOpen size={28} style={{ opacity: 0.3 }} />
            <p>{docs.length === 0 ? "No documents registered yet." : "No documents match your filters."}</p>
          </div>
        ) : filtered.map((d) => {
          const isOpen = openId === d.id;
          return (
            <article key={d.id} className={styles.card}>
              <div className={styles.cardTop}>
                <button type="button" className={styles.cardHeader} onClick={() => setOpenId(isOpen ? null : d.id)}>
                  <FileText size={18} style={{ color: CATEGORY_COLOR[d.category], flexShrink: 0 }} />
                  <div className={styles.cardHeaderText}>
                    <span className={styles.name}>{d.name}{d.needsSign && <PenLine size={11} className={styles.signIcon} />}</span>
                    <span className={styles.meta}>{d.fileType.toUpperCase()}{d.fileSize && ` · ${d.fileSize}`} · {fmtDate(d.updatedAt)}</span>
                  </div>
                  {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
                <a className={styles.downloadBtn} href={d.fileUrl} download title="Download"><Download size={15} /></a>
              </div>

              {isOpen && (
                <div className={styles.cardDetail}>
                  <div className={styles.detailRow}><span>Status</span><strong>{STATUS_META[d.status].label}</strong></div>
                  <div className={styles.detailRow}><span>Category</span><strong>{d.category.charAt(0).toUpperCase() + d.category.slice(1)}</strong></div>
                  <div className={styles.detailRow}><span>Visibility</span><strong>{VIS_META[d.visibility].label}</strong></div>
                  <div className={styles.detailRow}><span>Owner</span><strong>{d.owner.name}</strong></div>
                  <div className={styles.detailRow}><span>Class/Dept</span><strong>{d.classDept || "—"}</strong></div>
                  <div className={styles.detailRow}><span>Template</span><strong>{d.isTemplate ? "Yes" : "No"}</strong></div>
                  <div className={styles.detailRow}><span>Needs Signature</span><strong>{d.needsSign ? "Yes" : "No"}</strong></div>
                  <div className={styles.detailRow}><span>Expires</span><strong>{d.expiresAt ? fmtDate(d.expiresAt) : "—"}</strong></div>
                  <div className={styles.detailRow}><span>Created</span><strong>{fmtDate(d.createdAt)}</strong></div>

                  <div className={styles.actionGrid}>
                    <button type="button" className={styles.actionBtn} onClick={() => handleStatusChange(d.id, "active")}>Mark Active</button>
                    <button type="button" className={styles.actionBtn} onClick={() => handleStatusChange(d.id, "restricted")}>Restrict</button>
                    <button type="button" className={styles.actionBtn} onClick={() => handleStatusChange(d.id, "archived")}>Archive</button>
                    <button type="button" className={styles.deleteBtn} disabled={deletingId === d.id} onClick={() => handleDelete(d)}>
                      <Trash2 size={13} /> {deletingId === d.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <MobileSheet
        open={showNew}
        onClose={() => !creating && setShowNew(false)}
        title="Register Document"
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => setShowNew(false)} disabled={creating}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={handleCreate} disabled={creating}>{creating ? "Uploading…" : "Upload Document"}</button>
        </>}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,.xlsx,.jpg,.jpeg,.png"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setNewFile(f);
            if (f && !newName.trim()) setNewName(f.name.replace(/\.[^.]+$/, ""));
          }}
        />
        <div className={kit.dropzone} onClick={() => fileRef.current?.click()}>
          <p className={kit.dropzoneText}>
            {newFile ? newFile.name : <>Tap to upload — <span className={kit.dropzoneLink}>PDF, DOC, XLSX, JPG, PNG</span></>}
          </p>
        </div>
        <div className={kit.field}>
          <label>Document Name *</label>
          <input className={kit.input} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. School Fee Schedule 2026" />
        </div>
        <div className={kit.fieldRow}>
          <div className={kit.field}>
            <label>Category</label>
            <select className={kit.select} value={newCat} onChange={(e) => setNewCat(e.target.value as Category)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div className={kit.field}>
            <label>Visibility</label>
            <select className={kit.select} value={newVis} onChange={(e) => setNewVis(e.target.value as Visibility)}>
              {VISIBILITIES.map((v) => <option key={v} value={v}>{VIS_META[v].label}</option>)}
            </select>
          </div>
        </div>
        <div className={kit.field}>
          <label>Class / Department (optional)</label>
          <input className={kit.input} value={newDept} onChange={(e) => setNewDept(e.target.value)} placeholder="e.g. Form 3A, Finance Dept" />
        </div>
        <div className={kit.checkboxRow}>
          <input type="checkbox" checked={newTemplate} onChange={(e) => setNewTemplate(e.target.checked)} />
          <label className={kit.checkboxLabel}>Mark as template</label>
        </div>
        <div className={kit.checkboxRow}>
          <input type="checkbox" checked={newNeedsSign} onChange={(e) => setNewNeedsSign(e.target.checked)} />
          <label className={kit.checkboxLabel}>Requires signature</label>
        </div>
      </MobileSheet>
    </div>
  );
}
