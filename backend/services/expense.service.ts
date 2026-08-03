import type { SessionUser } from "@/types/auth";
import { prisma } from "../prisma";
import { audit } from "./audit.service";

function assertCanRecord(actor: SessionUser | null) {
  if (!actor || !["super_admin", "principal", "staff"].includes(actor.role)) throw new Error("Forbidden");
}

export function listExpenses() {
  return prisma.expense.findMany({
    include: { recordedBy: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  });
}

export async function createExpense(
  actor: SessionUser,
  input: { category: string; description: string; amount: number; vendor?: string; date: string }
) {
  assertCanRecord(actor);
  if (input.amount <= 0) throw new Error("Amount must be greater than 0");

  const approvalRequest = await prisma.approvalRequest.create({
    data: {
      type: "expense",
      title: `${input.category}: ${input.description}`.slice(0, 200),
      requesterId: actor.id,
      payload: input as object,
      steps: { create: [{ order: 0, approverRole: "principal" }] },
    },
  });

  const expense = await prisma.expense.create({
    data: {
      category: input.category,
      description: input.description,
      amount: input.amount,
      vendor: input.vendor,
      date: new Date(input.date),
      recordedById: actor.id,
      approvalRequestId: approvalRequest.id,
    },
    include: { recordedBy: { select: { id: true, name: true } } },
  });

  await audit(actor, "create", "Expense", expense.id, { category: input.category, amount: input.amount });
  return expense;
}
