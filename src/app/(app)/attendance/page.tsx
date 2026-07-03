/**
 * attendance/page.tsx — entry point for /attendance.
 * Detects device; renders desktop or mobile AttendanceScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { AttendanceScreen }        from "@/screens/desktop/AttendanceScreen/AttendanceScreen";
import { MobileAttendanceScreen }  from "@/screens/mobile/MobileAttendanceScreen/MobileAttendanceScreen";

export default function AttendancePage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileAttendanceScreen /> : <AttendanceScreen />;
}
