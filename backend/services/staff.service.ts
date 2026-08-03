import type { SessionUser } from "@/types/auth";
import { assertCan } from "../auth/rbac";
import { prisma } from "../prisma";
import { audit } from "./audit.service";

export function listStaff() {
  return prisma.staff.findMany({ orderBy: { lastName: "asc" }, include: { user: true, subjects: true } });
}

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
