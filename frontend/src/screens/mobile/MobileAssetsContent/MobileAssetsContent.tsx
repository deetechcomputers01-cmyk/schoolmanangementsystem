"use client";

/**
 * MobileAssetsContent — bespoke mobile view for the Assets screen.
 *
 * Every field/action traces back to AssetsContent.tsx (the real desktop
 * component) and the real /api/assets endpoints — same submitAsset()
 * (multipart POST/PATCH), submitMovement() (POST), and per-item status
 * PATCH (same one `bulkSetStatus` uses on desktop, called for a single id
 * here instead of a multi-select batch).
 *
 * Deviations from the Stitch mockup (mobile_assets_scholarsphere_pro):
 *   - "Condition: Good/Fair", "Serial No.", "Warranty" have no backing
 *     field on AssetRow — the real per-item state is `status`
 *     (active/maintenance/disposed/low_stock). Used that everywhere instead.
 *   - "Scan Asset" (QR) and the "Campus" location dropdown have no real
 *     endpoint/fixed-location list — omitted. Location stays a free-text
 *     field covered by the real search.
 *   - The mockup's specific alert cards ("Projector lamp due", "1 item
 *     missing in Science Lab") are fabricated single instances — omitted;
 *     the real KPI grid already surfaces maintenance/low-stock counts.
 *   - "Audit Summary" (Last Audit/Variance) has no audit-log model — only
 *     a real Movement Log exists (separate tab, ported as-is). Omitted.
 *   - Expanded-card actions (Assign/Schedule Maint/Mark Damaged/Audit Log)
 *     replaced with 4 real actions: Edit, Record Movement, Mark
 *     Maintenance, Mark Disposed — same endpoints as desktop's bulk bar,
 *     applied to one asset at a time (a mobile multi-select toolbar didn't
 *     fit the space, matching the simplification made for other screens'
 *     bulk actions in this codebase).
 */

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Package, Plus, Search, ArrowLeftRight, Camera, Pencil, Wrench, Archive,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import { CATEGORIES, STATUS_LABEL, initials } from "@/screens/desktop/AssetsScreen/AssetsContent";
import type { AssetsContentProps, AssetRow, AssetStatus } from "@/screens/desktop/AssetsScreen/AssetsContent";
import styles from "./MobileAssetsContent.module.css";

