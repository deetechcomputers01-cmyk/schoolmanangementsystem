/**
 * payroll/page.tsx — entry point for /payroll.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { PayrollScreen }        from "@/screens/desktop/PayrollScreen/PayrollScreen";
import { MobilePayrollScreen }  from "@/screens/mobile/MobilePayrollScreen/MobilePayrollScreen";

export default function PayrollPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobilePayrollScreen /> : <PayrollScreen />;
}