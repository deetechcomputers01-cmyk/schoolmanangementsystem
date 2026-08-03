import { cookies } from "next/headers";
import { fail, handleApiError, ok } from "@/lib/http";
import { setAuthCookies } from "@backend/auth/cookies";
import { verifyRefreshToken } from "@backend/auth/tokens";
import { isIPBlocked } from "@backend/services/blocked-ip.service";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (await isIPBlocked(ip)) return fail("Forbidden", 403);

    const token = cookies().get("refreshToken")?.value;
    if (!token) return fail("Unauthorized", 401);
    const payload = await verifyRefreshToken(token);
    if (payload.tokenType !== "refresh") return fail("Unauthorized", 401);
    const user = { id: payload.id, name: payload.name, email: payload.email, role: payload.role, rememberDevice: payload.rememberDevice };
    await setAuthCookies(user, { rememberDevice: !!payload.rememberDevice });
    return ok({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
