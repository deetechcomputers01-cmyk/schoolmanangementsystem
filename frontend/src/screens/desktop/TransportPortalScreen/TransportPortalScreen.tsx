import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { getTransportPortalData } from "@backend/services/portal.service";
import { LocationBroadcaster } from "@/components/transport/LocationBroadcaster";

export const dynamic = "force-dynamic";

export async function TransportPortalScreen() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getTransportPortalData(user.id).catch(() => null);
  if (!data) {
    return (
      <div className="p-8 text-center text-gray-400">
        No transport data found. Please contact your administrator.
      </div>
    );
  }

  const { staffRecord, vehicles, allRoutes, totalStudents } = data;

  return (
    <div className="space-y-6 p-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-2xl p-6 text-white">
        <p className="text-blue-200 text-sm">Transport Portal</p>
        <h1 className="text-2xl font-bold mt-1">
          {staffRecord?.firstName} {staffRecord?.lastName}
        </h1>
        <p className="text-blue-100 mt-1">Driver · {staffRecord?.staffNo}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Vehicles Assigned", value: vehicles.length },
          { label: "Active Routes",     value: allRoutes.length },
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
                      {route.students.map((st) => (
                        <tr key={st.id} className="border-b last:border-0">
                          <td className="py-2 font-medium">{st.student.firstName} {st.student.lastName}</td>
                          <td className="py-2 text-gray-500">{st.student.admissionNo}</td>
                          <td className="py-2 text-gray-500">{st.student.class.name}</td>
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
    </div>
  );
}
