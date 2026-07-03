/**
 * health/page.tsx — entry point for /health.
 * Detects device; renders desktop or mobile HealthScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { HealthScreen }        from "@/screens/desktop/HealthScreen/HealthScreen";
import { MobileHealthScreen }  from "@/screens/mobile/MobileHealthScreen/MobileHealthScreen";

export default function HealthPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileHealthScreen /> : <HealthScreen />;
}
