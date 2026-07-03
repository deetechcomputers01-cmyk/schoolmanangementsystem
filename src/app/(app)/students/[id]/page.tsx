/**
 * students/[id]/page.tsx — entry point for /students/:id.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { StudentDetailScreen }        from "@/screens/desktop/StudentDetailScreen/StudentDetailScreen";
import { MobileStudentDetailScreen }  from "@/screens/mobile/MobileStudentDetailScreen/MobileStudentDetailScreen";

export default function StudentDetailPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileStudentDetailScreen /> : <StudentDetailScreen />;
}