/**
 * user-role/page.tsx — entry point for /user-role.
 * Detects device; renders desktop or mobile UserRoleScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { UserRoleScreen }        from "@/screens/desktop/UserRoleScreen/UserRoleScreen";
import { MobileUserRoleScreen }  from "@/screens/mobile/MobileUserRoleScreen/MobileUserRoleScreen";

export default function UserRolePage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileUserRoleScreen /> : <UserRoleScreen />;
}
