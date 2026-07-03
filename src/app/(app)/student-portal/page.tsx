/**
 * student-portal/page.tsx — entry point for /student-portal.
 * Detects device; renders desktop or mobile StudentPortalScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { StudentPortalScreen }        from "@/screens/desktop/StudentPortalScreen/StudentPortalScreen";
import { MobileStudentPortalScreen }  from "@/screens/mobile/MobileStudentPortalScreen/MobileStudentPortalScreen";

export default function StudentPortalPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileStudentPortalScreen /> : <StudentPortalScreen />;
}
