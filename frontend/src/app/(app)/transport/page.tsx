/**
 * transport/page.tsx — entry point for /transport.
 * Detects device; renders desktop or mobile TransportScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { TransportScreen }        from "@/screens/desktop/TransportScreen/TransportScreen";
import { MobileTransportScreen }  from "@/screens/mobile/MobileTransportScreen/MobileTransportScreen";

export default function TransportPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileTransportScreen /> : <TransportScreen />;
}
