import type { AttendanceStatus } from "@prisma/client";
import type { SessionUser } from "@/types/auth";
import { assertCan } from "../auth/rbac";
import { prisma } from "../prisma";
import { audit } from "./audit.service";
import { notifyUsers } from "./notification.service";
import { getSettings } from "./settings.service";

async function notifyGuardiansOfAbsences(studentIds: string[], date: Date) {
  if (studentIds.length === 0) return;
  const settings = await getSettings();
  const ex = (settings.extra ?? {}) as Record<string, unknown>;
  if (ex.attendanceAlerts === false) return;

  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    select: {
      firstName: true, lastName: true,
      guardians: { where: { userId: { not: null } }, select: { userId: true } },
    },
  });
  const dateLabel = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  await Promise.all(
    students.map((s) =>
      notifyUsers(
        s.guardians.map((g) => g.userId!).filter(Boolean),
        {
          type: "attendance_alert",
          title: `${s.firstName} ${s.lastName} was marked absent`,
          body: `${s.firstName} was recorded absent on ${dateLabel}.`,
          link: "/attendance",
        }
      )
    )
  );
}

export function listAttendance(classIds?: string[]) {
  return prisma.attendance.findMany({
    where: classIds?.length ? { classId: { in: classIds } } : undefined,
    orderBy: { date: "desc" },
    take: 200,
    include: { student: { include: { class: true } } }
  });
}

export interface AttendanceTrendPoint { label: string; present: number; absent: number; late: number }

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Real, whole-school daily/weekly trend for the dashboard's Attendance
// widget — grouped in the database, not sliced from listAttendance()'s
// 200-row cap (which only covers a few days on a school with real
// enrolment numbers, making a "monthly" view built from it inaccurate).
export async function getAttendanceTrend(): Promise<{ week: AttendanceTrendPoint[]; month: AttendanceTrendPoint[] }> {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 29);
  start.setHours(0, 0, 0, 0);

  const rows = await prisma.attendance.groupBy({
    by: ["date", "status"],
    where: { date: { gte: start } },
    _count: { _all: true },
  });

  const byDay = new Map<string, { present: number; absent: number; late: number }>();
  for (const row of rows) {
    const key = dayKey(row.date);
    const bucket = byDay.get(key) ?? { present: 0, absent: 0, late: 0 };
    if (row.status === "present") bucket.present += row._count._all;
    else if (row.status === "late") bucket.late += row._count._all;
    else bucket.absent += row._count._all; // "absent" + "excused" folded together, matching the dashboard's existing convention
    byDay.set(key, bucket);
  }

  const week: AttendanceTrendPoint[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    const bucket = byDay.get(dayKey(d)) ?? { present: 0, absent: 0, late: 0 };
    return { label: d.toLocaleDateString("en-GB", { weekday: "short" }), ...bucket };
  });

  // Last 30 days grouped into 5 weekly buckets (oldest first) — a 30-bar
  // daily chart would be unreadable at this width, weekly buckets keep the
  // "monthly" view legible while still real, not resampled/estimated.
  const month: AttendanceTrendPoint[] = [];
  for (let w = 4; w >= 0; w--) {
    const bucket = { present: 0, absent: 0, late: 0 };
    for (let d = 0; d < 7; d++) {
      const dayOffset = w * 7 + d;
      if (dayOffset > 29) continue;
      const date = new Date(now);
      date.setDate(now.getDate() - dayOffset);
      const dayBucket = byDay.get(dayKey(date));
      if (dayBucket) {
        bucket.present += dayBucket.present;
        bucket.absent += dayBucket.absent;
        bucket.late += dayBucket.late;
      }
    }
    month.unshift({ label: `Week ${5 - w}`, ...bucket });
  }

  return { week, month };
}

export async function recordAttendance(
  user: SessionUser | null,
  input: { classId: string; date: string; records: { studentId: string; status: AttendanceStatus; note?: string }[] }
) {
  assertCan(user, "attendance:write");
  const date = new Date(input.date);

  const existing = await prisma.attendance.findMany({
    where: { date, studentId: { in: input.records.map((r) => r.studentId) } },
    select: { studentId: true, status: true },
  });
  const previousStatus = new Map(existing.map((e) => [e.studentId, e.status]));

  const records = await prisma.$transaction(
    input.records.map((record) =>
      prisma.attendance.upsert({
        where: { studentId_date: { studentId: record.studentId, date } },
        create: { ...record, date, classId: input.classId },
        update: { status: record.status, note: record.note, classId: input.classId }
      })
    )
  );
  await audit(user, "upsert", "Attendance", input.classId, { date: input.date, count: records.length });

  // Only notify guardians for records newly transitioning INTO "absent" — avoids
  // re-notifying every time a teacher re-saves the same day's attendance sheet.
  const newlyAbsent = input.records
    .filter((r) => r.status === "absent" && previousStatus.get(r.studentId) !== "absent")
    .map((r) => r.studentId);
  notifyGuardiansOfAbsences(newlyAbsent, date).catch(() => {});

  return records;
}
