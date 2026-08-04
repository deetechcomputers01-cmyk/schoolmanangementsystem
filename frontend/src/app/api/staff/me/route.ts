import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { updateOwnPhone } from "@backend/services/staff.service";
import { ok, unauthorized, badRequest, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => ({}));
  if (!body.phone?.trim()) return badRequest({ phone: ["Phone number is required"] });

  try {
    const staff = await updateOwnPhone(user, body.phone);
    return ok({ staff });
  } catch (e) {
    return handleApiError(e);
  }
}
