/**
 * reset-password/page.tsx — entry point for /reset-password.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { ResetPasswordScreen }       from "@/screens/desktop/ResetPasswordScreen/ResetPasswordScreen";
import { MobileResetPasswordScreen } from "@/screens/mobile/MobileResetPasswordScreen/MobileResetPasswordScreen";

export default function ResetPasswordPage() {
  const ua = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileResetPasswordScreen /> : <ResetPasswordScreen />;
}
