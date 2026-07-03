/**
 * academic-calendar/page.tsx — entry point for /academic-calendar.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { AcademicCalendarScreen }        from "@/screens/desktop/AcademicCalendarScreen/AcademicCalendarScreen";
import { MobileAcademicCalendarScreen }  from "@/screens/mobile/MobileAcademicCalendarScreen/MobileAcademicCalendarScreen";

export default function AcademicCalendarPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileAcademicCalendarScreen /> : <AcademicCalendarScreen />;
}