import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { createApprovalRequest, listApprovalRequests } from "@backend/services/approvals.service";
import { ok, badRequest, unauthorized, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const scopeParam = request.nextUrl.searchParams.get("scope");
  const scope = scopeParam === "mine" ? "mine" : scopeParam === "all" ? "all" : "queue";

  try {
    const requests = await listApprovalRequests(user, scope);
    return ok(requests);
  } catch (e) {
    return handleApiError(e);
  }
}

// Used by producer flows (Expenses, Scholarships, etc.) to raise a new approval request
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const { type, title, payload, steps } = body;
  if (!type || !title || !Array.isArray(steps) || steps.length === 0) {
    return badRequest({ message: ["type, title, and at least one step are required"] });
  }

  try {
    const created = await createApprovalRequest(user, { type, title, payload, steps });
    return ok(created, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
