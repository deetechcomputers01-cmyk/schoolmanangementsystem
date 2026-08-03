import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { listBlockedIPs } from "@backend/services/blocked-ip.service";
import { BlockedIPsContent } from "./BlockedIPsContent";

export const dynamic = "force-dynamic";

export async function BlockedIPsScreen() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "super_admin") redirect("/dashboard");

  const blocked = await listBlockedIPs();

  return (
    <BlockedIPsContent
      blocked={blocked.map((b) => ({
        id: b.id,
        ip: b.ip,
        reason: b.reason,
        blockedByName: b.blockedBy.name,
        createdAt: b.createdAt.toISOString(),
        expiresAt: b.expiresAt ? b.expiresAt.toISOString() : null,
      }))}
    />
  );
}
