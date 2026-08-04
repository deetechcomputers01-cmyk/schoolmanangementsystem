import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { listBlockedIPs } from "@backend/services/blocked-ip.service";
import { BlockedIPsContent } from "./BlockedIPsContent";
import { MobileBlockedIPsContent } from "@/screens/mobile/MobileBlockedIPsContent/MobileBlockedIPsContent";

export const dynamic = "force-dynamic";

export async function BlockedIPsScreen() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "super_admin") redirect("/dashboard");

  const blocked = await listBlockedIPs();
  const blockedRows = blocked.map((b) => ({
    id: b.id,
    ip: b.ip,
    reason: b.reason,
    blockedByName: b.blockedBy.name,
    createdAt: b.createdAt.toISOString(),
    expiresAt: b.expiresAt ? b.expiresAt.toISOString() : null,
  }));

  return (
    <>
      <div className="mobileOnly">
        <MobileBlockedIPsContent blocked={blockedRows} />
      </div>
      <div className="desktopOnly">
        <BlockedIPsContent blocked={blockedRows} />
      </div>
    </>
  );
}
