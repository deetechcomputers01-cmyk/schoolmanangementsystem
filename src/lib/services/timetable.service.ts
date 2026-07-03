import type { SessionUser } from "@/types/auth";
import { assertCan } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { audit } from "./audit.service";

export function listTimetable() {
  return prisma.timetableSlot.findMany({
    orderBy: [{ day: "asc" }, { startsAt: "asc" }],
    include: { class: true, subject: { include: { staff: true } } }
  });
}

export async function createTimetableSlot(
  user: SessionUser | null,
  input: { classId: string; subjectId: string; day: string; startsAt: string; endsAt: string; room: string }
) {
  assertCan(user, "timetable:write");
  const slot = await prisma.timetableSlot.create({ data: input });
  await audit(user, "create", "TimetableSlot", slot.id, input);
  return slot;
}

export async function updateTimetableSlot(
  user: SessionUser | null,
  id: string,
  input: Partial<{ classId: string; subjectId: string; day: string; startsAt: string; endsAt: string; room: string }>
) {
  assertCan(user, "timetable:write");
  const slot = await prisma.timetableSlot.update({ where: { id }, data: input });
  await audit(user, "update", "TimetableSlot", id, input);
  return slot;
}

export async function removeTimetableSlot(user: SessionUser | null, id: string) {
  assertCan(user, "timetable:write");
  const slot = await prisma.timetableSlot.delete({ where: { id } });
  await audit(user, "delete", "TimetableSlot", id);
  return slot;
}
