import { loginSchema } from "@/lib/validation/auth";
import { login } from "@/lib/services/auth.service";
import { handleApiError, ok } from "@/lib/http";
import { setAuthCookies } from "@/lib/auth/cookies";

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
