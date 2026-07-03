/**
 * library/page.tsx — entry point for /library.
 * Detects device; renders desktop or mobile LibraryScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { LibraryScreen }        from "@/screens/desktop/LibraryScreen/LibraryScreen";
import { MobileLibraryScreen }  from "@/screens/mobile/MobileLibraryScreen/MobileLibraryScreen";

export default function LibraryPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileLibraryScreen /> : <LibraryScreen />;
}
