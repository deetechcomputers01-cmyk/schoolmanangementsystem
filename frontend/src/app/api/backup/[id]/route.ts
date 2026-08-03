import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { updateBackup, deleteBackup } from "@backend/services/backup.service";
import { ok, unauthorized, forbidden, badRequest } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin") return forbidden();

  const body = await req.json().catch(() => null);
  if (!body) return badRequest({ message: "No body" });

  const record = await updateBackup(user, params.id, {
    status:   body.status,
    checksum: body.checksum,
  });
  return ok(record);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin") return forbidden();

  const record = await deleteBackup(user, params.id);
  return ok(record);
}
