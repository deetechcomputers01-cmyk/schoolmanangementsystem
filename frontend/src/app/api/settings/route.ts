import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { getSettings, updateSettings } from "@backend/services/settings.service";
import { updateSettingsSchema } from "@backend/validation/settings";
import { ok, badRequest, forbidden, unauthorized } from "@/lib/http";
import type { Prisma } from "@prisma/client";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const settings = await getSettings();
  return ok(settings);
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  const body = await request.json();
  const parsed = updateSettingsSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten().fieldErrors);

  const { extra, gradingScale, ...rest } = parsed.data;
  const settings = await updateSettings(user, {
    ...rest,
    extra: extra as Prisma.InputJsonValue | undefined,
    gradingScale: gradingScale as Prisma.InputJsonValue | undefined,
  });
  return ok(settings);
}
