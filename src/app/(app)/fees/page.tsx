/**
 * fees/page.tsx — entry point for /fees.
 * Detects device; renders desktop or mobile FeesScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { FeesScreen }        from "@/screens/desktop/FeesScreen/FeesScreen";
import { MobileFeesScreen }  from "@/screens/mobile/MobileFeesScreen/MobileFeesScreen";

export default function FeesPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileFeesScreen /> : <FeesScreen />;
}
