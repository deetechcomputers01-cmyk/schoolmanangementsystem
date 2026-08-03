import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { getHealthClinicPortalData } from "@backend/services/portal.service";

export const dynamic = "force-dynamic";

export async function HealthClinicPortalScreen() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getHealthClinicPortalData().catch(() => null);
  if (!data) {
    return <div className="p-8 text-center text-gray-400">Could not load health clinic data.</div>;
  }

  const { todayVisits, todayVaccinations, healthRecordCount, studentCount, recentSickVisits } = data;
  const coveragePercent = studentCount > 0
    ? Math.round((healthRecordCount / studentCount) * 100)
    : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-red-600 to-rose-400 rounded-2xl p-6 text-white">
        <p className="text-red-200 text-sm">Health Clinic</p>
        <h1 className="text-2xl font-bold mt-1">Clinic Dashboard</h1>
        <p className="text-red-100 mt-1">{healthRecordCount} of {studentCount} students on record ({coveragePercent}%)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Sick Visits Today",  value: todayVisits.length,       color: "text-rose-600" },
          { label: "Vaccinations Today", value: todayVaccinations.length, color: "text-blue-600" },
          { label: "Health Records",      value: healthRecordCount,        color: "text-green-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border p-4 text-center shadow-sm">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Today's visits */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Today&apos;s Sick Visits</h2>
        </div>
        {todayVisits.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400">No sick visits recorded today.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 text-xs">
                <th className="px-6 py-3 font-medium">Student</th>
                <th className="px-6 py-3 font-medium">Class</th>
                <th className="px-6 py-3 font-medium">Complaint</th>
                <th className="px-6 py-3 font-medium">Treatment</th>
                <th className="px-6 py-3 font-medium">Blood Group</th>
              </tr>
            </thead>
            <tbody>
              {todayVisits.map((visit) => (
                <tr key={visit.id} className="border-t">
                  <td className="px-6 py-3 font-medium">
                    {visit.healthRecord.student.firstName} {visit.healthRecord.student.lastName}
                  </td>
                  <td className="px-6 py-3 text-gray-500">{visit.healthRecord.student.class.name}</td>
                  <td className="px-6 py-3">{visit.complaint}</td>
                  <td className="px-6 py-3 text-gray-600">{visit.treatment ?? "—"}</td>
                  <td className="px-6 py-3 text-gray-500">{visit.healthRecord.bloodGroup ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent visits */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Recent Clinic Visits</h2>
        </div>
        {recentSickVisits.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400">No recent visits.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 text-xs">
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Student</th>
                <th className="px-6 py-3 font-medium">Admission No</th>
                <th className="px-6 py-3 font-medium">Complaint</th>
                <th className="px-6 py-3 font-medium">Treatment</th>
              </tr>
            </thead>
            <tbody>
              {recentSickVisits.map((visit) => (
                <tr key={visit.id} className="border-t">
                  <td className="px-6 py-3 text-gray-500">
                    {new Date(visit.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 font-medium">
                    {visit.healthRecord.student.firstName} {visit.healthRecord.student.lastName}
                  </td>
                  <td className="px-6 py-3 text-gray-500">{visit.healthRecord.student.admissionNo}</td>
                  <td className="px-6 py-3">{visit.complaint}</td>
                  <td className="px-6 py-3 text-gray-600">{visit.treatment ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
