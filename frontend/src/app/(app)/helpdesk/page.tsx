import { getCurrentUser } from "@backend/auth/cookies";
import { listTickets, getTicketStats } from "@backend/services/helpdesk.service";
import { getSettings } from "@backend/services/settings.service";
import { redirect } from "next/navigation";
import { HelpdeskScreen } from "@/screens/desktop/HelpdeskScreen/HelpdeskScreen";
import { MobileHelpdeskContent } from "@/screens/mobile/MobileHelpdeskContent/MobileHelpdeskContent";

export const dynamic = "force-dynamic";
export const metadata = { title: "Support Tickets – ScholarSphere" };

export default async function HelpdeskPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "super_admin" && user.role !== "principal") redirect("/dashboard");

  const [tickets, stats, settings] = await Promise.all([
    listTickets(),
    getTicketStats(),
    getSettings(),
  ]);
  const schoolName = settings.name || "the school";

  return (
    <>
      <div className="mobileOnly">
        <MobileHelpdeskContent initialTickets={tickets} initialStats={stats} schoolName={schoolName} />
      </div>
      <div className="desktopOnly">
        <HelpdeskScreen initialTickets={tickets} initialStats={stats} schoolName={schoolName} />
      </div>
    </>
  );
}
