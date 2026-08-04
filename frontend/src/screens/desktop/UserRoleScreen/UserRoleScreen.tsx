import { getCurrentUser } from "@backend/auth/cookies";
import { redirect } from "next/navigation";
import { prisma } from "@backend/prisma";
import { listUsers } from "@backend/services/user.service";
import { permissions } from "@backend/auth/rbac";
import { UserRoleContent } from "./UserRoleContent";
import { MobileUserRoleContent } from "@/screens/mobile/MobileUserRoleContent/MobileUserRoleContent";

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

  // Real permission counts per role, from the actual RBAC table (previously
  // backend-only) — "*" means unrestricted rather than a literal count.
  const permissionCounts: Record<string, number | "all"> = Object.fromEntries(
    Object.entries(permissions).map(([role, perms]) => [role, perms.includes("*") ? "all" : perms.length])
  );

  return (
    <>
      <div className="mobileOnly">
        <MobileUserRoleContent users={serialized} currentUserId={user.id} permissionCounts={permissionCounts} />
      </div>
      <div className="desktopOnly">
        <UserRoleContent users={serialized} currentUserId={user.id} />
      </div>
    </>
  );
}
