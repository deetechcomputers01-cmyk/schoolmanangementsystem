import { loginSchema } from "@backend/validation/auth";
import { login } from "@backend/services/auth.service";
import { isIPBlocked } from "@backend/services/blocked-ip.service";
import { handleApiError, ok, forbidden } from "@/lib/http";
import { setAuthCookies } from "@backend/auth/cookies";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (await isIPBlocked(ip)) return forbidden();

    const body = loginSchema.parse(await request.json());
    const user = await login(body.email, body.password);
    await setAuthCookies(user, { rememberDevice: body.rememberDevice });
    return ok({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
