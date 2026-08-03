import { prisma } from "../prisma";

export async function getDashboardStats() {
  const [students, staff, attendanceToday, unpaidFees, classes] = await Promise.all([
    prisma.student.count(),
    prisma.staff.count(),
    prisma.attendance.count({ where: { date: { gte: new Date(new Date().toDateString()) }, status: { in: ["present", "late"] } } }),
    prisma.feeRecord.count({ where: { status: { in: ["unpaid", "partial"] } } }),
    prisma.class.count({ where: { isActive: true } }),
  ]);
  return { students, staff, attendanceToday, unpaidFees, classes };
}

export async function getClasses(opts?: { includeInactive?: boolean }) {
  return prisma.class.findMany({
    where: opts?.includeInactive ? undefined : { isActive: true },
    include: { classTeacher: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: [{ order: { sort: "asc", nulls: "last" } }, { name: "asc" }],
  });
}

export async function getSubjects() {
  return prisma.subject.findMany({ orderBy: { name: "asc" }, include: { class: true, staff: true } });
}
