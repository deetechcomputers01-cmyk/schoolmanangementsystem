"use client";

/**
 * MobileTransportPortalContent — bespoke mobile view of the driver's own
 * Transport Portal (role: driver, route /transport-portal).
 *
 * Every field traces back to the real getTransportPortalData() service and
 * TransportPortalContent.tsx (the newly-split desktop version): staffRecord
 * (name/staffNo/phone), assigned vehicles with nested routes/stops/student
 * manifest, and totalStudents.
 *
 * The Stitch mockup shows a static "Sharing live location" card with an
 * always-on pulsing dot — the real location-sharing capability is a genuine
 * interactive Start/Stop control (LocationBroadcaster, POST /api/transport/
 * vehicles/:id/location, throttled to the assigned driver only), not a
 * passive always-on indicator. Reused the real component instead of
 * reproducing a fake "always sharing" status.
 *
 * "Edit My Profile" -> PATCH /api/staff/me { phone } — a new, narrowly-scoped
 * self-service endpoint (checked against the current user's own Staff
 * record, not gated behind the admin staff:write permission) — the only
 * field a driver can edit about themselves anywhere in this app today.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bus, Users, Clock, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import { LocationBroadcaster } from "@/components/transport/LocationBroadcaster";
import type { TransportPortalContentProps } from "@/screens/desktop/TransportPortalScreen/TransportPortalContent";
import styles from "./MobileTransportPortalContent.module.css";

export function MobileTransportPortalContent({ staffRecord, vehicles, totalStudents }: TransportPortalContentProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const activeRoutes = vehicles.reduce((sum, v) => sum + v.routes.length, 0);
  const [openRouteId, setOpenRouteId] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [phone, setPhone] = useState(staffRecord?.phone ?? "");
  const [saving, setSaving] = useState(false);

  function openEdit() {
    setPhone(staffRecord?.phone ?? "");
    setEditOpen(true);
  }

  async function saveProfile() {
    if (!phone.trim()) { showToast("Phone number is required", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/staff/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      setEditOpen(false);
      showToast("Profile updated");
      router.refresh();
    } catch {
      showToast("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <p className={styles.heroLabel}>Transport Portal</p>
            <h1 className={styles.heroName}>{staffRecord?.firstName} {staffRecord?.lastName}</h1>
            <p className={styles.heroSub}>Driver · {staffRecord?.staffNo}</p>
          </div>
          <button type="button" className={styles.editBtn} onClick={openEdit} aria-label="Edit Profile">
            <Pencil size={16} />
          </button>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statTile}><strong>{vehicles.length}</strong><span>Vehicles Assigned</span></div>
        <div className={styles.statTile}><strong>{activeRoutes}</strong><span>Active Routes</span></div>
        <div className={styles.statTile}><strong>{totalStudents}</strong><span>Students on Board</span></div>
      </div>

      {vehicles.length === 0 ? (
        <div className={styles.emptyState}>
          <Bus size={32} style={{ opacity: 0.3 }} />
          <p>No vehicle assigned yet.</p>
        </div>
      ) : (
        <>
          <h2 className={styles.sectionTitle}>Assigned Vehicles</h2>
          <div className={styles.list}>
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className={styles.vehicleBlock}>
                <LocationBroadcaster vehicleId={vehicle.id} vehicleLabel={`${vehicle.regNo} · ${vehicle.make}`} />
                <div className={styles.vehicleCard}>
                  <div className={styles.vehicleHeader}>
                    <div>
                      <p className={styles.vehicleName}>{vehicle.make} <span className={styles.vehicleReg}>({vehicle.regNo})</span></p>
                      <p className={styles.vehicleMeta}>Capacity: {vehicle.capacity}</p>
                    </div>
                    <span className={styles.typePill}>{vehicle.type}</span>
                  </div>

                  <div className={styles.routeList}>
                    {vehicle.routes.map((route) => {
                      const isOpen = openRouteId === route.id;
                      return (
                        <div key={route.id} className={styles.routeCard}>
                          <button type="button" className={styles.routeHeader} onClick={() => setOpenRouteId(isOpen ? null : route.id)}>
                            <div className={styles.routeHeaderText}>
                              <span className={styles.routeName}>{route.name}</span>
                              <span className={styles.routeTime}><Clock size={12} /> {route.morningPickup} - {route.afternoonDrop}</span>
                            </div>
                            <span className={styles.studentPill}><Users size={11} /> {route.students.length}</span>
                            {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>

                          {route.stops.length > 0 && (
                            <div className={styles.stopRow}>
                              {route.stops.map((stop, i) => (
                                <span key={i} className={styles.stopChip}>{stop}</span>
                              ))}
                            </div>
                          )}

                          {isOpen && (
                            route.students.length === 0 ? (
                              <p className={kit.emptyText}>No students on this route yet.</p>
                            ) : (
                              <div className={styles.manifestList}>
                                {route.students.map((st, i) => (
                                  <div key={i} className={styles.manifestRow}>
                                    <span className={styles.manifestName}>{st.firstName} {st.lastName}</span>
                                    <span className={styles.manifestMeta}>{st.admissionNo} · {st.className}</span>
                                  </div>
                                ))}
                              </div>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <MobileSheet
        open={editOpen}
        onClose={() => !saving && setEditOpen(false)}
        title="Edit My Profile"
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => setEditOpen(false)} disabled={saving}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={saveProfile} disabled={saving || !phone.trim()}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </>}
      >
        <div className={kit.field}>
          <label>Phone Number</label>
          <input className={kit.input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 024xxxxxxx" />
        </div>
        <p className={kit.helperText}>Only your contact phone number can be updated here.</p>
      </MobileSheet>
    </div>
  );
}
