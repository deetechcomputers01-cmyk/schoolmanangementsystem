/**
 * teacher-portal/page.tsx — entry point for /teacher-portal.
 * Detects device; renders desktop or mobile TeacherPortalScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { TeacherPortalScreen }        from "@/screens/desktop/TeacherPortalScreen/TeacherPortalScreen";
import { MobileTeacherPortalScreen }  from "@/screens/mobile/MobileTeacherPortalScreen/MobileTeacherPortalScreen";

export default function TeacherPortalPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileTeacherPortalScreen /> : <TeacherPortalScreen />;
}
