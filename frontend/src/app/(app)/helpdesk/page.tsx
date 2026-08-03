import { getCurrentUser } from "@backend/auth/cookies";
import { listTickets, getTicketStats } from "@backend/services/helpdesk.service";
import { redirect } from "next/navigation";
import { HelpdeskScreen } from "@/screens/desktop/HelpdeskScreen/HelpdeskScreen";

export const dynamic = "force-dynamic";
export const metadata = { title: "Support Tickets – ScholarSphere" };

export default async function HelpdeskPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "super_admin" && user.role !== "principal") redirect("/dashboard");

  const [tickets, stats] = await Promise.all([
    listTickets(),
    getTicketStats(),
  ]);

  return <HelpdeskScreen initialTickets={tickets} initialStats={stats} />;
}
