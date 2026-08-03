import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { listTickets, createTicket, getTicketStats } from "@backend/services/helpdesk.service";
import { ok, unauthorized, forbidden, badRequest } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  const { searchParams } = req.nextUrl;
  const filters = {
    status:   searchParams.get("status")   ?? undefined,
    priority: searchParams.get("priority") ?? undefined,
    queue:    searchParams.get("queue")    ?? undefined,
  };

  if (searchParams.get("stats") === "1") {
    const stats = await getTicketStats();
    return ok(stats);
  }

  const tickets = await listTickets(filters);
  return ok(tickets);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body?.subject || !body?.queue) return badRequest({ message: "subject and queue are required" });

  const ticket = await createTicket(user, {
    subject:     body.subject,
    description: body.description ?? "",
    queue:       body.queue,
    priority:    body.priority ?? "medium",
  });
  return ok(ticket, 201);
}
