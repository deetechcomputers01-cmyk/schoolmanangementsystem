import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { OfflineSyncContent } from "./OfflineSyncContent";
import { MobileOfflineSyncContent } from "@/screens/mobile/MobileOfflineSyncContent/MobileOfflineSyncContent";

export const dynamic = "force-dynamic";

export async function OfflineSyncScreen() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <>
      <div className="mobileOnly">
        <MobileOfflineSyncContent canManageSettings={user.role === "super_admin" || user.role === "principal"} />
      </div>
      <div className="desktopOnly">
        <OfflineSyncContent />
      </div>
    </>
  );
}