export function MobileAssetsContent({ assets, movements, staff }: AssetsContentProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [tab, setTab] = useState<"register" | "movements">("register");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);

  const totalAssetCount = useMemo(() => assets.reduce((s, a) => s + a.quantity, 0), [assets]);
  const totalValue = useMemo(() => assets.reduce((s, a) => s + (a.value ?? 0), 0), [assets]);
  const inMaintenance = assets.filter((a) => a.status === "maintenance").length;
  const lowStockOrDisposed = assets.filter((a) => a.status === "low_stock" || a.status === "disposed").length;

  const filtered = useMemo(() => assets.filter((a) =>
    (search === "" || a.name.toLowerCase().includes(search.toLowerCase()) || a.tag.toLowerCase().includes(search.toLowerCase()) || (a.location ?? "").toLowerCase().includes(search.toLowerCase())) &&
    (categoryFilter === "" || a.category === categoryFilter) &&
    (statusFilter === "" || a.status === statusFilter)
  ), [assets, search, categoryFilter, statusFilter]);

  async function setStatus(asset: AssetRow, status: AssetStatus) {
    setStatusBusyId(asset.id);
    try {
      const res = await fetch(`/api/assets/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast(`Marked ${STATUS_LABEL[status]}`);
      router.refresh();
    } catch {
      showToast("Failed to update asset", "error");
    } finally {
      setStatusBusyId(null);
    }
  }

  // ── Add/Edit Asset sheet ─────────────────────────────────────────────
  const [showAssetSheet, setShowAssetSheet] = useState(false);
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

  function openAdd() {
    setEditingAsset(null);
    setAName(""); setACategory(CATEGORIES[0]); setALocation(""); setACustodianId(""); setAQuantity("1"); setAValue(""); setAImageFile(null);
    setShowAssetSheet(true);
  }
  function openEdit(asset: AssetRow) {
    setEditingAsset(asset);
    setAName(asset.name); setACategory(asset.category); setALocation(asset.location ?? ""); setACustodianId(asset.custodianId ?? "");
    setAQuantity(String(asset.quantity)); setAValue(asset.value !== null ? String(asset.value) : ""); setAImageFile(null);
    setShowAssetSheet(true);
  }

  async function submitAsset() {
    if (!aName.trim() || !aCategory) { showToast("Name and category are required.", "error"); return; }
    setSaving(true);
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
      if (!res.ok) throw new Error("Failed");
      setShowAssetSheet(false);
      showToast(editingAsset ? "Asset updated" : "Asset registered");
      router.refresh();
    } catch {
      showToast("Failed to save asset", "error");
    } finally {
      setSaving(false);
    }
  }

  // ── Record Movement sheet ────────────────────────────────────────────
  const [movementAsset, setMovementAsset] = useState<AssetRow | null>(null);
  const [mType, setMType] = useState<"issue" | "receive">("issue");
  const [mQuantity, setMQuantity] = useState("1");
  const [mNote, setMNote] = useState("");
  const [recording, setRecording] = useState(false);

  function openMovement(asset: AssetRow) {
    setMovementAsset(asset);
    setMType("issue");
    setMQuantity("1");
    setMNote("");
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
      if (!res.ok) throw new Error("Failed");
      showToast("Movement recorded");
      setMovementAsset(null);
      router.refresh();
    } catch {
      showToast("Failed to record movement", "error");
    } finally {
      setRecording(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Assets</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValue}>{totalAssetCount.toLocaleString()}</strong><Package size={18} className={styles.kpiIcon} /></div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Value</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValueSm}>GHS {totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>In Maintenance</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValueWarn}>{inMaintenance}</strong><Wrench size={18} className={styles.kpiIconWarn} /></div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Low Stock / Disposed</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValueError}>{lowStockOrDisposed}</strong></div>
        </div>
      </div>

      <button type="button" className={styles.addBtn} onClick={openAdd}><Plus size={16} /> Register Asset</button>

      <div className={kit.segmented}>
        <button type="button" className={`${kit.segBtn} ${tab === "register" ? kit.segBtnActive : ""}`} onClick={() => setTab("register")}>Inventory</button>
        <button type="button" className={`${kit.segBtn} ${tab === "movements" ? kit.segBtnActive : ""}`} onClick={() => setTab("movements")}>Movement Log</button>
      </div>

      {tab === "register" ? (
        <>
          <label className={kit.searchWrap}>
            <Search size={16} className={kit.searchIcon} />
            <input className={`${kit.input} ${kit.searchInput}`} placeholder="Search asset, tag, or location" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>

          <div className={styles.chipRow}>
            <button type="button" className={`${styles.chip} ${categoryFilter === "" ? styles.chipActive : ""}`} onClick={() => setCategoryFilter("")}>All Categories</button>
            {CATEGORIES.map((c) => (
              <button key={c} type="button" className={`${styles.chip} ${categoryFilter === c ? styles.chipActive : ""}`} onClick={() => setCategoryFilter(categoryFilter === c ? "" : c)}>{c}</button>
            ))}
          </div>
          <div className={styles.chipRow}>
            <button type="button" className={`${styles.chip} ${statusFilter === "" ? styles.chipActive : ""}`} onClick={() => setStatusFilter("")}>All Statuses</button>
            {(Object.keys(STATUS_LABEL) as AssetStatus[]).map((s) => (
              <button key={s} type="button" className={`${styles.chip} ${statusFilter === s ? styles.chipActive : ""}`} onClick={() => setStatusFilter(statusFilter === s ? "" : s)}>{STATUS_LABEL[s]}</button>
            ))}
          </div>

          <div className={styles.list}>
            {filtered.length === 0 ? (
              <p className={kit.emptyText}>{assets.length === 0 ? "No assets recorded yet." : "No assets match your filters."}</p>
            ) : filtered.map((a) => {
              const isOpen = openId === a.id;
              return (
                <article key={a.id} className={`${styles.card} ${styles[`border_${a.status}`]}`}>
                  <button type="button" className={styles.cardHeader} onClick={() => setOpenId(isOpen ? null : a.id)}>
                    {a.imageUrl ? <img src={a.imageUrl} alt="" className={styles.thumb} /> : <div className={styles.thumbPlaceholder}><Package size={16} /></div>}
                    <div className={styles.cardHeaderText}>
                      <span className={styles.assetName}>{a.name} <span className={styles.assetTag}>{a.tag}</span></span>
                      <span className={styles.assetMeta}>{a.category} • {a.location ?? "No location"}</span>
                    </div>
                    <span className={`${styles.statusPill} ${styles[`status_${a.status}`]}`}>{STATUS_LABEL[a.status]}</span>
                    {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>

                  {isOpen && (
                    <div className={styles.cardDetail}>
                      <div className={styles.detailRow}><span>Custodian</span><strong>{a.custodianName ?? "Unassigned"}</strong></div>
                      <div className={styles.detailRow}><span>Quantity</span><strong>{a.quantity}</strong></div>
                      <div className={styles.detailRow}><span>Value</span><strong>{a.value !== null ? `GHS ${a.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}</strong></div>

                      <div className={styles.actionGrid}>
                        <button type="button" className={styles.actionBtn} onClick={() => openEdit(a)}><Pencil size={13} /> Edit</button>
                        <button type="button" className={styles.actionBtn} onClick={() => openMovement(a)}><ArrowLeftRight size={13} /> Record Movement</button>
                        <button type="button" className={styles.actionBtn} disabled={statusBusyId === a.id || a.status === "maintenance"} onClick={() => setStatus(a, "maintenance")}><Wrench size={13} /> Mark Maintenance</button>
                        <button type="button" className={styles.actionBtnDanger} disabled={statusBusyId === a.id || a.status === "disposed"} onClick={() => setStatus(a, "disposed")}><Archive size={13} /> Mark Disposed</button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <div className={styles.list}>
          {movements.length === 0 ? (
            <p className={kit.emptyText}>No stock movement recorded yet.</p>
          ) : movements.map((m) => (
            <div key={m.id} className={styles.movementRow}>
              <div className={styles.movementInfo}>
                <p className={styles.movementAsset}>{m.assetName} <span className={styles.assetTag}>{m.assetTag}</span></p>
                <p className={styles.movementMeta}>{m.type} · {m.quantity} unit{m.quantity !== 1 ? "s" : ""} · by {m.actedByName}</p>
                {m.note && <p className={styles.movementNote}>&ldquo;{m.note}&rdquo;</p>}
              </div>
              <span className={styles.movementDate}>{new Date(m.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
            </div>
          ))}
        </div>
      )}

      <MobileSheet
        open={showAssetSheet}
        onClose={() => !saving && setShowAssetSheet(false)}
        title={editingAsset ? `Edit ${editingAsset.tag}` : "Register Asset"}
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => setShowAssetSheet(false)} disabled={saving}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={submitAsset} disabled={saving}>{saving ? "Saving…" : "Save Asset"}</button>
        </>}
      >
        <div className={kit.dropzone} onClick={() => fileRef.current?.click()}>
          {aImageFile
            ? <img src={URL.createObjectURL(aImageFile)} alt="" style={{ width: 64, height: 64, borderRadius: "var(--radius-sm)", objectFit: "cover" }} />
            : editingAsset?.imageUrl
              ? <img src={editingAsset.imageUrl} alt="" style={{ width: 64, height: 64, borderRadius: "var(--radius-sm)", objectFit: "cover" }} />
              : <Camera size={20} color="var(--clr-app-muted)" />}
          <p className={kit.dropzoneText}>{aImageFile ? aImageFile.name : "Tap to upload a photo (JPEG, PNG or WebP)"}</p>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={(e) => setAImageFile(e.target.files?.[0] ?? null)} />
        <div className={kit.field}>
          <label>Name *</label>
          <input className={kit.input} value={aName} onChange={(e) => setAName(e.target.value)} placeholder="e.g. Dell Latitude Laptop" />
        </div>
        <div className={kit.fieldRow}>
          <div className={kit.field}>
            <label>Category *</label>
            <select className={kit.select} value={aCategory} onChange={(e) => setACategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className={kit.field}>
            <label>Quantity</label>
            <input className={kit.input} type="number" min={0} value={aQuantity} onChange={(e) => setAQuantity(e.target.value)} />
          </div>
        </div>
        <div className={kit.fieldRow}>
          <div className={kit.field}>
            <label>Location</label>
            <input className={kit.input} value={aLocation} onChange={(e) => setALocation(e.target.value)} placeholder="e.g. ICT Lab" />
          </div>
          <div className={kit.field}>
            <label>Value (GHS)</label>
            <input className={kit.input} type="number" min={0} value={aValue} onChange={(e) => setAValue(e.target.value)} />
          </div>
        </div>
        <div className={kit.field}>
          <label>Custodian</label>
          <select className={kit.select} value={aCustodianId} onChange={(e) => setACustodianId(e.target.value)}>
            <option value="">Unassigned</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </MobileSheet>

      <MobileSheet
        open={!!movementAsset}
        onClose={() => !recording && setMovementAsset(null)}
        title={`Stock Movement — ${movementAsset?.name ?? ""}`}
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => setMovementAsset(null)} disabled={recording}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={submitMovement} disabled={recording}>{recording ? "Saving…" : "Record"}</button>
        </>}
      >
        <p className={kit.helperText}>Current quantity: {movementAsset?.quantity}</p>
        <div className={kit.field}>
          <label>Type</label>
          <select className={kit.select} value={mType} onChange={(e) => setMType(e.target.value as "issue" | "receive")}>
            <option value="issue">Issue (remove stock)</option>
            <option value="receive">Receive (add stock)</option>
          </select>
        </div>
        <div className={kit.field}>
          <label>Quantity</label>
          <input className={kit.input} type="number" min={1} value={mQuantity} onChange={(e) => setMQuantity(e.target.value)} />
        </div>
        <div className={kit.field}>
          <label>Note</label>
          <input className={kit.input} value={mNote} onChange={(e) => setMNote(e.target.value)} placeholder="Optional" />
        </div>
      </MobileSheet>
    </div>
  );
}
