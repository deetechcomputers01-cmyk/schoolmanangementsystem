/**
 * staff/page.tsx — entry point for /staff.
 * Detects device; renders desktop or mobile StaffScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { StaffScreen }        from "@/screens/desktop/StaffScreen/StaffScreen";
import { MobileStaffScreen }  from "@/screens/mobile/MobileStaffScreen/MobileStaffScreen";

export default function StaffPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileStaffScreen /> : <StaffScreen />;
}
