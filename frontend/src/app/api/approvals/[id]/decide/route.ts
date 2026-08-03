import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { decideApprovalStep } from "@backend/services/approvals.service";
import { ok, badRequest, unauthorized, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const { decision, reason } = body;
  if (decision !== "approved" && decision !== "rejected") {
    return badRequest({ decision: ["Must be 'approved' or 'rejected'"] });
  }

  try {
    const updated = await decideApprovalStep(user, params.id, decision, reason);
    return ok(updated);
  } catch (e) {
    return handleApiError(e);
  }
}
