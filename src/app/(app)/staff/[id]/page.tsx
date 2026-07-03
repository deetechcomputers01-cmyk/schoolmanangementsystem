/**
 * staff/[id]/page.tsx — entry point for /staff/:id.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { StaffDetailScreen }        from "@/screens/desktop/StaffDetailScreen/StaffDetailScreen";
import { MobileStaffDetailScreen }  from "@/screens/mobile/MobileStaffDetailScreen/MobileStaffDetailScreen";

export default function StaffDetailPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileStaffDetailScreen /> : <StaffDetailScreen />;
}