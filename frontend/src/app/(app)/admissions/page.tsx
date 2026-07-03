/**
 * admissions/page.tsx — entry point for /admissions.
 * Detects device; renders desktop or mobile AdmissionsScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { AdmissionsScreen }        from "@/screens/desktop/AdmissionsScreen/AdmissionsScreen";
import { MobileAdmissionsScreen }  from "@/screens/mobile/MobileAdmissionsScreen/MobileAdmissionsScreen";

export default function AdmissionsPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileAdmissionsScreen /> : <AdmissionsScreen />;
}
