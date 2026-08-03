import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { getTicket, updateTicket } from "@backend/services/helpdesk.service";
import { ok, notFound, unauthorized, forbidden, badRequest } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  const ticket = await getTicket(params.id);
  if (!ticket) return notFound();
  return ok(ticket);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  const body = await req.json().catch(() => null);
  if (!body) return badRequest({ message: "No body" });

  const ticket = await updateTicket(user, params.id, {
    status:     body.status,
    priority:   body.priority,
    assigneeId: body.assigneeId,
  });
  return ok(ticket);
}
