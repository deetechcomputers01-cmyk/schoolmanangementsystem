/**
 * notifications/page.tsx — entry point for /notifications.
 * Detects device; renders desktop or mobile NotificationsScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { NotificationsScreen }        from "@/screens/desktop/NotificationsScreen/NotificationsScreen";
import { MobileNotificationsScreen }  from "@/screens/mobile/MobileNotificationsScreen/MobileNotificationsScreen";

export default function NotificationsPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileNotificationsScreen /> : <NotificationsScreen />;
}
