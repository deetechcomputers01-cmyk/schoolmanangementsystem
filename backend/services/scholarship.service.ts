import { Prisma } from "@prisma/client";
import type { SessionUser } from "@/types/auth";
import { prisma } from "../prisma";
import { audit } from "./audit.service";
import { pickBestScholarship } from "./fee.service";

function assertCanManage(actor: SessionUser | null) {
  if (!actor || !["super_admin", "principal", "staff"].includes(actor.role)) throw new Error("Forbidden");
}

/**
 * Applies (or re-evaluates) scholarship discounts against a student's existing
 * outstanding fee records — not just fee records created after the fact.
 * Only touches records with no scholarship linked yet, so an already-discounted
 * record isn't silently swapped to a different scholarship; it stays put until
 * that scholarship is revoked (see `revokeScholarship`).
 */
async function syncScholarshipDiscountsForStudents(actor: SessionUser, studentIds: string[]) {
  const activeYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
  const records = await prisma.feeRecord.findMany({
    where: { studentId: { in: studentIds }, status: { in: ["unpaid", "partial"] }, scholarshipId: null },
    include: { payments: true },
  });

  for (const record of records) {
    const gross = Number(record.amountDue);
    const picked = await pickBestScholarship(record.studentId, activeYear?.id, gross);
    if (!picked || picked.discount <= 0) continue;

    const newAmountDue = Math.max(0, Math.round((gross - picked.discount) * 100) / 100);
    const amountPaid = record.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const status = amountPaid >= newAmountDue ? "paid" : amountPaid > 0 ? "partial" : "unpaid";

    await prisma.feeRecord.update({
      where: { id: record.id },
      data: {
        amountDue: new Prisma.Decimal(newAmountDue),
        discountApplied: new Prisma.Decimal(picked.discount),
        scholarshipId: picked.scholarship.id,
        status,
      },
    });
    await audit(actor, "apply_scholarship_discount", "FeeRecord", record.id, {
      discount: picked.discount, scholarshipId: picked.scholarship.id,
    });
  }
}

export function listScholarships() {
  return prisma.scholarship.findMany({
    include: {
      student: { select: { id: true, firstName: true, lastName: true, admissionNo: true, class: { select: { name: true } } } },
      academicYear: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function applyScholarship(
  actor: SessionUser,
  input: {
    studentIds: string[];
    type: "percent" | "fixed";
    value: number;
    reason?: string;
    academicYearId?: string | null;
  }
) {
  assertCanManage(actor);
  if (!input.studentIds.length) throw new Error("At least one student must be selected");
  if (input.type === "percent" && (input.value <= 0 || input.value > 100)) {
    throw new Error("Percent value must be between 1 and 100");
  }
  if (input.type === "fixed" && input.value <= 0) throw new Error("Fixed amount must be greater than 0");

  const created = await prisma.$transaction(
    input.studentIds.map((studentId) =>
      prisma.scholarship.create({
        data: {
          studentId,
          type: input.type,
          value: input.value,
          reason: input.reason,
          academicYearId: input.academicYearId ?? null,
          approvedById: actor.id,
        },
      })
    )
  );

  await audit(actor, "create", "Scholarship", created.map((c) => c.id).join(","), {
    count: created.length, type: input.type, value: input.value,
  });

  await syncScholarshipDiscountsForStudents(actor, input.studentIds);

  return created;
}

export async function revokeScholarship(actor: SessionUser, id: string) {
  assertCanManage(actor);
  const scholarship = await prisma.scholarship.update({ where: { id }, data: { status: "revoked" } });

  // Reverse the discount on every fee record this scholarship touched, restoring
  // the original gross amount and recomputing status purely from real cash payments.
  const records = await prisma.feeRecord.findMany({ where: { scholarshipId: id }, include: { payments: true } });
  for (const record of records) {
    const restoredGross = Math.round((Number(record.amountDue) + Number(record.discountApplied ?? 0)) * 100) / 100;
    const amountPaid = record.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const status = amountPaid >= restoredGross ? "paid" : amountPaid > 0 ? "partial" : "unpaid";

    await prisma.feeRecord.update({
      where: { id: record.id },
      data: {
        amountDue: new Prisma.Decimal(restoredGross),
        discountApplied: null,
        scholarshipId: null,
        status,
      },
    });
    await audit(actor, "reverse_scholarship_discount", "FeeRecord", record.id, {});
  }

  await audit(actor, "revoke", "Scholarship", id, {});
  return scholarship;
}
