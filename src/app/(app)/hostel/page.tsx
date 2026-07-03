/**
 * hostel/page.tsx — entry point for /hostel.
 * Detects device; renders desktop or mobile HostelScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { HostelScreen }        from "@/screens/desktop/HostelScreen/HostelScreen";
import { MobileHostelScreen }  from "@/screens/mobile/MobileHostelScreen/MobileHostelScreen";

export default function HostelPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileHostelScreen /> : <HostelScreen />;
}
