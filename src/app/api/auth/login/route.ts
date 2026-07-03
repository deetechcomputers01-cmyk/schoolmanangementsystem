import { loginSchema } from "@backend/validation/auth";
import { login } from "@backend/services/auth.service";
import { handleApiError, ok } from "@/lib/http";
import { setAuthCookies } from "@backend/auth/cookies";

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const user = await login(body.email, body.password);
    await setAuthCookies(user);
    return ok({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
