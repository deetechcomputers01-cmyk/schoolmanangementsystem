import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { updateBroadcast, deleteBroadcast } from "@backend/services/broadcasts.service";
import { ok, unauthorized, forbidden, badRequest } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  const body = await req.json().catch(() => null);
  if (!body) return badRequest({ message: "No body" });

  const broadcast = await updateBroadcast(user, params.id, {
    status:    body.status,
    delivered: body.delivered,
    failed:    body.failed,
    pending:   body.pending,
  });
  return ok(broadcast);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  const broadcast = await deleteBroadcast(user, params.id);
  return ok(broadcast);
}
