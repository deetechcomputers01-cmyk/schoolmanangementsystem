/**
 * login/page.tsx — entry point for /login.
 * Detects device; renders desktop or mobile LoginScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { LoginScreen }       from "@/screens/desktop/LoginScreen/LoginScreen";
import { MobileLoginScreen } from "@/screens/mobile/MobileLoginScreen/MobileLoginScreen";

export default function LoginPage() {
  const ua = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileLoginScreen /> : <LoginScreen />;
}
