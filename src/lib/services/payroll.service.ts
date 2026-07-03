import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types/auth";
import { audit } from "./audit.service";

function assertAdmin(actor: SessionUser) {
  if (actor.role !== "super_admin" && actor.role !== "principal") throw new Error("Forbidden");
}

export async function listStaffWithSalaries() {
  return prisma.staff.findMany({
    include: {
      salary:  true,
      payslips: { orderBy: { month: "desc" }, take: 1 },
      user:    { select: { name: true, email: true, isActive: true } }
    },
    orderBy: { lastName: "asc" }
  });
}

export async function setSalary(
  actor: SessionUser,
  staffId: string,
  data: { basicSalary: number; allowances: number; deductions: number; effectiveFrom: string }
) {
  assertAdmin(actor);
  const salary = await prisma.staffSalary.upsert({
    where:  { staffId },
    create: { staffId, basicSalary: data.basicSalary, allowances: data.allowances, deductions: data.deductions, effectiveFrom: new Date(data.effectiveFrom) },
    update: { basicSalary: data.basicSalary, allowances: data.allowances, deductions: data.deductions, effectiveFrom: new Date(data.effectiveFrom) }
  });
  await audit(actor, "set_salary", "StaffSalary", salary.id, { staffId, basicSalary: data.basicSalary });
  return salary;
}

export async function generatePayslip(actor: SessionUser, staffId: string, month: string) {
  assertAdmin(actor);
  const salary = await prisma.staffSalary.findUniqueOrThrow({ where: { staffId } });
  const netPay = Number(salary.basicSalary) + Number(salary.allowances) - Number(salary.deductions);

  const payslip = await prisma.payslip.upsert({
    where:  { staffId_month: { staffId, month } },
    create: {
      staffId, salaryId: salary.id, month,
      basicSalary: salary.basicSalary, allowances: salary.allowances,
      deductions: salary.deductions, netPay
    },
    update: {
      basicSalary: salary.basicSalary, allowances: salary.allowances,
      deductions: salary.deductions, netPay, status: "draft"
    },
    include: { staff: { select: { firstName: true, lastName: true } } }
  });
  await audit(actor, "generate_payslip", "Payslip", payslip.id, { staffId, month });
  return payslip;
}

export async function updatePayslipStatus(actor: SessionUser, id: string, status: "approved" | "paid") {
  assertAdmin(actor);
  const payslip = await prisma.payslip.update({
    where: { id },
    data: {
      status,
      ...(status === "paid" ? { paidAt: new Date() } : {})
    },
    include: { staff: { select: { firstName: true, lastName: true } } }
  });
  await audit(actor, `payslip_${status}`, "Payslip", id, {});
  return payslip;
}

export async function listPayslips(staffId?: string) {
  return prisma.payslip.findMany({
    where: staffId ? { staffId } : {},
    include: { staff: { select: { firstName: true, lastName: true, roleTitle: true } } },
    orderBy: [{ month: "desc" }, { createdAt: "desc" }]
  });
}
