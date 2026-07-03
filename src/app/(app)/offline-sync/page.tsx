/**
 * offline-sync/page.tsx — entry point for /offline-sync.
 * Detects device; renders desktop or mobile OfflineSyncScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { OfflineSyncScreen }        from "@/screens/desktop/OfflineSyncScreen/OfflineSyncScreen";
import { MobileOfflineSyncScreen }  from "@/screens/mobile/MobileOfflineSyncScreen/MobileOfflineSyncScreen";

export default function OfflineSyncPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileOfflineSyncScreen /> : <OfflineSyncScreen />;
}
