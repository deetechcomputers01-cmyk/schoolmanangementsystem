/**
 * timetable/page.tsx — entry point for /timetable.
 * Detects device; renders desktop or mobile TimetableScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { TimetableScreen }        from "@/screens/desktop/TimetableScreen/TimetableScreen";
import { MobileTimetableScreen }  from "@/screens/mobile/MobileTimetableScreen/MobileTimetableScreen";

export default function TimetablePage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileTimetableScreen /> : <TimetableScreen />;
}
