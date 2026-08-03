import { cookies } from "next/headers";
import type { SessionUser } from "@/types/auth";
import { signAccessToken, signRefreshToken, verifyAccessToken } from "./tokens";
import { getSettings } from "../services/settings.service";

const secure = process.env.NODE_ENV === "production";

type AuthCookieOptions = {
  rememberDevice?: boolean;
};

async function getSessionTimeoutMinutes(): Promise<number> {
  try {
    const settings = await getSettings();
    const ex = (settings.extra ?? {}) as Record<string, unknown>;
    const minutes = Number(ex.sessionTimeout);
    return Number.isFinite(minutes) && minutes > 0 ? minutes : 60;
  } catch {
    return 60;
  }
}

export async function setAuthCookies(user: SessionUser, options: AuthCookieOptions = {}) {
  const rememberDevice = options.rememberDevice ?? user.rememberDevice ?? false;
  const tokenUser: SessionUser = { ...user, rememberDevice };
  const timeoutMinutes = await getSessionTimeoutMinutes();
  const jar = cookies();
  jar.set("accessToken", await signAccessToken(tokenUser, timeoutMinutes), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * timeoutMinutes
  });
  jar.set("refreshToken", await signRefreshToken(tokenUser), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    ...(rememberDevice ? { maxAge: 60 * 60 * 24 * 7 } : {})
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
