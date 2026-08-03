import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { addTicketMessage } from "@backend/services/helpdesk.service";
import { ok, unauthorized, forbidden, badRequest } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  const body = await req.json().catch(() => null);
  if (!body?.body) return badRequest({ message: "body is required" });

  const msg = await addTicketMessage(user, params.id, {
    body:       body.body,
    isInternal: body.isInternal ?? false,
  });
  return ok(msg, 201);
}
