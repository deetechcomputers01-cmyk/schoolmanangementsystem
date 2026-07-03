/**
 * attendance/reports/page.tsx — entry point for /attendance/reports.
 * Detects device; renders desktop or mobile AttendanceReportsScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { AttendanceReportsScreen }        from "@/screens/desktop/AttendanceReportsScreen/AttendanceReportsScreen";
import { MobileAttendanceReportsScreen }  from "@/screens/mobile/MobileAttendanceReportsScreen/MobileAttendanceReportsScreen";

export default function AttendanceReportsPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileAttendanceReportsScreen /> : <AttendanceReportsScreen />;
}
