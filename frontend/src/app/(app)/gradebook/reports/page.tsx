/**
 * gradebook/reports/page.tsx — entry point for /gradebook/reports.
 * Detects device; renders desktop or mobile GradebookReportsScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { GradebookReportsScreen }        from "@/screens/desktop/GradebookReportsScreen/GradebookReportsScreen";
import { MobileGradebookReportsScreen }  from "@/screens/mobile/MobileGradebookReportsScreen/MobileGradebookReportsScreen";

export default function GradebookReportsPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileGradebookReportsScreen /> : <GradebookReportsScreen />;
}
