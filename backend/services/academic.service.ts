import { prisma } from "../prisma";
import type { SessionUser } from "@/types/auth";
import { assertCan } from "../auth/rbac";
import { audit } from "./audit.service";

// ── Academic Years ────────────────────────────────────────────────────────────

export async function listAcademicYears() {
  return prisma.academicYear.findMany({
    orderBy: { startDate: "desc" },
    include: {
      terms: { orderBy: { startDate: "asc" } }
    }
  });
}

export async function getCurrentAcademicContext() {
  const year = await prisma.academicYear.findFirst({
    where: { isCurrent: true },
    include: { terms: { where: { isCurrent: true } } }
  });
  return {
    year: year ?? null,
    term: year?.terms[0] ?? null
  };
}

export async function createAcademicYear(
  actor: SessionUser,
  data: { name: string; startDate: string; endDate: string }
) {
  assertCan(actor, "academic:write");
  const year = await prisma.academicYear.create({
    data: {
      name:      data.name,
      startDate: new Date(data.startDate),
      endDate:   new Date(data.endDate)
    },
    include: { terms: true }
  });
  await audit(actor, "create_academic_year", "AcademicYear", year.id, { name: year.name });
  return year;
}

export async function setCurrentAcademicYear(actor: SessionUser, id: string) {
  assertCan(actor, "academic:write");
  // Unset all, then set the target
  await prisma.$transaction([
    prisma.academicYear.updateMany({ data: { isCurrent: false } }),
    prisma.academicYear.update({ where: { id }, data: { isCurrent: true } })
  ]);
  // Also clear current term flag across all terms (only current year's term should be current)
  await prisma.term.updateMany({ data: { isCurrent: false } });

  const year = await prisma.academicYear.findUniqueOrThrow({ where: { id }, include: { terms: true } });
  await audit(actor, "set_current_academic_year", "AcademicYear", id, { name: year.name });
  return year;
}

export async function deleteAcademicYear(actor: SessionUser, id: string) {
  assertCan(actor, "academic:write");
  const year = await prisma.academicYear.findUniqueOrThrow({ where: { id } });
  if (year.isCurrent) throw new Error("Cannot delete the active academic year");
  await prisma.academicYear.delete({ where: { id } });
  await audit(actor, "delete_academic_year", "AcademicYear", id, { name: year.name });
  return year;
}

// ── Terms ─────────────────────────────────────────────────────────────────────

export async function createTerm(
  actor: SessionUser,
  data: { name: string; academicYearId: string; startDate: string; endDate: string }
) {
  assertCan(actor, "academic:write");
  const term = await prisma.term.create({
    data: {
      name:           data.name,
      academicYearId: data.academicYearId,
      startDate:      new Date(data.startDate),
      endDate:        new Date(data.endDate)
    },
    include: { academicYear: true }
  });
  await audit(actor, "create_term", "Term", term.id, { name: term.name, year: term.academicYear.name });
  return term;
}

export async function setCurrentTerm(actor: SessionUser, id: string) {
  assertCan(actor, "academic:write");

  const term = await prisma.term.findUniqueOrThrow({
    where: { id },
    include: { academicYear: true }
  });

  await prisma.$transaction([
    // Clear current flag on all terms
    prisma.term.updateMany({ data: { isCurrent: false } }),
    // Clear current flag on all years, then set this term's year as current
    prisma.academicYear.updateMany({ data: { isCurrent: false } }),
    prisma.academicYear.update({ where: { id: term.academicYearId }, data: { isCurrent: true } }),
    // Set this term as current
    prisma.term.update({ where: { id }, data: { isCurrent: true } })
  ]);

  await audit(actor, "set_current_term", "Term", id, { name: term.name, year: term.academicYear.name });
  return term;
}

export async function updateTerm(
  actor: SessionUser,
  id: string,
  data: { name?: string; startDate?: string; endDate?: string }
) {
  assertCan(actor, "academic:write");
  const updated = await prisma.term.update({
    where: { id },
    data: {
      ...(data.name      && { name:      data.name }),
      ...(data.startDate && { startDate: new Date(data.startDate) }),
      ...(data.endDate   && { endDate:   new Date(data.endDate) })
    },
    include: { academicYear: true }
  });
  await audit(actor, "update_term", "Term", id, data);
  return updated;
}

export async function deleteTerm(actor: SessionUser, id: string) {
  assertCan(actor, "academic:write");
  const term = await prisma.term.findUniqueOrThrow({ where: { id } });
  if (term.isCurrent) throw new Error("Cannot delete the active term");
  await prisma.term.delete({ where: { id } });
  await audit(actor, "delete_term", "Term", id, { name: term.name });
  return term;
}
