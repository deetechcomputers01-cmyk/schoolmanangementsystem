import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { listServings, markServed } from "@backend/services/canteen.service";
import { ok, badRequest, unauthorized, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const menuId = request.nextUrl.searchParams.get("menuId");
  if (!menuId) return badRequest({ menuId: ["menuId is required"] });
  try {
    return ok(await listServings(menuId));
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const { menuId, studentIds } = body;
  if (!menuId || !Array.isArray(studentIds) || studentIds.length === 0) {
    return badRequest({ message: ["menuId and at least one studentId are required"] });
  }
  try {
    const result = await markServed(user, { menuId, studentIds });
    return ok(result, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
