import { getCurrentUser } from "@backend/auth/cookies";
import { redirect } from "next/navigation";
import { prisma } from "@backend/prisma";
import { listUsers } from "@backend/services/user.service";
import { UserRoleContent } from "./UserRoleContent";

export const dynamic = "force-dynamic";

export async function UserRoleScreen() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "super_admin") redirect("/dashboard");

  const [users, lastLogins] = await Promise.all([
    listUsers(user),
    prisma.auditLog.findMany({
      where: { action: "login_success", userId: { not: null } },
      orderBy: { createdAt: "desc" },
      distinct: ["userId"],
      select: { userId: true, createdAt: true },
    }),
  ]);

  const lastLoginMap = new Map(lastLogins.map((l) => [l.userId as string, l.createdAt.toISOString()]));

  const serialized = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
    lastActivity: lastLoginMap.get(u.id) ?? null,
    linkedEntity: u.staff
      ? `${u.staff.roleTitle} · ${u.staff.staffNo}`
      : u.student
        ? `Student · ${u.student.admissionNo}`
        : u.guardians[0]
          ? `Guardian (${u.guardians[0].relation})`
          : null,
  }));

  return <UserRoleContent users={serialized} currentUserId={user.id} />;
}
