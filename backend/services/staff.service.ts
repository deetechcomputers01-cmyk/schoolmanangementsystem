import { cache } from "react";
import type { SessionUser } from "@/types/auth";
import { assertCan } from "../auth/rbac";
import { prisma } from "../prisma";
import { audit } from "./audit.service";

export function listStaff() {
  return prisma.staff.findMany({ orderBy: { lastName: "asc" }, include: { user: true, subjects: true } });
}

// Both the (app) layout (every navigation, to route staff sub-roles to the
// right nav) and the dashboard page (to redirect driver/caterer/nurse/
// security staff to their own portal) need this same lookup for the same
// request — React's cache() dedupes them into a single query per request
// instead of two.
export const getStaffCategoryByUserId = cache(async (userId: string) => {
  const staff = await prisma.staff.findFirst({ where: { userId }, select: { staffCategory: true } });
  return staff?.staffCategory ?? null;
});

export function getStaff(id: string) {
  return prisma.staff.findUnique({ where: { id }, include: { user: true, subjects: true } });
}

export async function createStaff(user: SessionUser | null, input: {
  staffNo: string; firstName: string; lastName: string;
  phone: string; roleTitle: string; email?: string;
  photoUrl?: string;
  documents?: { name: string; url: string; type: string; size: number }[];
  staffCategory?: string; isTeaching?: boolean;
}) {
  assertCan(user, "staff:write");
  const category = input.staffCategory ?? "teaching";
  const data = {
    ...input,
    email: input.email || undefined,
    staffCategory: category,
    isTeaching: input.isTeaching ?? category === "teaching",
  };
  const staff = await prisma.staff.create({ data });
  await audit(user, "create", "Staff", staff.id, { staffNo: staff.staffNo, staffCategory: category });
  return staff;
}

// Self-service: a staff member (e.g. a driver) updating only their own contact
// phone number, scoped by their own userId — never gated behind staff:write.
export async function updateOwnPhone(actor: SessionUser | null, phone: string) {
  if (!actor) throw new Error("Unauthorized");
  if (!phone.trim()) throw new Error("Phone number is required");
  const staff = await prisma.staff.findFirst({ where: { userId: actor.id } });
  if (!staff) throw new Error("No staff record found for this account");
  const updated = await prisma.staff.update({ where: { id: staff.id }, data: { phone: phone.trim() } });
  await audit(actor, "update", "Staff", staff.id, { phone: "self-updated" });
  return updated;
}

export async function updateStaff(user: SessionUser | null, id: string, input: Partial<{
  staffNo: string; firstName: string; lastName: string;
  phone: string; roleTitle: string; email: string; photoUrl: string;
  documents: { name: string; url: string; type: string; size: number }[];
  staffCategory: string; isTeaching: boolean; notes: string;
}>) {
  assertCan(user, "staff:write");
  const staff = await prisma.staff.update({ where: { id }, data: input, include: { user: true, subjects: true } });
  await audit(user, "update", "Staff", id, input);
  return staff;
}

export async function removeStaff(user: SessionUser | null, id: string) {
  assertCan(user, "staff:write");
  const staff = await prisma.staff.delete({ where: { id } });
  await audit(user, "delete", "Staff", id);
  return staff;
}
