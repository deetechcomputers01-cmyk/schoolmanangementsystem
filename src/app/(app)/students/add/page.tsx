/**
 * students/add/page.tsx — entry point for /students/add.
 * Detects device; renders desktop or mobile AddStudentScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { AddStudentScreen }        from "@/screens/desktop/AddStudentScreen/AddStudentScreen";
import { MobileAddStudentScreen }  from "@/screens/mobile/MobileAddStudentScreen/MobileAddStudentScreen";

export default function AddStudentPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileAddStudentScreen /> : <AddStudentScreen />;
}
