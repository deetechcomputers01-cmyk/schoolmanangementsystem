"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X } from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { LocationBroadcaster } from "@/components/transport/LocationBroadcaster";

export interface PortalStudentRow { firstName: string; lastName: string; admissionNo: string; className: string }
export interface PortalRouteRow { id: string; name: string; morningPickup: string; afternoonDrop: string; stops: string[]; students: PortalStudentRow[] }
export interface PortalVehicleRow { id: string; regNo: string; make: string; type: string; capacity: number; routes: PortalRouteRow[] }
export interface TransportPortalContentProps {
  staffRecord: { firstName: string; lastName: string; staffNo: string; phone: string } | null;
  vehicles: PortalVehicleRow[];
  totalStudents: number;
}

/** Driver's own Transport Portal — desktop view. Visuals intentionally kept
 *  close to the screen's original raw-Tailwind styling (not the app's
 *  --clr-app-* design system used elsewhere), just split out into its own
 *  client component so an Edit Profile action (self-service phone update,
 *  PATCH /api/staff/me) could be added without restructuring the rest. */
export function TransportPortalContent({ staffRecord, vehicles, totalStudents }: TransportPortalContentProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const activeRoutes = vehicles.reduce((sum, v) => sum + v.routes.length, 0);

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
    <div className="space-y-6 p-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-2xl p-6 text-white flex items-start justify-between">
        <div>
          <p className="text-blue-200 text-sm">Transport Portal</p>
          <h1 className="text-2xl font-bold mt-1">
            {staffRecord?.firstName} {staffRecord?.lastName}
          </h1>
          <p className="text-blue-100 mt-1">Driver · {staffRecord?.staffNo}</p>
        </div>
        <button
          type="button"
          onClick={openEdit}
          aria-label="Edit Profile"
          className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
        >
          <Pencil size={16} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Vehicles Assigned", value: vehicles.length },
          { label: "Active Routes",     value: activeRoutes },
          { label: "Students on Board", value: totalStudents },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border p-4 text-center shadow-sm">
            <p className="text-3xl font-bold text-blue-700">{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Vehicles + Routes */}
      {vehicles.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
          No vehicles assigned yet.
        </div>
      ) : (
        vehicles.map((vehicle) => (
          <div key={vehicle.id} className="space-y-3">
            <LocationBroadcaster vehicleId={vehicle.id} vehicleLabel={`${vehicle.regNo} · ${vehicle.make}`} />
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{vehicle.make}</p>
                <p className="text-sm text-gray-500">{vehicle.regNo} · {vehicle.type} · {vehicle.capacity} seats</p>
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                {vehicle.routes.length} route{vehicle.routes.length !== 1 ? "s" : ""}
              </span>
            </div>

            {vehicle.routes.map((route) => (
              <div key={route.id} className="px-6 py-4 border-b last:border-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{route.name}</h3>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>Morning: {route.morningPickup}</span>
                    <span>Afternoon: {route.afternoonDrop}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {route.stops.map((stop, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      {stop}
                    </span>
                  ))}
                </div>

                {route.students.length > 0 && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 text-xs border-b">
                        <th className="pb-2">Student</th>
                        <th className="pb-2">Admission No</th>
                        <th className="pb-2">Class</th>
                      </tr>
                    </thead>
                    <tbody>
                      {route.students.map((st, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 font-medium">{st.firstName} {st.lastName}</td>
                          <td className="py-2 text-gray-500">{st.admissionNo}</td>
                          <td className="py-2 text-gray-500">{st.className}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
          </div>
        ))
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !saving && setEditOpen(false)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-900">Edit My Profile</h2>
              <button type="button" onClick={() => setEditOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="px-5 py-4 space-y-2">
              <label className="text-sm font-medium text-gray-700">Phone Number</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-gray-400">Only your contact phone number can be updated here.</p>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t">
              <button type="button" onClick={() => setEditOpen(false)} disabled={saving} className="px-4 py-2 text-sm rounded-lg border text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={saveProfile} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
