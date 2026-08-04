"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Plus, X, Search, ArrowLeftRight, Camera, ChevronDown, Pencil, Download } from "lucide-react";
import styles from "./AssetsScreen.module.css";

export type AssetStatus = "active" | "maintenance" | "disposed" | "low_stock";

export interface AssetRow {
  id: string; tag: string; name: string; category: string; status: AssetStatus;
  location: string | null; custodianId: string | null; custodianName: string | null;
  quantity: number; value: number | null; imageUrl: string | null; movementCount: number;
}
export interface MovementRow {
  id: string; assetName: string; assetTag: string; type: string; quantity: number;
  note: string | null; actedByName: string; createdAt: string;
}
export interface StaffOption { id: string; name: string }

export interface AssetsContentProps { assets: AssetRow[]; movements: MovementRow[]; staff: StaffOption[] }
type Props = AssetsContentProps;

export const CATEGORIES = ["ICT Equipment", "Furniture", "Lab Equipment", "Library", "Sports", "Kitchen"];
export const STATUS_LABEL: Record<AssetStatus, string> = {
  active: "Active", maintenance: "Maintenance", disposed: "Disposed", low_stock: "Low Stock",
};
const STATUS_BADGE: Record<AssetStatus, string> = {
  active: styles.badgeActive, maintenance: styles.badgeMaintenance, disposed: styles.badgeDisposed, low_stock: styles.badgeAlert,
};

