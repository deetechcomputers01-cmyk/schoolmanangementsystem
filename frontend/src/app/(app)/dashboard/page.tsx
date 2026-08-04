import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { readFromDatabase } from "@backend/prisma";
import { getStaffCategoryByUserId } from "@backend/services/staff.service";
import { DashboardScreen } from "@/screens/desktop/DashboardScreen/DashboardScreen";

export const dynamic = "force-dynamic";

const STAFF_CATEGORY_PORTALS: Record<string, string> = {
  driver:   "/transport-portal",
  caterer:  "/canteen-portal",
  nurse:    "/health-portal",
  security: "/security-portal",
};

export default async function DashboardPage() {
  const hdrs   = headers();
  const dbRole = hdrs.get("x-user-role");
  const userId = hdrs.get("x-user-id");

  if (dbRole === "staff" && userId) {
    const cat = await readFromDatabase(() => getStaffCategoryByUserId(userId), null) ?? "accounts";
    const portalPath = STAFF_CATEGORY_PORTALS[cat];
    if (portalPath) redirect(portalPath);
  }

  return <DashboardScreen />;
}
