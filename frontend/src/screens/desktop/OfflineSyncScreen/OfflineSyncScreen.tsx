import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { OfflineSyncContent } from "./OfflineSyncContent";

export const dynamic = "force-dynamic";

export async function OfflineSyncScreen() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <OfflineSyncContent />;
}
