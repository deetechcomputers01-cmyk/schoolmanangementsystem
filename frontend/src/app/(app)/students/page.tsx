/**
 * students/page.tsx — entry point for /students.
 * Detects device; renders desktop or mobile StudentsScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { StudentsScreen }        from "@/screens/desktop/StudentsScreen/StudentsScreen";
import { MobileStudentsScreen }  from "@/screens/mobile/MobileStudentsScreen/MobileStudentsScreen";

export default function StudentsPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileStudentsScreen /> : <StudentsScreen />;
}
