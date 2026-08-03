import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { updateDocument, deleteDocument } from "@backend/services/documents.service";
import { ok, unauthorized, forbidden, badRequest } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  const body = await req.json().catch(() => null);
  if (!body) return badRequest({ message: "No body" });

  const doc = await updateDocument(user, params.id, {
    status:     body.status,
    visibility: body.visibility,
    needsSign:  body.needsSign,
    name:       body.name,
  });
  return ok(doc);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  const doc = await deleteDocument(user, params.id);
  return ok(doc);
}
