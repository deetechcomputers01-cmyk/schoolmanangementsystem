/**
 * fees/receipt/page.tsx — entry point for /fees/receipt.
 * Detects device; renders desktop or mobile PaymentReceiptScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { PaymentReceiptScreen }        from "@/screens/desktop/PaymentReceiptScreen/PaymentReceiptScreen";
import { MobilePaymentReceiptScreen }  from "@/screens/mobile/MobilePaymentReceiptScreen/MobilePaymentReceiptScreen";

export default function PaymentReceiptPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobilePaymentReceiptScreen /> : <PaymentReceiptScreen />;
}
