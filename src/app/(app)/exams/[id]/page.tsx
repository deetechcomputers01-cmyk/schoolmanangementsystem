/**
 * exams/[id]/page.tsx — individual exam score entry.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { ExamsScreen } from "@/screens/desktop/ExamsScreen/ExamsScreen";
import { MobileExamsScreen } from "@/screens/mobile/MobileExamsScreen/MobileExamsScreen";

export default function ExamDetailPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileExamsScreen /> : <ExamsScreen />;
}