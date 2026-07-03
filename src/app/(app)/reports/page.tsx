/**
 * reports/page.tsx — entry point for /reports.
 * Detects device; renders desktop or mobile ReportsScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { ReportsScreen }        from "@/screens/desktop/ReportsScreen/ReportsScreen";
import { MobileReportsScreen }  from "@/screens/mobile/MobileReportsScreen/MobileReportsScreen";

export default function ReportsPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileReportsScreen /> : <ReportsScreen />;
}
