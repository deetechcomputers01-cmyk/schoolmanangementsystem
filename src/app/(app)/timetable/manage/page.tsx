/**
 * timetable/manage/page.tsx — entry point for /timetable/manage.
 * Detects device; renders desktop or mobile TimetableManageScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { TimetableManageScreen }        from "@/screens/desktop/TimetableManageScreen/TimetableManageScreen";
import { MobileTimetableManageScreen }  from "@/screens/mobile/MobileTimetableManageScreen/MobileTimetableManageScreen";

export default function TimetableManagePage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileTimetableManageScreen /> : <TimetableManageScreen />;
}
