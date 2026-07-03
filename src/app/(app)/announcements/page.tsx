/**
 * announcements/page.tsx — entry point for /announcements.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { AnnouncementsScreen }        from "@/screens/desktop/AnnouncementsScreen/AnnouncementsScreen";
import { MobileAnnouncementsScreen }  from "@/screens/mobile/MobileAnnouncementsScreen/MobileAnnouncementsScreen";

export default function AnnouncementsPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileAnnouncementsScreen /> : <AnnouncementsScreen />;
}