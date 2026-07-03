/**
 * (app)/layout.tsx — layout for all authenticated pages.
 * Server-side UA detection picks DesktopLayout or MobileLayout.
 * Passes nav items filtered for the current user role.
 * Auth/session integration: TODO — wire getServerSession() when auth is set up.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { getNavForRole, type NavItem } from "@/lib/nav";
import { DesktopLayout } from "@/components/desktop/layout/DesktopLayout/DesktopLayout";
import { MobileLayout }  from "@/components/mobile/layout/MobileLayout/MobileLayout";

// TODO: replace with session role once auth is wired
const DEFAULT_ROLE: NavItem["roles"][0] = "admin";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  const nav    = getNavForRole(DEFAULT_ROLE);

  if (device === "mobile") {
    // Mobile: up to 5 tabs for bottom nav; full list available via settings/menu
    const mobileTabs = nav.slice(0, 5).map((item) => ({
      href:  item.href,
      label: item.label,
      icon:  item.icon,
    }));
    return (
      <MobileLayout tabs={mobileTabs}>
        {children}
      </MobileLayout>
    );
  }

  // Desktop
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
      userRole={DEFAULT_ROLE}
    >
      {children}
    </DesktopLayout>
  );
}
