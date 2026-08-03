import { headers } from "next/headers";
import { getNavForRole, type NavItem } from "@/lib/nav";
import { DesktopLayout } from "@/components/desktop/layout/DesktopLayout/DesktopLayout";
import { prisma, readFromDatabase } from "@backend/prisma";
import { getSettings } from "@backend/services/settings.service";
import { countUnreadNotifications } from "@backend/services/notification.service";

async function toNavRole(dbRole: string | null, userId: string | null): Promise<NavItem["roles"][0]> {
  switch (dbRole) {
    case "teacher":  return "teacher";
    case "student":  return "student";
    case "guardian": return "parent";
    case "staff": {
      if (!userId) return "accountant";
      const staffRecord = await prisma.staff.findFirst({
        where: { userId },
        select: { staffCategory: true }
      });
      const cat = staffRecord?.staffCategory ?? "accounts";
      if (cat === "driver")   return "driver";
      if (cat === "caterer")  return "caterer";
      if (cat === "nurse")    return "nurse";
      if (cat === "security") return "security";
      return "accountant";
    }
    default: return "admin";
  }
}

export default async function AppLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const hdrs    = headers();
  const dbRole  = hdrs.get("x-user-role");
  const userId  = hdrs.get("x-user-id");
  const navRole = await readFromDatabase(() => toNavRole(dbRole, userId), "admin");
  const nav     = getNavForRole(navRole);

  let userName     = "";
  let userInitials = "";
  if (userId) {
    const u = await readFromDatabase(
      () => prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
      null,
    );
    if (u?.name) {
      userName = u.name;
      const parts = u.name.trim().split(/\s+/);
      userInitials = ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
    }
  }
  if (!userInitials) userInitials = (dbRole ?? "SA").slice(0, 2).toUpperCase();

  const desktopNav = nav.map((item) => ({
    href:  item.href,
    label: item.label,
    icon:  item.icon,
    group: item.group,
  }));

  const settings = await readFromDatabase(() => getSettings(), null);
  const notificationCount = userId ? await readFromDatabase(() => countUnreadNotifications(userId), 0) : 0;

  return (
    <DesktopLayout
      navItems={desktopNav}
      pageTitle=""
      userRole={navRole}
      userName={userName}
      userInitials={userInitials}
      brandName={settings?.name || undefined}
      logoUrl={settings?.logoUrl ?? null}
      notificationCount={notificationCount}
    >
      {children}
      {modal}
    </DesktopLayout>
  );
}
