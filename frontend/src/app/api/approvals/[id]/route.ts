import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { getApprovalRequest } from "@backend/services/approvals.service";
import { ok, unauthorized, notFound, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    const request = await getApprovalRequest(params.id);
    if (!request) return notFound();
    return ok(request);
  } catch (e) {
    return handleApiError(e);
  }
}
