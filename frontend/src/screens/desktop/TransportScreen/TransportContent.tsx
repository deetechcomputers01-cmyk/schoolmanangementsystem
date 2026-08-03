"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bus, Users, Clock, Plus, ChevronRight,
  MessageSquare, Route as RouteIcon,
  Download, X, Activity, Trash2, MoreVertical,
} from "lucide-react";
import { VehicleMapLoader } from "@/components/transport/VehicleMapLoader";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import styles from "./TransportScreen.module.css";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";

function vehicleLiveStatus(v: { speed: number | null; locationUpdatedAt: string | null }): { label: string; cls: string; agoText: string } {
  if (!v.locationUpdatedAt) return { label: "Offline", cls: styles.liveStatusOffline, agoText: "no signal" };
  const minsAgo = Math.round((Date.now() - new Date(v.locationUpdatedAt).getTime()) / 60000);
  const agoText = minsAgo < 1 ? "just now" : `${minsAgo} min${minsAgo === 1 ? "" : "s"} ago`;
  if (minsAgo > 15) return { label: "Offline", cls: styles.liveStatusOffline, agoText };
  if ((v.speed ?? 0) > 2) return { label: "Moving", cls: styles.liveStatusMoving, agoText };
  return { label: "Idle", cls: styles.liveStatusIdle, agoText };
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface VehicleRow {
  id: string; regNo: string; make: string; capacity: number; type: string; driverName: string | null; driverId: string | null;
  latitude: number | null; longitude: number | null; speed: number | null; locationUpdatedAt: string | null;
}
interface RouteRow { id: string; name: string; vehicleId: string | null; vehicleRegNo: string | null; vehicleMake: string | null; vehicleType: string | null; vehicleCapacity: number | null; stops: string[]; morningPickup: string; afternoonDrop: string; studentCount: number; students: { id: string; name: string; className: string }[]; }
interface StudentOption { id: string; name: string; admissionNo: string; className: string }
interface DriverOption { id: string; name: string }
interface Props {
  vehicles: VehicleRow[]; routes: RouteRow[]; stats: { totalVehicles: number; totalRoutes: number; totalStudents: number; activeDrivers: number };
  unassignedStudents: StudentOption[]; drivers: DriverOption[];
}

export function TransportContent({ vehicles, routes, stats, unassignedStudents, drivers }: Props) {
  const router = useRouter();
  const { showToast: showToastFn } = useToast();
  const confirm = useConfirm();
  const [mainTab,     setMainTab]     = useState<"fleet" | "routes">("fleet");
  const [selectedId,  setSelectedId]  = useState(routes[0]?.id ?? "");
  const [showModal,   setShowModal]   = useState(false);

  // Edit vehicle modal
  const [editVehicle, setEditVehicle] = useState<VehicleRow | null>(null);
  const [evMake, setEvMake] = useState("");
  const [evType, setEvType] = useState("bus");
  const [evCapacity, setEvCapacity] = useState("30");
  const [evDriverId, setEvDriverId] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  function openEditVehicle(v: VehicleRow) {
    setEvMake(v.make);
    setEvType(v.type);
    setEvCapacity(String(v.capacity));
    setEvDriverId(v.driverId ?? "");
    setEditVehicle(v);
  }

  async function saveEditVehicle() {
    if (!editVehicle) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/transport/vehicles/${editVehicle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ make: evMake.trim(), type: evType, capacity: Number(evCapacity), driverId: evDriverId || null }),
      });
      if (res.ok) {
        setEditVehicle(null);
        router.refresh();
      } else {
        toast("Failed to update vehicle.");
      }
    } finally {
      setSavingEdit(false);
    }
  }

  // Add route form state
  const [newName,    setNewName]    = useState("");
  const [newVehicle, setNewVehicle] = useState("");
  const [newMorning, setNewMorning] = useState("06:30");
  const [newAfter,   setNewAfter]   = useState("15:30");
  const [newStops,   setNewStops]   = useState("");
  const [saving,     setSaving]     = useState(false);

  // Add vehicle modal
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vRegNo, setVRegNo] = useState("");
  const [vMake, setVMake] = useState("");
  const [vType, setVType] = useState("bus");
  const [vCapacity, setVCapacity] = useState("30");
  const [vDriverId, setVDriverId] = useState("");
  const [savingVehicle, setSavingVehicle] = useState(false);

  // Assign students modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignIds, setAssignIds] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);

  // Route manifest bulk-select
  const [manifestCheckedIds, setManifestCheckedIds] = useState<Set<string>>(new Set());
  const [bulkRemoving, setBulkRemoving] = useState(false);

  const selectedRoute = routes.find(r => r.id === selectedId) ?? null;

  function toast(msg: string) { showToastFn(msg); }

  function exportManifest() {
    if (!selectedRoute) return;
    const rows = selectedRoute.students.map(s => `${s.name},${s.className},—,Pending`).join("\n");
    const blob = new Blob([`Name,Class,Pickup Point,Status\n${rows}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `manifest-${selectedRoute.name}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  async function saveRoute() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/transport/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          vehicleId: newVehicle || null,
          morningPickup: newMorning,
          afternoonDrop: newAfter,
          stops: newStops.split("\n").map(s => s.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setNewName(""); setNewVehicle(""); setNewStops("");
        window.location.reload();
      } else {
        toast("Failed to save route.");
      }
    } catch {
      toast("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function saveVehicle() {
    if (!vRegNo.trim() || !vMake.trim() || !Number(vCapacity)) { toast("Reg no, make, and capacity are required."); return; }
    setSavingVehicle(true);
    try {
      const res = await fetch("/api/transport/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regNo: vRegNo.trim(), make: vMake.trim(), type: vType, capacity: Number(vCapacity), driverId: vDriverId || null }),
      });
      if (res.ok) {
        setShowVehicleModal(false);
        setVRegNo(""); setVMake(""); setVCapacity("30"); setVDriverId("");
        router.refresh();
      } else {
        toast("Failed to save vehicle.");
      }
    } catch {
      toast("Network error.");
    } finally {
      setSavingVehicle(false);
    }
  }

  function toggleAssign(id: string) {
    setAssignIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function submitAssign() {
    if (!selectedRoute || assignIds.size === 0) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/transport/routes/${selectedRoute.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: Array.from(assignIds) }),
      });
      if (res.ok) {
        setShowAssignModal(false);
        setAssignIds(new Set());
        router.refresh();
      } else {
        toast("Failed to assign students.");
      }
    } finally {
      setAssigning(false);
    }
  }

  async function removeFromRoute(studentId: string) {
    if (!selectedRoute) return;
    if (!(await confirm({ message: "Remove this student from the route?", confirmLabel: "Remove" }))) return;
    const res = await fetch(`/api/transport/routes/${selectedRoute.id}/assign?studentId=${studentId}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  async function bulkRemoveFromRoute() {
    if (!selectedRoute || manifestCheckedIds.size === 0) return;
    const confirmed = await confirm({
      message: `Remove ${manifestCheckedIds.size} selected student${manifestCheckedIds.size !== 1 ? "s" : ""} from this route?`,
      confirmLabel: "Remove",
    });
    if (!confirmed) return;
    setBulkRemoving(true);
    try {
      const results = await Promise.allSettled(
        Array.from(manifestCheckedIds).map((studentId) =>
          fetch(`/api/transport/routes/${selectedRoute.id}/assign?studentId=${studentId}`, { method: "DELETE" })
        )
      );
      const succeeded = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;
      const failed = results.length - succeeded;
      toast(`${succeeded} student${succeeded !== 1 ? "s" : ""} removed${failed ? `, ${failed} failed` : ""}.`);
      setManifestCheckedIds(new Set());
      router.refresh();
    } finally {
      setBulkRemoving(false);
    }
  }

  const anyVehicleLive = vehicles.some((v) => {
    if (!v.locationUpdatedAt) return false;
    return (Date.now() - new Date(v.locationUpdatedAt).getTime()) / 60000 <= 15;
  });

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.breadcrumb}>
            <span>Transport</span><ChevronRight size={14} /><span className={styles.breadcrumbActive}>{mainTab === "fleet" ? "Fleet" : "Routes"}</span>
          </div>
          <h1 className={styles.title}>Transport Management</h1>
          <p className={styles.subtitle}>Manage routes, buses, drivers, student pickup lists, and daily trips.</p>
        </div>
        <div className={styles.headerActions}>
          {mainTab === "routes" && <button className={styles.btnSmall} onClick={exportManifest}><Download size={13} /> Export Manifest</button>}
          {mainTab === "fleet" ? (
            <button className={styles.btnPrimary} onClick={() => setShowVehicleModal(true)}><Plus size={13} /> Add Vehicle</button>
          ) : (
            <button className={styles.btnPrimary} onClick={() => setShowModal(true)}><Plus size={13} /> Add Route</button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div>
            <div className={styles.statCardLabel}>Active Vehicles</div>
            <div className={styles.statCardValue}>{stats.totalVehicles}</div>
          </div>
          <div className={styles.statCardIcon}><Bus size={18} /></div>
        </div>
        <div className={styles.statCard}>
          <div>
            <div className={styles.statCardLabel}>Total Routes</div>
            <div className={styles.statCardValue}>{stats.totalRoutes}</div>
          </div>
          <div className={`${styles.statCardIcon} ${styles.statCardIconInfo}`}><RouteIcon size={18} /></div>
        </div>
        <div className={styles.statCard}>
          <div>
            <div className={styles.statCardLabel}>Students on Transport</div>
            <div className={styles.statCardValue}>{stats.totalStudents}</div>
          </div>
          <div className={`${styles.statCardIcon} ${styles.statCardIconWarn}`}><Users size={18} /></div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardCol}`}>
          <div className={styles.statCardLabel}>Live Tracking</div>
          <span className={`${styles.livePill} ${anyVehicleLive ? "" : styles.livePillOffline}`}>
            <span className={`${styles.livePillDot} ${anyVehicleLive ? "" : styles.livePillDotOffline}`} />
            {anyVehicleLive ? "System Online" : "No Live Signal"}
          </span>
        </div>
      </div>

      {/* Fleet / Routes tabs */}
      <div className={styles.mainTabs}>
        <button className={`${styles.mainTab} ${mainTab === "fleet" ? styles.mainTabActive : ""}`} onClick={() => setMainTab("fleet")}>Fleet</button>
        <button className={`${styles.mainTab} ${mainTab === "routes" ? styles.mainTabActive : ""}`} onClick={() => setMainTab("routes")}>Routes</button>
      </div>

      {mainTab === "fleet" ? (
        <>
          {/* Live vehicle map */}
          <div className={styles.mapWrap}>
            <VehicleMapLoader
              vehicles={vehicles.map((v) => ({ id: v.id, regNo: v.regNo, make: v.make, driverName: v.driverName, latitude: v.latitude, longitude: v.longitude, speed: v.speed, locationUpdatedAt: v.locationUpdatedAt }))}
              pollUrl="/api/transport/vehicles"
            />
          </div>

          {/* Fleet table */}
          <div className={styles.fleetWrap}>
            {vehicles.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", gap: 10, color: "var(--clr-app-muted)" }}>
                <Bus size={32} style={{ opacity: 0.25 }} />
                <p style={{ fontSize: "var(--text-xs)", margin: 0 }}>No vehicles registered yet.</p>
              </div>
            ) : (
              <div className={styles.tableWrap} style={{ overflowY: "visible" }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Reg. No</th>
                      <th className={styles.th}>Make/Model</th>
                      <th className={styles.th}>Type</th>
                      <th className={styles.th}>Capacity</th>
                      <th className={styles.th}>Driver</th>
                      <th className={styles.th}>Live Status</th>
                      <th className={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((v) => {
                      const live = vehicleLiveStatus(v);
                      return (
                        <tr key={v.id} className={styles.tr}>
                          <td className={`${styles.td} ${styles.regLink}`}>{v.regNo}</td>
                          <td className={styles.td}>{v.make}</td>
                          <td className={styles.td} style={{ textTransform: "capitalize" }}>{v.type}</td>
                          <td className={styles.td}>{v.capacity}</td>
                          <td className={styles.td}>
                            {v.driverName ? (
                              <div className={styles.driverCell}>
                                <div className={styles.driverAvatar}>{v.driverName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}</div>
                                <span>{v.driverName}</span>
                              </div>
                            ) : (
                              <span className={styles.driverUnassigned}>Unassigned</span>
                            )}
                          </td>
                          <td className={styles.td}>
                            <div className={styles.liveStatusCell}>
                              <span className={`${styles.liveStatusDot} ${live.cls}`} />
                              {live.label} <span className={styles.liveStatusAgo}>({live.agoText})</span>
                            </div>
                          </td>
                          <td className={styles.td}>
                            <button className={styles.actionBtn} onClick={() => openEditVehicle(v)} title="Edit vehicle"><MoreVertical size={14} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
      <>
      {/* Main 3-col layout */}
      {routes.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", gap: 12, color: "var(--clr-app-muted)" }}>
          <Bus size={40} style={{ opacity: 0.25 }} />
          <p style={{ fontSize: "var(--text-base)", fontWeight: 500, margin: 0 }}>No transport routes configured</p>
          <p style={{ fontSize: "var(--text-xs)", margin: 0 }}>Add a route to start managing school transport.</p>
          <button className={styles.btnPrimary} onClick={() => setShowModal(true)} style={{ marginTop: 8 }}>
            <Plus size={13} /> Add First Route
          </button>
        </div>
      ) : (
        <div className={styles.mainLayout}>
          {/* Left: Route list */}
          <aside className={styles.routeList}>
            {routes.map((r) => (
              <div
                key={r.id}
                className={`${styles.routeItem} ${r.id === selectedId ? styles.routeItemActive : ""}`}
                onClick={() => setSelectedId(r.id)}
              >
                <div className={styles.routeItemTop}>
                  <span className={styles.routeName}>{r.name}</span>
                  <span className={`${styles.statusBadge} ${styles.statusIdle}`}>IDLE</span>
                </div>
                <div className={styles.routeItemMeta}>
                  <span><Users size={11} /> {r.studentCount} Students</span>
                  <span><Bus size={11} /> {r.vehicleRegNo ?? "No vehicle"}</span>
                </div>
              </div>
            ))}
          </aside>

          {/* Center: Manifest */}
          <div className={styles.centerPanel}>
            <div className={styles.manifestFilterRow}>
              <span className={styles.manifestCount}>
                {selectedRoute?.students.length ?? 0} students on {selectedRoute?.name ?? "—"}
              </span>
              <button className={styles.btnSmall} disabled={!selectedRoute} onClick={() => { setAssignIds(new Set()); setShowAssignModal(true); }}>
                <Plus size={13} /> Assign Students
              </button>
            </div>
            {manifestCheckedIds.size > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--clr-success-bg)", border: "1px solid var(--clr-success-border)", borderRadius: "var(--radius-sm)", marginBottom: 10 }}>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--clr-success)" }}>{manifestCheckedIds.size} selected</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className={styles.actionBtn} style={{ background: "var(--clr-error)", color: "#fff", display: "inline-flex", alignItems: "center", gap: 6, width: "auto", padding: "0 12px" }} onClick={bulkRemoveFromRoute} disabled={bulkRemoving}>
                    <Trash2 size={13} /> {bulkRemoving ? "Removing…" : "Remove Selected"}
                  </button>
                  <button className={styles.actionBtn} style={{ width: "auto", padding: "0 12px" }} onClick={() => setManifestCheckedIds(new Set())}>Clear</button>
                </div>
              </div>
            )}
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th} style={{ width: 36 }}>
                      <input
                        type="checkbox"
                        checked={(selectedRoute?.students ?? []).length > 0 && (selectedRoute?.students ?? []).every(s => manifestCheckedIds.has(s.id))}
                        onChange={() => {
                          const all = selectedRoute?.students ?? [];
                          const next = new Set(manifestCheckedIds);
                          if (all.every(s => manifestCheckedIds.has(s.id))) all.forEach(s => next.delete(s.id));
                          else all.forEach(s => next.add(s.id));
                          setManifestCheckedIds(next);
                        }}
                      />
                    </th>
                    <th className={styles.th}>Student</th>
                    <th className={styles.th}>Class</th>
                    <th className={styles.th}>Pickup / Drop-off Point</th>
                    <th className={styles.th}>Morning Status</th>
                    <th className={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedRoute?.students ?? []).length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "32px 16px", color: "var(--clr-app-muted)", fontSize: "var(--text-xs)" }}>
                        No students assigned to this route yet.
                      </td>
                    </tr>
                  )}
                  {(selectedRoute?.students ?? []).map((s) => {
                    const initials = s.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                    return (
                      <tr key={s.id} className={styles.tr}>
                        <td className={styles.td}>
                          <input
                            type="checkbox"
                            checked={manifestCheckedIds.has(s.id)}
                            onChange={() => {
                              const next = new Set(manifestCheckedIds);
                              if (next.has(s.id)) next.delete(s.id); else next.add(s.id);
                              setManifestCheckedIds(next);
                            }}
                          />
                        </td>
                        <td className={`${styles.td} ${styles.tdBold}`}>
                          <div className={styles.studentCell}>
                            <div className={styles.avatar}>{initials}</div>
                            <span>{s.name}</span>
                          </div>
                        </td>
                        <td className={styles.td}>{s.className}</td>
                        <td className={styles.td}>—</td>
                        <td className={styles.td}>
                          <div className={`${styles.mBadge} ${styles.mPending}`}>Pending</div>
                        </td>
                        <td className={styles.td}>
                          <button className={styles.actionBtn} onClick={() => removeFromRoute(s.id)} title="Remove from route"><Trash2 size={13} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Route details panel */}
          <aside className={styles.opsPanel}>
            {selectedRoute ? (
              <>
                <div className={styles.opsPanelHeader}>
                  <div>
                    <div className={styles.opsTitle}>{selectedRoute.name}</div>
                    <div className={styles.opsEta}>
                      <Clock size={11} /> Morning: {selectedRoute.morningPickup} · Drop-off: {selectedRoute.afternoonDrop}
                    </div>
                  </div>
                  <span className={styles.opsTripBadge}>MORNING TRIP</span>
                </div>

                {/* Vehicle card */}
                <div className={styles.vehicleCard}>
                  <div className={styles.vehicleCardTop}>
                    <div>
                      <div className={styles.vehicleCode}>{selectedRoute.vehicleRegNo ?? "No vehicle assigned"}</div>
                      {selectedRoute.vehicleMake && (
                        <div className={styles.vehicleMake}>
                          {selectedRoute.vehicleMake} · {selectedRoute.vehicleCapacity ?? "—"} Seater
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stops */}
                {selectedRoute.stops.length > 0 && (
                  <div className={styles.tripSection}>
                    <div className={styles.tripSectionTitle}>Route Stops</div>
                    {selectedRoute.stops.map((stop, i) => (
                      <div key={i} className={styles.stopRow}>
                        <div className={styles.stopTimeline}>
                          <div className={`${styles.stopDot} ${i === selectedRoute.stops.length - 1 ? styles.stopDotDone : styles.stopDotUpcoming}`} />
                          {i < selectedRoute.stops.length - 1 && <div className={styles.stopLine} />}
                        </div>
                        <div className={styles.stopBody}>
                          <div className={styles.stopName}>{stop}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.opsMetrics}>
                  <div className={styles.opsMetric}>
                    <Users size={13} className={styles.metricIcon} />
                    <div>
                      <div className={styles.metricLabel}>Students</div>
                      <div className={styles.metricValue}>{selectedRoute.studentCount}</div>
                    </div>
                  </div>
                  <div className={styles.opsMetric}>
                    <Activity size={13} className={styles.metricIcon} />
                    <div>
                      <div className={styles.metricLabel}>Status</div>
                      <div className={styles.metricValue}>Idle</div>
                    </div>
                  </div>
                </div>

                <button className={styles.btnMessageDriver} onClick={() => toast("Message sent to driver.")}>
                  <MessageSquare size={13} /> Message Driver
                </button>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 8, color: "var(--clr-app-muted)" }}>
                <Bus size={28} style={{ opacity: 0.25 }} />
                <p style={{ fontSize: "var(--text-xs)", margin: 0 }}>Select a route to view details</p>
              </div>
            )}
          </aside>
        </div>
      )}
      </>
      )}

      {/* Add Route Modal */}
      {showModal && (
        <div className={`${styles.modalBackdrop} desktopOnly`} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Add New Route</h2>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Route Name *</label>
                <input className={styles.formInput} value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. East Legon" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Assign Vehicle</label>
                <select className={styles.formSelect} value={newVehicle} onChange={e => setNewVehicle(e.target.value)}>
                  <option value="">No vehicle</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.regNo} — {v.make}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Morning Pickup</label>
                  <input className={styles.formInput} type="time" value={newMorning} onChange={e => setNewMorning(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Afternoon Drop-off</label>
                  <input className={styles.formInput} type="time" value={newAfter} onChange={e => setNewAfter(e.target.value)} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Stops (one per line)</label>
                <textarea className={styles.formTextarea} rows={4} value={newStops} onChange={e => setNewStops(e.target.value)} placeholder={"Stop 1\nStop 2\nSchool Campus"} />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setShowModal(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={saveRoute} disabled={saving}>
                {saving ? "Saving…" : "Save Route"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Route sheet — mobile */}
      <div className="mobileOnly">
        <MobileSheet
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Add New Route"
          footer={<>
            <button type="button" className={kit.btnOutline} onClick={() => setShowModal(false)}>Cancel</button>
            <button type="button" className={kit.btnPrimary} onClick={saveRoute} disabled={saving}>
              {saving ? "Saving…" : "Save Route"}
            </button>
          </>}
        >
          <div className={kit.field}>
            <label>Route Name *</label>
            <input className={kit.input} value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. East Legon" />
          </div>
          <div className={kit.field}>
            <label>Assign Vehicle</label>
            <select className={kit.select} value={newVehicle} onChange={e => setNewVehicle(e.target.value)}>
              <option value="">No vehicle</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.regNo} — {v.make}</option>
              ))}
            </select>
          </div>
          <div className={kit.fieldRow}>
            <div className={kit.field}>
              <label>Morning Pickup</label>
              <input className={kit.input} type="time" value={newMorning} onChange={e => setNewMorning(e.target.value)} />
            </div>
            <div className={kit.field}>
              <label>Afternoon Drop-off</label>
              <input className={kit.input} type="time" value={newAfter} onChange={e => setNewAfter(e.target.value)} />
            </div>
          </div>
          <div className={kit.field}>
            <label>Stops (one per line)</label>
            <textarea className={kit.textarea} rows={4} value={newStops} onChange={e => setNewStops(e.target.value)} placeholder={"Stop 1\nStop 2\nSchool Campus"} />
          </div>
        </MobileSheet>
      </div>

      {/* Add Vehicle Modal */}
      {showVehicleModal && (
        <div className={`${styles.modalBackdrop} desktopOnly`} onClick={() => setShowVehicleModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Add Vehicle</h2>
              <button className={styles.modalClose} onClick={() => setShowVehicleModal(false)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Registration Number *</label>
                <input className={styles.formInput} value={vRegNo} onChange={(e) => setVRegNo(e.target.value)} placeholder="e.g. GT-1234-24" />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Make *</label>
                  <input className={styles.formInput} value={vMake} onChange={(e) => setVMake(e.target.value)} placeholder="e.g. Toyota Coaster" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Type</label>
                  <select className={styles.formSelect} value={vType} onChange={(e) => setVType(e.target.value)}>
                    <option value="bus">Bus</option>
                    <option value="van">Van</option>
                    <option value="minibus">Minibus</option>
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Capacity *</label>
                  <input className={styles.formInput} type="number" min={1} value={vCapacity} onChange={(e) => setVCapacity(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Driver</label>
                  <select className={styles.formSelect} value={vDriverId} onChange={(e) => setVDriverId(e.target.value)}>
                    <option value="">No driver assigned</option>
                    {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setShowVehicleModal(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={saveVehicle} disabled={savingVehicle}>{savingVehicle ? "Saving…" : "Save Vehicle"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Vehicle sheet — mobile */}
      <div className="mobileOnly">
        <MobileSheet
          open={showVehicleModal}
          onClose={() => setShowVehicleModal(false)}
          title="Add Vehicle"
          footer={<>
            <button type="button" className={kit.btnOutline} onClick={() => setShowVehicleModal(false)}>Cancel</button>
            <button type="button" className={kit.btnPrimary} onClick={saveVehicle} disabled={savingVehicle}>{savingVehicle ? "Saving…" : "Save Vehicle"}</button>
          </>}
        >
          <div className={kit.field}>
            <label>Registration Number *</label>
            <input className={kit.input} value={vRegNo} onChange={(e) => setVRegNo(e.target.value)} placeholder="e.g. GT-1234-24" />
          </div>
          <div className={kit.fieldRow}>
            <div className={kit.field}>
              <label>Make *</label>
              <input className={kit.input} value={vMake} onChange={(e) => setVMake(e.target.value)} placeholder="e.g. Toyota Coaster" />
            </div>
            <div className={kit.field}>
              <label>Type</label>
              <select className={kit.select} value={vType} onChange={(e) => setVType(e.target.value)}>
                <option value="bus">Bus</option>
                <option value="van">Van</option>
                <option value="minibus">Minibus</option>
              </select>
            </div>
          </div>
          <div className={kit.fieldRow}>
            <div className={kit.field}>
              <label>Capacity *</label>
              <input className={kit.input} type="number" min={1} value={vCapacity} onChange={(e) => setVCapacity(e.target.value)} />
            </div>
            <div className={kit.field}>
              <label>Driver</label>
              <select className={kit.select} value={vDriverId} onChange={(e) => setVDriverId(e.target.value)}>
                <option value="">No driver assigned</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
        </MobileSheet>
      </div>

      {/* Edit Vehicle Modal */}
      {editVehicle && (
        <div className={`${styles.modalBackdrop} desktopOnly`} onClick={() => setEditVehicle(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Edit {editVehicle.regNo}</h2>
              <button className={styles.modalClose} onClick={() => setEditVehicle(null)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Make *</label>
                <input className={styles.formInput} value={evMake} onChange={(e) => setEvMake(e.target.value)} />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Type</label>
                  <select className={styles.formSelect} value={evType} onChange={(e) => setEvType(e.target.value)}>
                    <option value="bus">Bus</option>
                    <option value="van">Van</option>
                    <option value="minibus">Minibus</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Capacity *</label>
                  <input className={styles.formInput} type="number" min={1} value={evCapacity} onChange={(e) => setEvCapacity(e.target.value)} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Driver</label>
                <select className={styles.formSelect} value={evDriverId} onChange={(e) => setEvDriverId(e.target.value)}>
                  <option value="">No driver assigned</option>
                  {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setEditVehicle(null)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={saveEditVehicle} disabled={savingEdit}>{savingEdit ? "Saving…" : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Vehicle sheet — mobile */}
      <div className="mobileOnly">
        <MobileSheet
          open={!!editVehicle}
          onClose={() => setEditVehicle(null)}
          title={`Edit ${editVehicle?.regNo ?? ""}`}
          footer={<>
            <button type="button" className={kit.btnOutline} onClick={() => setEditVehicle(null)}>Cancel</button>
            <button type="button" className={kit.btnPrimary} onClick={saveEditVehicle} disabled={savingEdit}>{savingEdit ? "Saving…" : "Save Changes"}</button>
          </>}
        >
          <div className={kit.field}>
            <label>Make *</label>
            <input className={kit.input} value={evMake} onChange={(e) => setEvMake(e.target.value)} />
          </div>
          <div className={kit.fieldRow}>
            <div className={kit.field}>
              <label>Type</label>
              <select className={kit.select} value={evType} onChange={(e) => setEvType(e.target.value)}>
                <option value="bus">Bus</option>
                <option value="van">Van</option>
                <option value="minibus">Minibus</option>
              </select>
            </div>
            <div className={kit.field}>
              <label>Capacity *</label>
              <input className={kit.input} type="number" min={1} value={evCapacity} onChange={(e) => setEvCapacity(e.target.value)} />
            </div>
          </div>
          <div className={kit.field}>
            <label>Driver</label>
            <select className={kit.select} value={evDriverId} onChange={(e) => setEvDriverId(e.target.value)}>
              <option value="">No driver assigned</option>
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </MobileSheet>
      </div>

      {/* Assign Students Modal */}
      {showAssignModal && selectedRoute && (
        <div className={styles.modalBackdrop} onClick={() => setShowAssignModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Assign Students to {selectedRoute.name}</h2>
              <button className={styles.modalClose} onClick={() => setShowAssignModal(false)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ maxHeight: 260, overflowY: "auto", border: "1px solid var(--clr-app-border)", borderRadius: 6 }}>
                {unassignedStudents.map((s) => (
                  <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", fontSize: "var(--text-xs)", borderBottom: "1px solid var(--clr-app-border)", cursor: "pointer" }}>
                    <input type="checkbox" checked={assignIds.has(s.id)} onChange={() => toggleAssign(s.id)} />
                    <span>{s.name}</span>
                    <span style={{ color: "var(--clr-app-muted)" }}>{s.admissionNo} · {s.className}</span>
                  </label>
                ))}
                {unassignedStudents.length === 0 && (
                  <p style={{ padding: 16, fontSize: "var(--text-xs)", color: "var(--clr-app-muted)", margin: 0 }}>All students already have a transport route assigned.</p>
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={submitAssign} disabled={assigning || assignIds.size === 0}>
                {assigning ? "Assigning…" : `Assign ${assignIds.size || ""}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
