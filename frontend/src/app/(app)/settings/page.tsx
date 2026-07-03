/**
 * settings/page.tsx — entry point for /settings.
 * Detects device; renders desktop or mobile SettingsScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { SettingsScreen }        from "@/screens/desktop/SettingsScreen/SettingsScreen";
import { MobileSettingsScreen }  from "@/screens/mobile/MobileSettingsScreen/MobileSettingsScreen";

export default function SettingsPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileSettingsScreen /> : <SettingsScreen />;
}
