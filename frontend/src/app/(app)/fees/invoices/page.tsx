/**
 * fees/invoices/page.tsx — entry point for /fees/invoices.
 * Detects device; renders desktop or mobile FeeInvoicesScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { FeeInvoicesScreen }        from "@/screens/desktop/FeeInvoicesScreen/FeeInvoicesScreen";
import { MobileFeeInvoicesScreen }  from "@/screens/mobile/MobileFeeInvoicesScreen/MobileFeeInvoicesScreen";

export default function FeeInvoicesPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileFeeInvoicesScreen /> : <FeeInvoicesScreen />;
}
