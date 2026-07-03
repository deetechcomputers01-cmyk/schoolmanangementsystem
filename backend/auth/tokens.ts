import { jwtVerify, SignJWT } from "jose";
import type { SessionUser, JwtPayload } from "@/types/auth";

const encoder = new TextEncoder();

const accessSecret = () => encoder.encode(process.env.JWT_ACCESS_SECRET ?? "dev-access-secret-change-me");
const refreshSecret = () => encoder.encode(process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-change-me");

export async function signAccessToken(user: SessionUser) {
  return new SignJWT({ ...user, tokenType: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(accessSecret());
}

export async function signRefreshToken(user: SessionUser) {
  return new SignJWT({ ...user, tokenType: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(refreshSecret());
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, accessSecret());
  return payload as JwtPayload;
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, refreshSecret());
  return payload as JwtPayload;
}
