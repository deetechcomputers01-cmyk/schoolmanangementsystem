/**
 * staff/new/page.tsx — entry point for /staff/new (add staff member).
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { StaffDetailScreen }       from "@/screens/desktop/StaffDetailScreen/StaffDetailScreen";
import { MobileStaffDetailScreen } from "@/screens/mobile/MobileStaffDetailScreen/MobileStaffDetailScreen";

export default function StaffNewPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileStaffDetailScreen /> : <StaffDetailScreen />;
}