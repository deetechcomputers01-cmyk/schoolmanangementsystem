import { clearAuthCookies } from "@/lib/auth/cookies";
import { ok } from "@/lib/http";

export async function POST() {
  clearAuthCookies();
  return ok({ success: true });
}
