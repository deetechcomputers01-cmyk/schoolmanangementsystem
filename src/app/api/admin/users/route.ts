import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/cookies";
import { listUsers } from "@/lib/services/user.service";
import { isIPBlocked } from "@/lib/services/blocked-ip.service";
import { ok, forbidden, unauthorized } from "@/lib/http";

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (await isIPBlocked(ip)) return forbidden();

  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin") return forbidden();

  const users = await listUsers(user);
  return ok(users);
}
