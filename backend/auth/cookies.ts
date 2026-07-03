import { cookies } from "next/headers";
import type { SessionUser } from "@/types/auth";
import { signAccessToken, signRefreshToken, verifyAccessToken } from "./tokens";

const secure = process.env.NODE_ENV === "production";

export async function setAuthCookies(user: SessionUser) {
  const jar = cookies();
  jar.set("accessToken", await signAccessToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 15
  });
  jar.set("refreshToken", await signRefreshToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearAuthCookies() {
  cookies().delete("accessToken");
  cookies().delete("refreshToken");
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = cookies().get("accessToken")?.value;
  if (!token) return null;
  try {
    const payload = await verifyAccessToken(token);
    if (payload.tokenType !== "access") return null;
    return { id: payload.id, name: payload.name, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}
