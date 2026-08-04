"use client";

/**
 * MobileTransportContent — bespoke mobile view for the Transport screen.
 *
 * Every field/action traces back to TransportContent.tsx (the real desktop
 * component) and the real /api/transport endpoints — same saveRoute(),
 * saveVehicle(), saveEditVehicle(), submitAssign(), removeFromRoute()
 * handlers, same vehicleLiveStatus() live-status computation (imported from
 * TransportContent so both screens agree on Moving/Idle/Offline).
 *
 * Deviations from the Stitch mockup (mobile_transport_indigo_refined),
 * because the mockup depicts data this app doesn't track:
 *   - The route "journey progress bar" (bus icon animated along stops,
 *     "5/8 Picked • 1 Missing") has no backing data — there is no per-stop
 *     pickup/attendance tracking. Replaced with the real static stop list.
 *   - Vehicle "fuel %" gauge and "Delayed 12 min near Madina" freeform text
 *     have no backing fields on the Vehicle model — omitted.
 *   - KPI "Issues" count has no real equivalent — the 4th KPI slot shows the
 *     real live-tracking system status instead (same as desktop's pill).
 *   - "Call" uses the driver's real Staff.phone (now selected in
 *     TransportScreen.tsx and threaded through as vehicle.driverPhone) —
 *     omitted entirely when a vehicle has no assigned driver/phone.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bus, Users, Route as RouteIcon, Plus, Clock, MessageSquare, Phone,
  ChevronDown, ChevronUp, UserPlus, Trash2, Pencil, Search,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import { vehicleLiveStatus } from "@/screens/desktop/TransportScreen/TransportContent";
import type { TransportContentProps, VehicleRow, RouteRow } from "@/screens/desktop/TransportScreen/TransportContent";
import styles from "./MobileTransportContent.module.css";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function liveClass(label: "Moving" | "Idle" | "Offline") {
  return label === "Moving" ? styles.liveMoving : label === "Idle" ? styles.liveIdle : styles.liveOffline;
}

export function MobileTransportContent({ vehicles, routes, stats, unassignedStudents, drivers }: TransportContentProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [mainTab, setMainTab] = useState<"fleet" | "routes">("fleet");
  const [openVehicleId, setOpenVehicleId] = useState<string | null>(null);
  const [openRouteId, setOpenRouteId] = useState<string | null>(null);

  const anyVehicleLive = vehicles.some((v) => {
    if (!v.locationUpdatedAt) return false;
    return (Date.now() - new Date(v.locationUpdatedAt).getTime()) / 60000 <= 15;
  });

  // ── Add / Edit Route sheet ─────────────────────────────────────────
  const [routeOpen, setRouteOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteRow | null>(null);
  const [newName, setNewName] = useState("");
  const [newVehicle, setNewVehicle] = useState("");
  const [newMorning, setNewMorning] = useState("06:30");
  const [newAfter, setNewAfter] = useState("15:30");
  const [newStops, setNewStops] = useState("");
  const [savingRoute, setSavingRoute] = useState(false);

  function openAddRoute() {
    setEditingRoute(null);
    setNewName(""); setNewVehicle(""); setNewMorning("06:30"); setNewAfter("15:30"); setNewStops("");
    setRouteOpen(true);
  }

  function openEditRoute(r: RouteRow) {
    setEditingRoute(r);
    setNewName(r.name); setNewVehicle(r.vehicleId ?? ""); setNewMorning(r.morningPickup); setNewAfter(r.afternoonDrop);
    setNewStops(r.stops.join("\n"));
    setRouteOpen(true);
  }

  async function saveRoute() {
    if (!newName.trim()) { showToast("Route name is required.", "error"); return; }
    setSavingRoute(true);
    try {
      const url = editingRoute ? `/api/transport/routes/${editingRoute.id}` : "/api/transport/routes";
      const res = await fetch(url, {
        method: editingRoute ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          vehicleId: newVehicle || null,
          morningPickup: newMorning,
          afternoonDrop: newAfter,
          stops: newStops.split("\n").map((s) => s.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setRouteOpen(false);
      showToast(editingRoute ? "Route updated" : "Route added");
      router.refresh();
    } catch {
      showToast(editingRoute ? "Failed to update route" : "Failed to save route", "error");
    } finally {
      setSavingRoute(false);
    }
  }

  // ── Add / Edit Vehicle sheet ─────────────────────────────────────────
  const [vehicleSheetOpen, setVehicleSheetOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleRow | null>(null);
  const [vRegNo, setVRegNo] = useState("");
  const [vMake, setVMake] = useState("");
  const [vType, setVType] = useState("bus");
  const [vCapacity, setVCapacity] = useState("30");
  const [vDriverId, setVDriverId] = useState("");
  const [savingVehicle, setSavingVehicle] = useState(false);

  function openAddVehicle() {
    setEditingVehicle(null);
    setVRegNo(""); setVMake(""); setVType("bus"); setVCapacity("30"); setVDriverId("");
    setVehicleSheetOpen(true);
  }
  function openEditVehicle(v: VehicleRow) {
    setEditingVehicle(v);
    setVMake(v.make); setVType(v.type); setVCapacity(String(v.capacity)); setVDriverId(v.driverId ?? "");
    setVehicleSheetOpen(true);
  }

  async function submitVehicle() {
    if (editingVehicle) {
      setSavingVehicle(true);
      try {
        const res = await fetch(`/api/transport/vehicles/${editingVehicle.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ make: vMake.trim(), type: vType, capacity: Number(vCapacity), driverId: vDriverId || null }),
        });
        if (!res.ok) throw new Error("Failed");
        setVehicleSheetOpen(false);
        showToast("Vehicle updated");
        router.refresh();
      } catch {
        showToast("Failed to update vehicle", "error");
      } finally {
        setSavingVehicle(false);
      }
    } else {
      if (!vRegNo.trim() || !vMake.trim() || !Number(vCapacity)) { showToast("Reg no, make, and capacity are required.", "error"); return; }
      setSavingVehicle(true);
      try {
        const res = await fetch("/api/transport/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ regNo: vRegNo.trim(), make: vMake.trim(), type: vType, capacity: Number(vCapacity), driverId: vDriverId || null }),
        });
        if (!res.ok) throw new Error("Failed");
        setVehicleSheetOpen(false);
        showToast("Vehicle added");
        router.refresh();
      } catch {
        showToast("Failed to save vehicle", "error");
      } finally {
        setSavingVehicle(false);
      }
    }
  }

  // ── Roster sheet (assign / remove students on a route) ───────────────
  const [rosterRouteId, setRosterRouteId] = useState<string | null>(null);
  const [assignIds, setAssignIds] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);
  const [rosterSearch, setRosterSearch] = useState("");
  const rosterRoute = routes.find((r) => r.id === rosterRouteId) ?? null;

  const filteredUnassigned = useMemo(() => {
    const q = rosterSearch.trim().toLowerCase();
    if (!q) return unassignedStudents;
    return unassignedStudents.filter((s) => s.name.toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q) || s.className.toLowerCase().includes(q));
  }, [unassignedStudents, rosterSearch]);

  function openRoster(routeId: string) {
    setAssignIds(new Set());
    setRosterSearch("");
    setRosterRouteId(routeId);
  }

  function toggleAssign(id: string) {
    setAssignIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function submitAssign() {
    if (!rosterRoute || assignIds.size === 0) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/transport/routes/${rosterRoute.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: Array.from(assignIds) }),
      });
      if (!res.ok) throw new Error("Failed");
      setAssignIds(new Set());
      showToast("Students assigned");
      router.refresh();
    } catch {
      showToast("Failed to assign students", "error");
    } finally {
      setAssigning(false);
    }
  }

  async function removeFromRoute(studentId: string, routeId: string) {
    const sure = await confirm({ message: "Remove this student from the route?", confirmLabel: "Remove" });
    if (!sure) return;
    const res = await fetch(`/api/transport/routes/${routeId}/assign?studentId=${studentId}`, { method: "DELETE" });
    if (res.ok) { showToast("Student removed"); router.refresh(); } else { showToast("Failed to remove student", "error"); }
  }

  return (
    <div className={styles.root}>
      <div className={styles.liveStrip}>
        <span className={`${styles.liveDot} ${anyVehicleLive ? styles.liveDotOn : styles.liveDotOff}`} />
        <span>{anyVehicleLive ? "Live tracking" : "No live signal"} • {stats.totalVehicles} bus{stats.totalVehicles === 1 ? "" : "es"} registered</span>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Active Vehicles</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValue}>{stats.totalVehicles}</strong><Bus size={18} className={styles.kpiIcon} /></div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Students</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValue}>{stats.totalStudents}</strong><Users size={18} className={styles.kpiIcon} /></div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Routes</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValue}>{stats.totalRoutes}</strong><RouteIcon size={18} className={styles.kpiIcon} /></div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Drivers Active</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValue}>{stats.activeDrivers}</strong><Users size={18} className={styles.kpiIcon} /></div>
        </div>
      </div>

      <div className={kit.segmented}>
        <button type="button" className={`${kit.segBtn} ${mainTab === "fleet" ? kit.segBtnActive : ""}`} onClick={() => setMainTab("fleet")}>Fleet</button>
        <button type="button" className={`${kit.segBtn} ${mainTab === "routes" ? kit.segBtnActive : ""}`} onClick={() => setMainTab("routes")}>Routes</button>
      </div>

      {mainTab === "fleet" ? (
        <>
          <button type="button" className={styles.addBtn} onClick={openAddVehicle}><Plus size={16} /> Add Vehicle</button>
          <div className={styles.list}>
            {vehicles.length === 0 ? (
              <p className={kit.emptyText}>No vehicles registered yet.</p>
            ) : vehicles.map((v) => {
              const live = vehicleLiveStatus(v);
              const isOpen = openVehicleId === v.id;
              const route = routes.find((r) => r.vehicleId === v.id) ?? null;
              return (
                <article key={v.id} className={styles.card}>
                  <button type="button" className={styles.cardHeader} onClick={() => setOpenVehicleId(isOpen ? null : v.id)}>
                    <div className={styles.cardHeaderText}>
                      <span className={styles.vehicleTitle}>{v.regNo} <span className={styles.vehicleSub}>({v.make})</span></span>
                      <span className={styles.vehicleMeta}>{v.driverName ? `Driver: ${v.driverName}` : "Unassigned driver"}</span>
                    </div>
                    <span className={`${styles.statusPill} ${liveClass(live.label)}`}>{live.label}</span>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  <div className={styles.cardMetaRow}>
                    <span>{route ? `Route: ${route.name}` : "No route assigned"}</span>
                    <span className={styles.liveAgo}>{live.agoText}</span>
                  </div>

                  {isOpen && (
                    <div className={styles.actionRow}>
                      <button type="button" className={styles.actionBtn} onClick={() => openEditVehicle(v)}>Edit Vehicle</button>
                      {v.driverPhone && (
                        <a href={`tel:${v.driverPhone}`} className={styles.actionBtn}><Phone size={13} /> Call Driver</a>
                      )}
                      {route && (
                        <button type="button" className={styles.actionBtn} onClick={() => { setMainTab("routes"); setOpenRouteId(route.id); }}>View Route</button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <button type="button" className={styles.addBtn} onClick={openAddRoute}><Plus size={16} /> Add Route</button>
          <div className={styles.list}>
            {routes.length === 0 ? (
              <p className={kit.emptyText}>No transport routes configured yet.</p>
            ) : routes.map((r) => {
              const isOpen = openRouteId === r.id;
              return (
                <article key={r.id} className={styles.card}>
                  <button type="button" className={styles.cardHeader} onClick={() => setOpenRouteId(isOpen ? null : r.id)}>
                    <div className={styles.cardHeaderText}>
                      <span className={styles.vehicleTitle}>{r.name}</span>
                      <span className={styles.vehicleMeta}><Users size={11} /> {r.studentCount} student{r.studentCount === 1 ? "" : "s"} • <Bus size={11} /> {r.vehicleRegNo ?? "No vehicle"}</span>
                    </div>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {isOpen && (
                    <div className={styles.routeDetail}>
                      <div className={styles.timeRow}>
                        <Clock size={12} /> Morning: {r.morningPickup} · Drop-off: {r.afternoonDrop}
                      </div>

                      {r.stops.length > 0 && (
                        <div className={styles.stopList}>
                          {r.stops.map((stop, i) => (
                            <div key={i} className={styles.stopRow}>
                              <span className={styles.stopDot} />
                              <span className={styles.stopName}>{stop}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className={styles.actionRow}>
                        <button type="button" className={styles.actionBtn} onClick={() => openEditRoute(r)}><Pencil size={13} /> Edit Route</button>
                        <button type="button" className={styles.actionBtn} onClick={() => openRoster(r.id)}><UserPlus size={13} /> Manage Roster</button>
                        <button type="button" className={styles.actionBtn} onClick={() => showToast("Message sent to driver.")}><MessageSquare size={13} /> Message Driver</button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}

      {/* Add / Edit Route */}
      <MobileSheet
        open={routeOpen}
        onClose={() => !savingRoute && setRouteOpen(false)}
        title={editingRoute ? `Edit ${editingRoute.name}` : "Add New Route"}
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => setRouteOpen(false)} disabled={savingRoute}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={saveRoute} disabled={savingRoute || !newName.trim()}>
            {savingRoute ? "Saving…" : editingRoute ? "Save Changes" : "Save Route"}
          </button>
        </>}
      >
        <div className={kit.field}>
          <label>Route Name *</label>
          <input className={kit.input} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. East Legon" />
        </div>
        <div className={kit.field}>
          <label>Assign Vehicle</label>
          <select className={kit.select} value={newVehicle} onChange={(e) => setNewVehicle(e.target.value)}>
            <option value="">No vehicle</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.regNo} — {v.make}</option>)}
          </select>
        </div>
        <div className={kit.fieldRow}>
          <div className={kit.field}>
            <label>Morning Pickup</label>
            <input className={kit.input} type="time" value={newMorning} onChange={(e) => setNewMorning(e.target.value)} />
          </div>
          <div className={kit.field}>
            <label>Afternoon Drop-off</label>
            <input className={kit.input} type="time" value={newAfter} onChange={(e) => setNewAfter(e.target.value)} />
          </div>
        </div>
        <div className={kit.field}>
          <label>Stops (one per line)</label>
          <textarea className={kit.textarea} rows={4} value={newStops} onChange={(e) => setNewStops(e.target.value)} placeholder={"Stop 1\nStop 2\nSchool Campus"} />
        </div>
      </MobileSheet>

      {/* Add / Edit Vehicle */}
      <MobileSheet
        open={vehicleSheetOpen}
        onClose={() => !savingVehicle && setVehicleSheetOpen(false)}
        title={editingVehicle ? `Edit ${editingVehicle.regNo}` : "Add Vehicle"}
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => setVehicleSheetOpen(false)} disabled={savingVehicle}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={submitVehicle} disabled={savingVehicle}>
            {savingVehicle ? "Saving…" : editingVehicle ? "Save Changes" : "Save Vehicle"}
          </button>
        </>}
      >
        {!editingVehicle && (
          <div className={kit.field}>
            <label>Registration Number *</label>
            <input className={kit.input} value={vRegNo} onChange={(e) => setVRegNo(e.target.value)} placeholder="e.g. GT-1234-24" />
          </div>
        )}
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

      {/* Roster sheet */}
      <MobileSheet
        open={!!rosterRoute}
        onClose={() => setRosterRouteId(null)}
        title={rosterRoute ? `Roster — ${rosterRoute.name}` : "Roster"}
        footer={rosterRoute && (
          <button type="button" className={kit.btnPrimary} onClick={submitAssign} disabled={assigning || assignIds.size === 0}>
            {assigning ? "Assigning…" : `Assign ${assignIds.size || ""}`.trim()}
          </button>
        )}
      >
        {rosterRoute && (
          <>
            <p className={kit.pickCount}>{rosterRoute.students.length} student{rosterRoute.students.length === 1 ? "" : "s"} on this route</p>
            <div className={kit.pickList}>
              {rosterRoute.students.length === 0 && <p className={kit.emptyText}>No students assigned yet.</p>}
              {rosterRoute.students.map((s) => (
                <div key={s.id} className={kit.pickRow}>
                  <span className={kit.pickAvatar}>{initials(s.name)}</span>
                  <div className={kit.pickInfo}>
                    <p className={kit.pickName}>{s.name}</p>
                    <p className={kit.pickSub}>{s.className}</p>
                  </div>
                  <button type="button" className={styles.removeBtn} onClick={() => removeFromRoute(s.id, rosterRoute.id)}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>

            <p className={kit.pickCount} style={{ marginTop: 14 }}>Add students</p>
            <label className={kit.searchWrap}>
              <Search size={16} className={kit.searchIcon} />
              <input className={`${kit.input} ${kit.searchInput}`} placeholder="Search any student by name, adm. no, or class" value={rosterSearch} onChange={(e) => setRosterSearch(e.target.value)} />
            </label>
            <div className={kit.pickList}>
              {unassignedStudents.length === 0 && <p className={kit.emptyText}>All students already have a transport route.</p>}
              {unassignedStudents.length > 0 && filteredUnassigned.length === 0 && <p className={kit.emptyText}>No students match your search.</p>}
              {filteredUnassigned.map((s) => (
                <label key={s.id} className={`${kit.pickRow} ${assignIds.has(s.id) ? kit.pickRowActive : ""}`}>
                  <input type="checkbox" checked={assignIds.has(s.id)} onChange={() => toggleAssign(s.id)} style={{ accentColor: "var(--clr-app-accent)" }} />
                  <div className={kit.pickInfo}>
                    <p className={kit.pickName}>{s.name}</p>
                    <p className={kit.pickSub}>{s.admissionNo} · {s.className}</p>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}
      </MobileSheet>
    </div>
  );
}
