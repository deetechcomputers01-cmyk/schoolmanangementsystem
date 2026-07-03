import { Prisma } from "@prisma/client";
import type { SessionUser } from "@/types/auth";
import { assertCan } from "../auth/rbac";
import { prisma } from "../prisma";
import { audit } from "./audit.service";

export function listFees() {
  return prisma.feeRecord.findMany({
    orderBy: { createdAt: "desc" },
    include: { student: { include: { class: true } }, payments: true }
  });
}

export async function createFee(user: SessionUser | null, input: { studentId: string; term: string; description: string; amountDue: number }) {
  assertCan(user, "fees:write");
  const fee = await prisma.feeRecord.create({ data: { ...input, amountDue: new Prisma.Decimal(input.amountDue) } });
  await audit(user, "create", "FeeRecord", fee.id, { amountDue: input.amountDue });
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
