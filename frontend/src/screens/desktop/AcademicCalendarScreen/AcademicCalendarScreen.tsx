import { requireRole } from "@backend/auth/page-guard";
import { getCurrentAcademicContext } from "@backend/services/academic.service";
import { listCalendarEvents } from "@backend/services/calendar.service";
import { prisma } from "@backend/prisma";
import { AcademicCalendarContent } from "./AcademicCalendarContent";
import { MobileAcademicCalendarContent } from "@/screens/mobile/MobileAcademicCalendarContent/MobileAcademicCalendarContent";

export const dynamic = "force-dynamic";

// Ghana is UTC+0 (no DST), so UTC date == Ghana date
function ghanaToday() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export async function AcademicCalendarScreen({ initialTab }: { initialTab?: "calendar" | "years" } = {}) {
  await requireRole("super_admin", "principal", "teacher", "staff");
  const ctx    = await getCurrentAcademicContext();
  const today  = ghanaToday();
  const [yr, mo] = [parseInt(today.slice(0, 4)), parseInt(today.slice(5, 7)) - 1];
  const [events, years] = await Promise.all([
    listCalendarEvents(yr, mo),
    prisma.academicYear.findMany({
      orderBy: { startDate: "desc" },
      include: { terms: { orderBy: { startDate: "asc" } } },
    }),
  ]);

  const initialEvents = events.map((e) => ({
    id:          e.id,
    title:       e.title,
    description: e.description,
    category:    e.category as "academic"|"exams"|"sports"|"pta"|"staff"|"holidays",
    dateISO:     e.date.toISOString().slice(0, 10),
    time:        e.time    ?? undefined,
    endTime:     e.endTime ?? undefined,
    location:    e.location ?? undefined,
    audience:    e.audience ?? undefined,
    approved:    e.approved,
  }));

  return (
    <>
      <div className="mobileOnly">
        <MobileAcademicCalendarContent
          yearName={ctx.year?.name ?? "2026/2027"}
          termName={ctx.term?.name ?? "Term 1"}
          todayISO={today}
          initialEvents={initialEvents}
        />
      </div>
      <div className="desktopOnly">
        <AcademicCalendarContent
          yearName={ctx.year?.name ?? "2026/2027"}
          termName={ctx.term?.name ?? "Term 1"}
          todayISO={today}
          initialTab={initialTab ?? "calendar"}
          initialEvents={initialEvents}
          years={years.map((y) => ({
            id:        y.id,
            name:      y.name,
            startDate: y.startDate.toISOString().slice(0, 10),
            endDate:   y.endDate.toISOString().slice(0, 10),
            isCurrent: y.isCurrent,
            terms: y.terms.map((t) => ({
              id:        t.id,
              name:      t.name,
              startDate: t.startDate.toISOString().slice(0, 10),
              endDate:   t.endDate.toISOString().slice(0, 10),
              isCurrent: t.isCurrent,
            })),
          }))}
        />
      </div>
    </>
  );
}
