/**
 * gradebook/page.tsx — entry point for /gradebook.
 * Detects device; renders desktop or mobile GradebookScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { GradebookScreen }        from "@/screens/desktop/GradebookScreen/GradebookScreen";
import { MobileGradebookScreen }  from "@/screens/mobile/MobileGradebookScreen/MobileGradebookScreen";

export default function GradebookPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileGradebookScreen /> : <GradebookScreen />;
}
