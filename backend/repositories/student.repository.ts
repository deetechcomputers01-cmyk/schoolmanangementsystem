import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";

export function listStudents() {
  return prisma.student.findMany({
    orderBy: [{ class: { name: "asc" } }, { lastName: "asc" }],
    include: { class: true, guardians: true, feeRecords: true }
  });
}

export function getStudent(id: string) {
  return prisma.student.findUnique({
    where: { id },
    include: {
      class: true,
      guardians: true,
      attendance: { orderBy: { date: "desc" }, take: 30 },
      grades: { include: { subject: true }, orderBy: { createdAt: "desc" } },
      feeRecords: { include: { payments: true }, orderBy: { createdAt: "desc" } }
    }
  });
}

export function createStudent(data: Prisma.StudentCreateInput) {
  return prisma.student.create({ data, include: { class: true, guardians: true } });
}

export function updateStudent(id: string, data: Prisma.StudentUpdateInput) {
  return prisma.student.update({ where: { id }, data, include: { class: true, guardians: true } });
}

export function deleteStudent(id: string) {
  return prisma.student.delete({ where: { id } });
}
