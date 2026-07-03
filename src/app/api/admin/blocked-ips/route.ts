import { type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/cookies";
import { listBlockedIPs, blockIP, isIPBlocked } from "@/lib/services/blocked-ip.service";
import { blockIPSchema } from "@/lib/validation/users";
import { ok, badRequest, forbidden, unauthorized } from "@/lib/http";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin") return forbidden();

  const list = await listBlockedIPs();
  return ok(list);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin") return forbidden();

  const body = await request.json();
  const parsed = blockIPSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten().fieldErrors);

  const blocked = await blockIP(user, parsed.data);
  return ok(blocked, 201);
}
