/**
 * discipline/page.tsx — entry point for /discipline.
 * Detects device; renders desktop or mobile DisciplineScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { DisciplineScreen }        from "@/screens/desktop/DisciplineScreen/DisciplineScreen";
import { MobileDisciplineScreen }  from "@/screens/mobile/MobileDisciplineScreen/MobileDisciplineScreen";

export default function DisciplinePage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileDisciplineScreen /> : <DisciplineScreen />;
}
