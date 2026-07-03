/**
 * dashboard/page.tsx — entry point for /dashboard.
 * Detects device; renders desktop or mobile DashboardScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { DashboardScreen }        from "@/screens/desktop/DashboardScreen/DashboardScreen";
import { MobileDashboardScreen }  from "@/screens/mobile/MobileDashboardScreen/MobileDashboardScreen";

export default function DashboardPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileDashboardScreen /> : <DashboardScreen />;
}
