import type { AttendanceStatus } from "@prisma/client";
import type { SessionUser } from "@/types/auth";
import { assertCan } from "../auth/rbac";
import { prisma } from "../prisma";
import { audit } from "./audit.service";

export function listAttendance() {
  return prisma.attendance.findMany({
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
  return records;
}
