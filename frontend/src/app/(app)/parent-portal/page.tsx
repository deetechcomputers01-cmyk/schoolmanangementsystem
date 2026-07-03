/**
 * parent-portal/page.tsx — entry point for /parent-portal.
 * Detects device; renders desktop or mobile ParentPortalScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { ParentPortalScreen }        from "@/screens/desktop/ParentPortalScreen/ParentPortalScreen";
import { MobileParentPortalScreen }  from "@/screens/mobile/MobileParentPortalScreen/MobileParentPortalScreen";

export default function ParentPortalPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileParentPortalScreen /> : <ParentPortalScreen />;
}
