import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types/auth";
import { audit } from "./audit.service";

export async function listDisciplinaryRecords(studentId?: string) {
  return prisma.disciplinaryRecord.findMany({
    where: studentId ? { studentId } : {},
    include: {
      student:    { select: { firstName: true, lastName: true, admissionNo: true, class: { select: { name: true } } } },
      reportedBy: { select: { name: true, role: true } }
    },
    orderBy: { date: "desc" }
  });
}

export async function createDisciplinaryRecord(
  actor: SessionUser,
  data: { studentId: string; category: string; description: string; action: string; date: string }
) {
  if (actor.role !== "super_admin" && actor.role !== "principal" && actor.role !== "teacher")
    throw new Error("Forbidden");

  const record = await prisma.disciplinaryRecord.create({
    data: {
      studentId:    data.studentId,
      category:     data.category,
      description:  data.description,
      action:       data.action,
      date:         new Date(data.date),
      reportedById: actor.id
    },
    include: { student: { select: { firstName: true, lastName: true } } }
  });
  await audit(actor, "create_disciplinary", "DisciplinaryRecord", record.id, { studentId: data.studentId, category: data.category });
  return record;
}

export async function deleteDisciplinaryRecord(actor: SessionUser, id: string) {
  if (actor.role !== "super_admin" && actor.role !== "principal") throw new Error("Forbidden");
  const record = await prisma.disciplinaryRecord.findUniqueOrThrow({ where: { id } });
  await prisma.disciplinaryRecord.delete({ where: { id } });
  await audit(actor, "delete_disciplinary", "DisciplinaryRecord", id, {});
  return record;
}
