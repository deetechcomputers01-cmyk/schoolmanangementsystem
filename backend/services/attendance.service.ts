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
