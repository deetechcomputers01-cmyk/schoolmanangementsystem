import { cookies } from "next/headers";
import { fail, handleApiError, ok } from "@/lib/http";
import { setAuthCookies } from "@backend/auth/cookies";
import { verifyRefreshToken } from "@backend/auth/tokens";

export async function POST() {
  try {
    const token = cookies().get("refreshToken")?.value;
    if (!token) return fail("Unauthorized", 401);
    const payload = await verifyRefreshToken(token);
    if (payload.tokenType !== "refresh") return fail("Unauthorized", 401);
    const user = { id: payload.id, name: payload.name, email: payload.email, role: payload.role };
    await setAuthCookies(user);
    return ok({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
