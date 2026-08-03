import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { revokeScholarship } from "@backend/services/scholarship.service";
import { ok, unauthorized, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try {
    const updated = await revokeScholarship(user, params.id);
    return ok(updated);
  } catch (e) {
    return handleApiError(e);
  }
}
