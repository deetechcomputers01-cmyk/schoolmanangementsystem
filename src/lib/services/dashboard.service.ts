import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const [students, staff, attendanceToday, unpaidFees] = await Promise.all([
    prisma.student.count(),
    prisma.staff.count(),
    prisma.attendance.count({ where: { date: { gte: new Date(new Date().toDateString()) } } }),
    prisma.feeRecord.count({ where: { status: { in: ["unpaid", "partial"] } } })
  ]);
  return { students, staff, attendanceToday, unpaidFees };
}

export async function getClasses() {
  return prisma.class.findMany({ orderBy: { name: "asc" } });
}

export async function getSubjects() {
  return prisma.subject.findMany({ orderBy: { name: "asc" }, include: { class: true } });
}
