import { getCurrentUser } from "@backend/auth/cookies";
import { listBroadcasts, getBroadcastStats } from "@backend/services/broadcasts.service";
import { getClasses } from "@backend/services/dashboard.service";
import { redirect } from "next/navigation";
import { ParentCommunicationsScreen } from "@/screens/desktop/ParentCommunicationsScreen/ParentCommunicationsScreen";
import { MobileParentBroadcastsContent } from "@/screens/mobile/MobileParentBroadcastsContent/MobileParentBroadcastsContent";

export const dynamic = "force-dynamic";
export const metadata = { title: "Parent Broadcasts – ScholarSphere" };

export default async function ParentCommunicationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "super_admin" && user.role !== "principal") redirect("/dashboard");

  const [broadcasts, stats, classes] = await Promise.all([
    listBroadcasts(),
    getBroadcastStats(),
    getClasses(),
  ]);

  const classAudiences = classes.map((c) => ({ id: c.id, name: c.name }));

  return (
    <>
      <div className="mobileOnly">
        <MobileParentBroadcastsContent initialBroadcasts={broadcasts as any} initialStats={stats} classes={classAudiences} />
      </div>
      <div className="desktopOnly">
        <ParentCommunicationsScreen initialBroadcasts={broadcasts as any} initialStats={stats} classes={classAudiences} />
      </div>
    </>
  );
}
