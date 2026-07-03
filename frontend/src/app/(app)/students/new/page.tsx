/**
 * students/new/page.tsx — entry point for /students/new (add student).
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { AddStudentScreen }       from "@/screens/desktop/AddStudentScreen/AddStudentScreen";
import { MobileAddStudentScreen } from "@/screens/mobile/MobileAddStudentScreen/MobileAddStudentScreen";

export default function StudentsNewPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileAddStudentScreen /> : <AddStudentScreen />;
}