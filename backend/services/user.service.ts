import { prisma } from "../prisma";
import type { Role } from "@prisma/client";
import type { SessionUser } from "@/types/auth";
import { assertCan, isSuperAdmin } from "../auth/rbac";
import { audit } from "./audit.service";

export async function listUsers(actor: SessionUser) {
  assertCan(actor, "admin:users:read");
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      staff:    { select: { staffNo: true, roleTitle: true } },
      guardians: { select: { id: true, relation: true }, take: 1 },
      student:  { select: { admissionNo: true } }
    }
  });
}

export async function updateUserRole(actor: SessionUser, targetId: string, newRole: Role) {
  if (!isSuperAdmin(actor)) throw new Error("Forbidden: only super_admin can change roles");
  if (actor.id === targetId) throw new Error("Cannot change your own role");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: targetId } });
  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { role: newRole },
    select: { id: true, name: true, email: true, role: true, isActive: true }
  });

  await audit(actor, "update_role", "User", targetId, { from: user.role, to: newRole });
  return updated;
}

export async function toggleUserActive(actor: SessionUser, targetId: string, isActive: boolean) {
  if (!isSuperAdmin(actor)) throw new Error("Forbidden: only super_admin can activate/deactivate users");
  if (actor.id === targetId) throw new Error("Cannot deactivate yourself");

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { isActive },
    select: { id: true, name: true, email: true, role: true, isActive: true }
  });

  await audit(actor, isActive ? "activate_user" : "deactivate_user", "User", targetId, {});
  return updated;
}

export async function deleteUser(actor: SessionUser, targetId: string) {
  if (!isSuperAdmin(actor)) throw new Error("Forbidden: only super_admin can delete users");
  if (actor.id === targetId) throw new Error("Cannot delete yourself");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: targetId } });

  // Nullify foreign key links before deleting
  await prisma.$transaction([
    prisma.staff.updateMany({   where: { userId: targetId }, data: { userId: null } }),
    prisma.guardian.updateMany({ where: { userId: targetId }, data: { userId: null } }),
    prisma.student.updateMany({  where: { userId: targetId }, data: { userId: null } }),
    prisma.auditLog.updateMany({ where: { userId: targetId }, data: { userId: null } }),
    prisma.user.delete({ where: { id: targetId } })
  ]);

  await audit(actor, "delete_user", "User", targetId, { name: user.name, email: user.email, role: user.role });
  return user;
}
