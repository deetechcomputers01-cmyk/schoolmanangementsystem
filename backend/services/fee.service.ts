import { Prisma } from "@prisma/client";
import type { SessionUser } from "@/types/auth";
import { assertCan } from "../auth/rbac";
import { prisma } from "../prisma";
import { audit } from "./audit.service";
import { notifyUsers } from "./notification.service";
import { getSettings } from "./settings.service";

async function notifyFeeCreated(studentId: string, description: string, amountDue: number) {
  const settings = await getSettings();
  const ex = (settings.extra ?? {}) as Record<string, unknown>;
  if (ex.feeReminders === false) return;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      firstName: true,
      guardians: { where: { userId: { not: null } }, select: { userId: true } },
    },
  });
  if (!student) return;
  await notifyUsers(student.guardians.map((g) => g.userId!).filter(Boolean), {
    type: "fee_reminder",
    title: `New fee: ${description}`,
    body: `A new fee of GHS ${amountDue.toFixed(2)} (${description}) has been added for ${student.firstName}.`,
    link: "/fees",
  });
}

export function listFees() {
  return prisma.feeRecord.findMany({
    orderBy: { createdAt: "desc" },
    include: { student: { include: { class: true } }, payments: true, scholarship: true }
  });
}

/**
 * A student can hold more than one active scholarship at once, and percent
 * vs fixed types aren't directly comparable by their raw stored `value` — so
 * this compares their actual GHS effect against `grossAmount` and returns
 * whichever gives the student the larger discount.
 */
export async function pickBestScholarship(studentId: string, academicYearId: string | null | undefined, grossAmount: number) {
  const candidates = await prisma.scholarship.findMany({
    where: {
      studentId,
      status: "active",
      OR: [{ academicYearId: null }, { academicYearId: academicYearId ?? undefined }],
    },
  });
  if (candidates.length === 0) return null;

  let best = candidates[0];
  let bestDiscount = -1;
  for (const c of candidates) {
    const discount = c.type === "percent"
      ? Math.round((grossAmount * c.value) / 100 * 100) / 100
      : Math.min(c.value, grossAmount);
    if (discount > bestDiscount) { bestDiscount = discount; best = c; }
  }
  return { scholarship: best, discount: bestDiscount };
}

export async function createFee(user: SessionUser | null, input: { studentId: string; term: string; description: string; amountDue: number }) {
  assertCan(user, "fees:write");

  const activeYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
  const picked = await pickBestScholarship(input.studentId, activeYear?.id, input.amountDue);

  const discountApplied = picked?.discount ?? null;
  const amountDue = picked ? Math.max(0, Math.round((input.amountDue - picked.discount) * 100) / 100) : input.amountDue;

  const fee = await prisma.feeRecord.create({
    data: {
      ...input,
      amountDue: new Prisma.Decimal(amountDue),
      discountApplied: discountApplied !== null ? new Prisma.Decimal(discountApplied) : undefined,
      scholarshipId: picked?.scholarship.id,
      // Fully covered by the scholarship alone — register as paid, the UI distinguishes this from a cash payment.
      status: picked && amountDue <= 0 ? "paid" : "unpaid",
    },
  });
  await audit(user, "create", "FeeRecord", fee.id, { amountDue, discountApplied, scholarshipId: picked?.scholarship.id ?? null });
  notifyFeeCreated(input.studentId, input.description, amountDue).catch(() => {});
  return fee;
}

export async function createPayment(
  user: SessionUser | null,
  input: { feeRecordId: string; amount: number; method: "cash" | "mobile_money" | "bank_transfer" | "card"; reference: string }
) {
  assertCan(user, "payments:write");
  const payment = await prisma.payment.create({
    data: { ...input, amount: new Prisma.Decimal(input.amount) },
    include: { feeRecord: { include: { payments: true } } }
  });
  const fee = await prisma.feeRecord.findUnique({ where: { id: input.feeRecordId }, include: { payments: true } });
  if (fee) {
    const paid = fee.payments.reduce((sum, row) => sum + Number(row.amount), 0);
    await prisma.feeRecord.update({
      where: { id: fee.id },
      data: { status: paid >= Number(fee.amountDue) ? "paid" : paid > 0 ? "partial" : "unpaid" }
    });
  }
  await audit(user, "create", "Payment", payment.id, { amount: input.amount, reference: input.reference });
  return payment;
}