export function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function exportCsv(rows: AssetRow[]) {
  const headers = ["Tag", "Name", "Category", "Status", "Location", "Custodian", "Qty", "Value (GHS)"];
  const csvRows = [
    headers.join(","),
    ...rows.map((a) => [a.tag, a.name, a.category, STATUS_LABEL[a.status], a.location ?? "", a.custodianName ?? "Unassigned", String(a.quantity), a.value !== null ? a.value.toFixed(2) : ""]
      .map((v) => `"${v.replace(/"/g, '""')}"`).join(",")),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "assets.csv"; a.click();
  URL.revokeObjectURL(url);
}

export function AssetsContent({ assets, movements, staff }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"register" | "movements">("register");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  // Add/Edit asset modal
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetRow | null>(null);
  const [aName, setAName] = useState("");
  const [aCategory, setACategory] = useState(CATEGORIES[0]);
  const [aLocation, setALocation] = useState("");
  const [aCustodianId, setACustodianId] = useState("");
  const [aQuantity, setAQuantity] = useState("1");
  const [aValue, setAValue] = useState("");
  const [aImageFile, setAImageFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  // Record movement modal
  const [movementAsset, setMovementAsset] = useState<AssetRow | null>(null);
  const [mType, setMType] = useState<"issue" | "receive">("issue");
  const [mQuantity, setMQuantity] = useState("1");
  const [mNote, setMNote] = useState("");
  const [recording, setRecording] = useState(false);

  const totalAssetCount = useMemo(() => assets.reduce((s, a) => s + a.quantity, 0), [assets]);
  const totalValue = useMemo(() => assets.reduce((s, a) => s + (a.value ?? 0), 0), [assets]);
  const inMaintenance = assets.filter((a) => a.status === "maintenance").length;
  const lowStockOrDisposed = assets.filter((a) => a.status === "low_stock" || a.status === "disposed").length;

  const filtered = useMemo(() => assets.filter((a) =>
    (search === "" || a.name.toLowerCase().includes(search.toLowerCase()) || a.tag.toLowerCase().includes(search.toLowerCase())) &&
    (categoryFilter === "" || a.category === categoryFilter) &&
    (statusFilter === "" || a.status === statusFilter)
  ), [assets, search, categoryFilter, statusFilter]);

  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageAssets = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allOnPageSelected = pageAssets.length > 0 && pageAssets.every((a) => selectedIds.has(a.id));
  function toggleSelectAll() {
    const next = new Set(selectedIds);
    if (allOnPageSelected) pageAssets.forEach((a) => next.delete(a.id));
    else pageAssets.forEach((a) => next.add(a.id));
    setSelectedIds(next);
  }
  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  }

  function openAddModal() {
    setEditingAsset(null);
    setAName(""); setACategory(CATEGORIES[0]); setALocation(""); setACustodianId(""); setAQuantity("1"); setAValue(""); setAImageFile(null);
    setError("");
    setShowAssetModal(true);
  }
  function openEditModal(asset: AssetRow) {
    setEditingAsset(asset);
    setAName(asset.name); setACategory(asset.category); setALocation(asset.location ?? ""); setACustodianId(asset.custodianId ?? "");
    setAQuantity(String(asset.quantity)); setAValue(asset.value !== null ? String(asset.value) : ""); setAImageFile(null);
    setError("");
    setShowAssetModal(true);
  }

  async function submitAsset() {
    if (!aName.trim() || !aCategory) { setError("Name and category are required."); return; }
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("name", aName.trim());
      fd.append("category", aCategory);
      fd.append("location", aLocation.trim());
      fd.append("custodianId", aCustodianId);
      fd.append("quantity", aQuantity);
      if (aValue) fd.append("value", aValue);
      if (aImageFile) fd.append("image", aImageFile);

      const url = editingAsset ? `/api/assets/${editingAsset.id}` : "/api/assets";
      const res = await fetch(url, { method: editingAsset ? "PATCH" : "POST", body: fd });
      if (res.ok) {
        setShowAssetModal(false);
        router.refresh();
      } else {
        const err = await res.json().catch(() => null);
        setError(err?.error?.message ?? err?.message ?? "Failed to save asset.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function bulkSetStatus(status: AssetStatus) {
    if (selectedIds.size === 0) return;
    await Promise.all(Array.from(selectedIds).map((id) =>
      fetch(`/api/assets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
    ));
    setSelectedIds(new Set());
    router.refresh();
  }

  async function submitMovement() {
    if (!movementAsset || !Number(mQuantity)) return;
    setRecording(true);
    try {
      const res = await fetch("/api/assets/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: movementAsset.id, type: mType, quantity: Number(mQuantity), note: mNote.trim() || undefined }),
      });
      if (res.ok) {
        setMovementAsset(null);
        setMQuantity("1"); setMNote("");
        router.refresh();
      }
    } finally {
      setRecording(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Assets Management</h1>
          <p className={styles.subtitle}>Inventory tracking and lifecycle management for school resources.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnPrimary} onClick={openAddModal}><Plus size={15} /> Register Asset</button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Assets</p>
          <div className={styles.statValueRow}><span className={styles.statValue}>{totalAssetCount.toLocaleString()}</span></div>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Value</p>
          <div className={styles.statValueRow}>
            <span className={styles.statValuePrefix}>GHS</span>
            <span className={styles.statValue}>{totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardWarn}`}>
          <p className={styles.statLabel}>In Maintenance</p>
          <div className={styles.statValueRow}><span className={`${styles.statValue} ${styles.statValueWarn}`}>{inMaintenance}</span></div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardError}`}>
          <p className={styles.statLabel}>Low Stock / Disposed</p>
          <div className={styles.statValueRow}><span className={`${styles.statValue} ${styles.statValueError}`}>{lowStockOrDisposed}</span></div>
        </div>
      </div>

      <div className={styles.tabs}>
        {([["register", "Inventory"], ["movements", "Movement Log"]] as const).map(([key, label]) => (
          <button key={key} className={`${styles.tab} ${tab === key ? styles.tabActive : ""}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {tab === "register" && (
        <>
          <div className={styles.filterBar}>
            <div className={styles.searchWrap}>
              <Search size={14} className={styles.searchIcon} />
              <input className={styles.searchInput} placeholder="Search assets by tag, name or location…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className={styles.filterRight}>
              {selectedIds.size > 0 ? (
                <div className={styles.bulkBar}>
                  <span className={styles.bulkCount}>{selectedIds.size} selected</span>
                  <button className={styles.btnOutline} onClick={() => bulkSetStatus("maintenance")}>Mark Maintenance</button>
                  <button className={styles.btnOutline} onClick={() => bulkSetStatus("disposed")}>Mark Disposed</button>
                </div>
              ) : (
                <>
                  <div className={styles.selectWrap}>
                    <select className={styles.select} value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
                      <option value="">All Categories</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={14} className={styles.selectChevron} />
                  </div>
                  <div className={styles.selectWrap}>
                    <select className={styles.select} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                      <option value="">All Statuses</option>
                      {(Object.keys(STATUS_LABEL) as AssetStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                    <ChevronDown size={14} className={styles.selectChevron} />
                  </div>
                  <button className={styles.btnIconOutline} title="Export Data" onClick={() => exportCsv(filtered)} disabled={filtered.length === 0}>
                    <Download size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className={styles.mainCard}>
            {pageAssets.length === 0 ? (
              <div className={styles.emptyState}><Package size={32} className={styles.emptyIcon} /><p>{assets.length === 0 ? "No assets recorded yet." : "No assets match your filters."}</p></div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th><input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAll} /></th>
                      <th>Asset Tag</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Location</th>
                      <th>Custodian</th>
                      <th className={styles.right}>Qty</th>
                      <th className={styles.right}>Value (GHS)</th>
                      <th className={styles.right}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageAssets.map((a) => (
                      <tr key={a.id} className={`${styles.dataRow} ${selectedIds.has(a.id) ? styles.dataRowSelected : ""}`}>
                        <td><input type="checkbox" checked={selectedIds.has(a.id)} onChange={() => toggleSelect(a.id)} /></td>
                        <td className={styles.tagMono}>{a.tag}</td>
                        <td>
                          <div className={styles.assetCell}>
                            {a.imageUrl
                              ? <img src={a.imageUrl} alt="" className={styles.assetThumb} />
                              : <div className={styles.assetThumbPlaceholder}><Package size={14} /></div>}
                            <span className={styles.assetName}>{a.name}</span>
                          </div>
                        </td>
                        <td><span className={styles.categoryPill}>{a.category}</span></td>
                        <td><span className={`${styles.badge} ${STATUS_BADGE[a.status]}`}>{STATUS_LABEL[a.status]}</span></td>
                        <td className={styles.tdMuted}>{a.location ?? "—"}</td>
                        <td>
                          {a.custodianName ? (
                            <div className={styles.custodianCell}>
                              <div className={styles.custodianAvatar}>{initials(a.custodianName)}</div>
                              <span>{a.custodianName}</span>
                            </div>
                          ) : (
                            <span className={styles.unassigned}>Unassigned</span>
                          )}
                        </td>
                        <td className={styles.tdMonoRight}>{a.quantity}</td>
                        <td className={styles.tdMonoRight}>{a.value !== null ? a.value.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}</td>
                        <td className={styles.right}>
                          <div className={styles.rowActions}>
                            <button className={styles.iconBtn} title="Edit asset" onClick={() => openEditModal(a)}><Pencil size={14} /></button>
                            <button className={styles.iconBtn} title="Record stock movement" onClick={() => { setMovementAsset(a); setMType("issue"); }}><ArrowLeftRight size={14} /></button>
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
                <span>Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} entries</span>
                <div className={styles.pageButtons}>
                  <button className={styles.pageBtn} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
                  <button className={styles.pageBtn} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "movements" && (
        <div className={styles.mainCard}>
          {movements.length === 0 ? (
            <div className={styles.emptyState}><ArrowLeftRight size={32} className={styles.emptyIcon} /><p>No stock movement recorded yet.</p></div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th><th>Asset</th><th>Type</th><th className={styles.right}>Qty</th><th>Note</th><th>By</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id} className={styles.dataRow}>
                      <td className={styles.tdMuted}>{new Date(m.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                      <td className={styles.assetName}>{m.assetName} <span className={styles.tdMuted} style={{ fontWeight: 400 }}>({m.assetTag})</span></td>
                      <td style={{ textTransform: "capitalize" }}>{m.type}</td>
                      <td className={styles.tdMonoRight}>{m.quantity}</td>
                      <td className={styles.tdMuted}>{m.note ?? "—"}</td>
                      <td>{m.actedByName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Asset modal */}
      {showAssetModal && (
        <div className={styles.modalOverlay} onClick={() => !saving && setShowAssetModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingAsset ? `Edit ${editingAsset.tag}` : "Register Asset"}</h2>
              <button className={styles.modalClose} onClick={() => setShowAssetModal(false)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              {error && <p className={styles.errorText}>{error}</p>}
              <div className={styles.imagePicker}>
                <div className={styles.imagePickerBox} onClick={() => fileRef.current?.click()}>
                  {aImageFile
                    ? <img src={URL.createObjectURL(aImageFile)} alt="" className={styles.imagePickerImg} />
                    : editingAsset?.imageUrl
                      ? <img src={editingAsset.imageUrl} alt="" className={styles.imagePickerImg} />
                      : <Camera size={20} color="var(--clr-app-muted)" />}
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={(e) => setAImageFile(e.target.files?.[0] ?? null)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Name *</label>
                <input className={styles.formInput} value={aName} onChange={(e) => setAName(e.target.value)} placeholder="e.g. Dell Latitude Laptop" />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category *</label>
                  <select className={styles.formSelect2} value={aCategory} onChange={(e) => setACategory(e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Quantity</label>
                  <input className={styles.formInput} type="number" min={0} value={aQuantity} onChange={(e) => setAQuantity(e.target.value)} />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Location</label>
                  <input className={styles.formInput} value={aLocation} onChange={(e) => setALocation(e.target.value)} placeholder="e.g. ICT Lab" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Value (GHS)</label>
                  <input className={styles.formInput} type="number" min={0} value={aValue} onChange={(e) => setAValue(e.target.value)} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Custodian</label>
                <select className={styles.formSelect2} value={aCustodianId} onChange={(e) => setACustodianId(e.target.value)}>
                  <option value="">Unassigned</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setShowAssetModal(false)} disabled={saving}>Cancel</button>
              <button className={styles.btnPrimary} onClick={submitAsset} disabled={saving}>{saving ? "Saving…" : "Save Asset"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Record Movement modal */}
      {movementAsset && (
        <div className={styles.modalOverlay} onClick={() => !recording && setMovementAsset(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Stock Movement — {movementAsset.name}</h2>
              <button className={styles.modalClose} onClick={() => setMovementAsset(null)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.hintText}>Current quantity: {movementAsset.quantity}</p>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Type</label>
                <select className={styles.formSelect2} value={mType} onChange={(e) => setMType(e.target.value as "issue" | "receive")}>
                  <option value="issue">Issue (remove stock)</option>
                  <option value="receive">Receive (add stock)</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Quantity</label>
                <input className={styles.formInput} type="number" min={1} value={mQuantity} onChange={(e) => setMQuantity(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Note</label>
                <input className={styles.formInput} value={mNote} onChange={(e) => setMNote(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setMovementAsset(null)} disabled={recording}>Cancel</button>
              <button className={styles.btnPrimary} onClick={submitMovement} disabled={recording}>{recording ? "Saving…" : "Record"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
