import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { upsertMenu } from "@backend/services/canteen.service";
import { ok, badRequest, unauthorized, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const { weekOf, day, mealType, items } = body;
  if (!weekOf || !day || !mealType || !Array.isArray(items)) {
    return badRequest({ message: ["weekOf, day, mealType, and items are required"] });
  }

  try {
    const menu = await upsertMenu(user, { weekOf, day, mealType, items });
    return ok(menu, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
