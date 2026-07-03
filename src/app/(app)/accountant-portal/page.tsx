/**
 * accountant-portal/page.tsx — entry point for /accountant-portal.
 * Detects device; renders desktop or mobile AccountantPortalScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { AccountantPortalScreen }        from "@/screens/desktop/AccountantPortalScreen/AccountantPortalScreen";
import { MobileAccountantPortalScreen }  from "@/screens/mobile/MobileAccountantPortalScreen/MobileAccountantPortalScreen";

export default function AccountantPortalPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileAccountantPortalScreen /> : <AccountantPortalScreen />;
}
