import { getCurrentUser } from "@backend/auth/cookies";
import { removeStaff } from "@backend/services/staff.service";
import { badRequest, handleApiError, ok } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json().catch(() => null);
    const ids: unknown = body?.ids;
    if (!Array.isArray(ids) || ids.length === 0) return badRequest({ message: "ids is required" });

    const results = await Promise.allSettled(ids.map((id) => removeStaff(user, String(id))));
    const deleted = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - deleted;
    return ok({ deleted, failed });
  } catch (error) {
    return handleApiError(error);
  }
}
