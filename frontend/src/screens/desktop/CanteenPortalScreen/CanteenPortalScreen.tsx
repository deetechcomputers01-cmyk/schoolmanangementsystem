import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { getCanteenPortalData } from "@backend/services/portal.service";

export const dynamic = "force-dynamic";

const MEAL_COLORS: Record<string, string> = {
  Breakfast: "bg-amber-50 border-amber-200 text-amber-800",
  Lunch:     "bg-green-50 border-green-200 text-green-800",
  Dinner:    "bg-indigo-50 border-indigo-200 text-indigo-800",
};

export async function CanteenPortalScreen() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getCanteenPortalData().catch(() => null);
  if (!data) {
    return <div className="p-8 text-center text-gray-400">Could not load canteen data.</div>;
  }

  const { weekOf, menuGrid, studentCount, today } = data;
  const todayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][
    new Date(today + "T12:00:00").getDay()
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-green-700 to-green-500 rounded-2xl p-6 text-white">
        <p className="text-green-200 text-sm">Canteen Portal</p>
        <h1 className="text-2xl font-bold mt-1">Meal Schedule</h1>
        <p className="text-green-100 mt-1">Week of {weekOf} · {studentCount} students</p>
      </div>

      {/* Today highlight */}
      {menuGrid.some((d) => d.day === todayName) && (
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Today — {todayName}</h2>
          <div className="grid grid-cols-3 gap-4">
            {menuGrid.find((d) => d.day === todayName)?.meals.map((meal) => (
              <div key={meal.mealType} className={`rounded-lg border p-4 ${MEAL_COLORS[meal.mealType] ?? "bg-gray-50 border-gray-200"}`}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2">{meal.mealType}</p>
                {meal.items.length === 0 ? (
                  <p className="text-sm opacity-60">Not set</p>
                ) : (
                  <ul className="space-y-1">
                    {meal.items.map((item, i) => <li key={i} className="text-sm">• {item}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full week table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Full Week Menu</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 text-xs">
                <th className="px-4 py-3 font-medium">Day</th>
                <th className="px-4 py-3 font-medium">Breakfast</th>
                <th className="px-4 py-3 font-medium">Lunch</th>
                <th className="px-4 py-3 font-medium">Dinner</th>
              </tr>
            </thead>
            <tbody>
              {menuGrid.map((dayRow) => (
                <tr key={dayRow.day} className={`border-t ${dayRow.day === todayName ? "bg-green-50" : ""}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {dayRow.day}
                    {dayRow.day === todayName && (
                      <span className="ml-2 text-xs bg-green-600 text-white px-1.5 py-0.5 rounded">Today</span>
                    )}
                  </td>
                  {dayRow.meals.map((meal) => (
                    <td key={meal.mealType} className="px-4 py-3 text-gray-600">
                      {meal.items.length === 0 ? "—" : meal.items.join(", ")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
