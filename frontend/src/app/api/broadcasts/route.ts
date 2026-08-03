import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { listBroadcasts, createBroadcast, getBroadcastStats } from "@backend/services/broadcasts.service";
import { ok, unauthorized, forbidden, badRequest } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  const { searchParams } = req.nextUrl;

  if (searchParams.get("stats") === "1") {
    const stats = await getBroadcastStats();
    return ok(stats);
  }

  const filters = {
    status:    searchParams.get("status")    ?? undefined,
    isConsent: searchParams.get("consent") === "1" ? true : undefined,
  };
  const broadcasts = await listBroadcasts(filters);
  return ok(broadcasts);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  const body = await req.json().catch(() => null);
  if (!body?.subject || !body?.body || !body?.audience) {
    return badRequest({ message: "subject, body and audience are required" });
  }
  if (!Array.isArray(body.channels) || body.channels.length === 0) {
    return badRequest({ message: "at least one channel is required" });
  }

  const broadcast = await createBroadcast(user, {
    subject:     body.subject,
    body:        body.body,
    audience:    body.audience,
    channels:    body.channels,
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    isConsent:   body.isConsent ?? false,
  });
  return ok(broadcast, 201);
}
