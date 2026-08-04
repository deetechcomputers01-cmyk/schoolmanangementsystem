import { headers } from "next/headers";
import { getNavForRole, type NavItem } from "@/lib/nav";
import { DesktopLayout } from "@/components/desktop/layout/DesktopLayout/DesktopLayout";
import { readFromDatabase } from "@backend/prisma";
import { getSettings } from "@backend/services/settings.service";
import { countUnreadNotifications } from "@backend/services/notification.service";
import { getStaffCategoryByUserId } from "@backend/services/staff.service";

async function toNavRole(dbRole: string | null, userId: string | null): Promise<NavItem["roles"][0]> {
  switch (dbRole) {
    case "teacher":  return "teacher";
    case "student":  return "student";
    case "guardian": return "parent";
    case "staff": {
      if (!userId) return "accountant";
      const cat = await getStaffCategoryByUserId(userId) ?? "accounts";
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
  const hdrs     = headers();
  const dbRole   = hdrs.get("x-user-role");
  const userId   = hdrs.get("x-user-id");
  // Already the verified JWT's own `name` claim (see middleware.ts) — no
  // need to re-fetch it from the database on every navigation.
  const nameFromToken = hdrs.get("x-user-name");

  // This layout re-runs on every navigation (it reads headers(), a dynamic
  // API). These three lookups are fully independent of each other — running
  // them sequentially means every page load pays for the sum of all three
  // round trips instead of just the slowest one.
  const [navRole, settings, notificationCount] = await Promise.all([
    readFromDatabase(() => toNavRole(dbRole, userId), "admin"),
    readFromDatabase(() => getSettings(), null),
    userId ? readFromDatabase(() => countUnreadNotifications(userId), 0) : Promise.resolve(0),
  ]);

  const nav = getNavForRole(navRole);

  let userName     = "";
  let userInitials = "";
  if (nameFromToken) {
    userName = nameFromToken;
    const parts = nameFromToken.trim().split(/\s+/);
    userInitials = ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
  }
  if (!userInitials) userInitials = (dbRole ?? "SA").slice(0, 2).toUpperCase();

  const desktopNav = nav.map((item) => ({
    href:  item.href,
    label: item.label,
    icon:  item.icon,
    group: item.group,
  }));

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
