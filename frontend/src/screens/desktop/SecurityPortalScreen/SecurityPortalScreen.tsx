import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { getSecurityPortalData } from "@backend/services/portal.service";

export const dynamic = "force-dynamic";

export async function SecurityPortalScreen() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getSecurityPortalData(user.id).catch(() => null);
  if (!data) {
    return <div className="p-8 text-center text-gray-400">Could not load security data.</div>;
  }

  const { staffRecord, todayLogs, recentLogs, openCount, totalToday } = data;

  return (
    <div className="space-y-6 p-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-600 rounded-2xl p-6 text-white">
        <p className="text-slate-400 text-sm">Security Portal</p>
        <h1 className="text-2xl font-bold mt-1">
          {staffRecord?.firstName} {staffRecord?.lastName}
        </h1>
        <p className="text-slate-300 mt-1">Gate Security Officer</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Visitors Today",      value: totalToday,              color: "text-slate-700" },
          { label: "Currently on Campus", value: openCount,               color: "text-orange-600" },
          { label: "Checked Out Today",   value: totalToday - openCount,  color: "text-green-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border p-4 text-center shadow-sm">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Today's visitors */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Today&apos;s Visitors</h2>
          {openCount > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
              {openCount} still on campus
            </span>
          )}
        </div>
        {todayLogs.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400">No visitors logged today.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 text-xs">
                  <th className="px-6 py-3 font-medium">Visitor</th>
                  <th className="px-6 py-3 font-medium">Phone</th>
                  <th className="px-6 py-3 font-medium">Purpose</th>
                  <th className="px-6 py-3 font-medium">Host</th>
                  <th className="px-6 py-3 font-medium">Entry</th>
                  <th className="px-6 py-3 font-medium">Exit</th>
                  <th className="px-6 py-3 font-medium">Badge</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {todayLogs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="px-6 py-3 font-medium">{log.visitorName}</td>
                    <td className="px-6 py-3 text-gray-500">{log.phone ?? "—"}</td>
                    <td className="px-6 py-3">{log.purpose}</td>
                    <td className="px-6 py-3 text-gray-600">{log.hostName}</td>
                    <td className="px-6 py-3 text-gray-500">
                      {new Date(log.entryTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {log.exitTime
                        ? new Date(log.exitTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>
                    <td className="px-6 py-3 text-gray-500">{log.badgeNo ?? "—"}</td>
                    <td className="px-6 py-3">
                      {log.exitTime ? (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Out</span>
                      ) : (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">On Campus</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent visitor log */}
      {recentLogs.length > todayLogs.length && (
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Recent Visitor Log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 text-xs">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Visitor</th>
                  <th className="px-6 py-3 font-medium">Purpose</th>
                  <th className="px-6 py-3 font-medium">Host</th>
                  <th className="px-6 py-3 font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => {
                  const entry = new Date(log.entryTime);
                  const exit  = log.exitTime ? new Date(log.exitTime) : null;
                  const mins  = exit ? Math.round((exit.getTime() - entry.getTime()) / 60000) : null;
                  return (
                    <tr key={log.id} className="border-t">
                      <td className="px-6 py-3 text-gray-500">{entry.toLocaleDateString()}</td>
                      <td className="px-6 py-3 font-medium">{log.visitorName}</td>
                      <td className="px-6 py-3">{log.purpose}</td>
                      <td className="px-6 py-3 text-gray-600">{log.hostName}</td>
                      <td className="px-6 py-3 text-gray-500">
                        {mins !== null ? `${mins} min` : "Ongoing"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
