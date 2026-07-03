/**
 * assets/page.tsx — entry point for /assets.
 * Detects device; renders desktop or mobile AssetsScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { AssetsScreen }        from "@/screens/desktop/AssetsScreen/AssetsScreen";
import { MobileAssetsScreen }  from "@/screens/mobile/MobileAssetsScreen/MobileAssetsScreen";

export default function AssetsPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileAssetsScreen /> : <AssetsScreen />;
}
