import type { SessionUser } from "@/types/auth";
import { assertCan } from "../auth/rbac";
import { prisma } from "../prisma";
import { audit } from "./audit.service";

// Use $queryRaw to get all columns including new ones (recurrence, effectiveDate, notes)
// that exist in the DB but may not yet be in the generated Prisma client
export async function listTimetable() {
  const rows = await prisma.$queryRaw<Array<{
    id: string;
    classId: string; subjectId: string;
    day: string; startsAt: string; endsAt: string; room: string;
    recurrence: string; effectiveDate: string | null; notes: string | null;
    className: string; subjectName: string; subjectCode: string;
    staffFirstName: string | null; staffLastName: string | null;
    staffId: string | null;
  }>>`
    SELECT
      ts.id,
      ts."classId",
      ts."subjectId",
      ts.day,
      ts."startsAt",
      ts."endsAt",
      ts.room,
      COALESCE(ts.recurrence, 'weekly') AS recurrence,
      ts."effectiveDate",
      ts.notes,
      c.name AS "className",
      s.name AS "subjectName",
      s.code AS "subjectCode",
      sf."firstName" AS "staffFirstName",
      sf."lastName"  AS "staffLastName",
      sf.id          AS "staffId"
    FROM "TimetableSlot" ts
    JOIN "Class"   c  ON ts."classId"   = c.id
    JOIN "Subject" s  ON ts."subjectId" = s.id
    LEFT JOIN "Staff" sf ON s."staffId" = sf.id
    ORDER BY ts.day, ts."startsAt"
  `;
  return rows;
}

type CreateInput = {
  classId: string; subjectId: string;
  day: string; startsAt: string; endsAt: string; room: string;
  recurrence?: string; effectiveDate?: string; notes?: string;
};

export async function createTimetableSlot(user: SessionUser | null, input: CreateInput) {
  assertCan(user, "timetable:write");

  // Step 1: Create with the fields the Prisma client knows about
  const base = await prisma.timetableSlot.create({
    data: {
      classId:   input.classId,
      subjectId: input.subjectId,
      day:       input.day,
      startsAt:  input.startsAt,
      endsAt:    input.endsAt,
      room:      input.room,
    },
  });

  // Step 2: Set new fields via raw SQL (Prisma client may not yet include them)
  const recurrence    = input.recurrence    ?? "weekly";
  const effectiveDate = input.effectiveDate ?? null;
  const notes         = input.notes         ?? null;

  await prisma.$executeRaw`
    UPDATE "TimetableSlot"
    SET
      recurrence     = ${recurrence},
      "effectiveDate" = ${effectiveDate},
      notes          = ${notes},
      "updatedAt"    = now()
    WHERE id = ${base.id}
  `;

  await audit(user, "create", "TimetableSlot", base.id, input);

  return { ...base, recurrence, effectiveDate, notes };
}

export async function updateTimetableSlot(
  user: SessionUser | null,
  id: string,
  input: Partial<CreateInput>
) {
  assertCan(user, "timetable:write");

  // Update base fields (known to Prisma client)
  const baseUpdate: Record<string, unknown> = {};
  if (input.room      !== undefined) baseUpdate.room      = input.room;
  if (input.classId   !== undefined) baseUpdate.classId   = input.classId;
  if (input.subjectId !== undefined) baseUpdate.subjectId = input.subjectId;
  if (input.day       !== undefined) baseUpdate.day       = input.day;
  if (input.startsAt  !== undefined) baseUpdate.startsAt  = input.startsAt;
  if (input.endsAt    !== undefined) baseUpdate.endsAt    = input.endsAt;

  if (Object.keys(baseUpdate).length > 0) {
    await prisma.timetableSlot.update({ where: { id }, data: baseUpdate });
  }

  // Update new fields via raw SQL if provided
  if (input.notes !== undefined || input.recurrence !== undefined || input.effectiveDate !== undefined) {
    const notes         = input.notes         ?? null;
    const recurrence    = input.recurrence    ?? "weekly";
    const effectiveDate = input.effectiveDate ?? null;
    await prisma.$executeRaw`
      UPDATE "TimetableSlot"
      SET notes = ${notes}, recurrence = ${recurrence}, "effectiveDate" = ${effectiveDate}, "updatedAt" = now()
      WHERE id = ${id}
    `;
  }

  await audit(user, "update", "TimetableSlot", id, input);
  return { id, ...input };
}

export async function removeTimetableSlot(user: SessionUser | null, id: string) {
  assertCan(user, "timetable:write");
  const slot = await prisma.timetableSlot.delete({ where: { id } });
  await audit(user, "delete", "TimetableSlot", id);
  return slot;
}
