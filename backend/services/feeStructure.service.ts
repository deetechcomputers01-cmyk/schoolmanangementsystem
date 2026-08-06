import { Prisma } from "@prisma/client";
import type { SessionUser } from "@/types/auth";
import { assertCan } from "../auth/rbac";
import { prisma } from "../prisma";
import { audit } from "./audit.service";

export function listFeeStructure() {
  return prisma.feeStructure.findMany({
    orderBy: [{ class: { order: "asc" } }, { term: "asc" }, { category: "asc" }],
    include: { class: { select: { id: true, name: true } } },
  });
}

export function getFeeStructureForClass(classId: string, term: string) {
  return prisma.feeStructure.findMany({
    where: { classId, term },
    orderBy: { category: "asc" },
  });
}

export async function createFeeStructureRow(
  user: SessionUser | null,
  input: { classId: string; term: string; category: string; amount: number }
) {
  assertCan(user, "fees:write");
  const row = await prisma.feeStructure.upsert({
    where: { classId_term_category: { classId: input.classId, term: input.term, category: input.category } },
    create: { ...input, amount: new Prisma.Decimal(input.amount) },
    update: { amount: new Prisma.Decimal(input.amount) },
    include: { class: { select: { id: true, name: true } } },
  });
  await audit(user, "upsert", "FeeStructure", row.id, input);
  return row;
}

export async function deleteFeeStructureRow(user: SessionUser | null, id: string) {
  assertCan(user, "fees:write");
  const row = await prisma.feeStructure.delete({ where: { id } });
  await audit(user, "delete", "FeeStructure", id, { classId: row.classId, term: row.term, category: row.category });
  return row;
}
