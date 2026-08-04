import { requireRole } from "@backend/auth/page-guard";
import { prisma } from "@backend/prisma";
import { CanteenContent } from "./CanteenContent";
import { MobileCanteenContent } from "@/screens/mobile/MobileCanteenContent/MobileCanteenContent";

export const dynamic = "force-dynamic";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"];

function mondayOf(d: Date) {
  const m = new Date(d);
  m.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return m;
}

export async function CanteenScreen({ weekParam }: { weekParam?: string }) {
  await requireRole("super_admin", "principal", "staff");

  const today = new Date();
  const parsedWeek = weekParam && /^\d{4}-\d{2}-\d{2}$/.test(weekParam) ? new Date(weekParam + "T00:00:00.000Z") : null;
  const monday = mondayOf(parsedWeek ?? today);
  const weekOf = monday.toISOString().slice(0, 10);
  const weekEnd = new Date(monday);
  weekEnd.setDate(monday.getDate() + 4);

  const todayStart = new Date(today.toISOString().slice(0, 10) + "T00:00:00.000Z");
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);

  const [currentWeekMenus, students, dietaryAlertCount, servedTodayCount, servedYesterdayCount, recentServings] = await Promise.all([
    prisma.mealMenu.findMany({
      where: { weekOf },
      orderBy: [{ day: "asc" }, { mealType: "asc" }],
    }),
    prisma.student.findMany({
      include: {
        class:        { select: { name: true } },
        healthRecord: { select: { allergies: true, conditions: true } },
        guardians:    { take: 1, select: { name: true, phone: true, relation: true } },
      },
      orderBy: [{ firstName: "asc" }],
    }),
    prisma.healthRecord.count({ where: { allergies: { not: null } } }),
    prisma.mealServing.count({ where: { servedAt: { gte: todayStart } } }),
    prisma.mealServing.count({ where: { servedAt: { gte: yesterdayStart, lt: todayStart } } }),
    prisma.mealServing.findMany({
      where: { servedAt: { gte: todayStart } },
      include: {
        student: { select: { firstName: true, lastName: true, class: { select: { name: true } } } },
        servedBy: { select: { name: true } },
        menu: { select: { mealType: true } },
      },
      orderBy: { servedAt: "desc" },
      take: 15,
    }),
  ]);

  const menuGrid = DAYS.map((day) => ({
    day,
    meals: MEAL_TYPES.map((mealType) => {
      const menu = currentWeekMenus.find((m) => m.day === day && m.mealType === mealType);
      return { mealType, id: menu?.id ?? null, items: menu?.items ?? [] };
    }),
  }));

  const studentRows = students.map((s) => ({
    id:         s.id,
    name:       `${s.firstName} ${s.lastName}`,
    className:  s.class.name,
    allergies:  s.healthRecord?.allergies ?? null,
    conditions: s.healthRecord?.conditions ?? null,
    guardian:   s.guardians[0] ?? null,
  }));

  const servingLog = recentServings.map((r) => ({
    id:        r.id,
    studentName: `${r.student.firstName} ${r.student.lastName}`,
    className: r.student.class.name,
    mealType:  r.menu.mealType,
    servedAt:  r.servedAt.toISOString(),
    servedByName: r.servedBy.name,
  }));

  const weekLabel = `${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  const stats = {
    servedToday:     servedTodayCount,
    servedYesterday: servedYesterdayCount,
    dietaryAlerts:   dietaryAlertCount,
    studentCount:    students.length,
    totalDishesThisWeek: currentWeekMenus.reduce((s, m) => s + m.items.length, 0),
    coverage: {
      Breakfast: currentWeekMenus.some((m) => m.mealType === "Breakfast" && m.items.length > 0),
      Lunch:     currentWeekMenus.some((m) => m.mealType === "Lunch" && m.items.length > 0),
      Dinner:    currentWeekMenus.some((m) => m.mealType === "Dinner" && m.items.length > 0),
    },
  };

  return (
    <>
      <div className="mobileOnly">
        <MobileCanteenContent weekOf={weekOf} weekLabel={weekLabel} menuGrid={menuGrid} students={studentRows} servingLog={servingLog} stats={stats} />
      </div>
      <div className="desktopOnly">
        <CanteenContent weekOf={weekOf} weekLabel={weekLabel} menuGrid={menuGrid} students={studentRows} servingLog={servingLog} stats={stats} />
      </div>
    </>
  );
}
