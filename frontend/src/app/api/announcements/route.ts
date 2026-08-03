import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { listAnnouncements, listAllAnnouncements, createAnnouncement } from "@backend/services/announcement.service";
import { createAnnouncementSchema } from "@backend/validation/announcements";
import { ok, badRequest, forbidden, unauthorized } from "@/lib/http";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  // Admins see all; others see only their audience
  const list = (user.role === "super_admin" || user.role === "principal")
    ? await listAllAnnouncements()
    : await listAnnouncements(user.role);
  return ok(list);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest({ body: ["Valid JSON body is required"] });
  }
  const parsed = createAnnouncementSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten().fieldErrors);

  const ann = await createAnnouncement(user, parsed.data);
  return ok(ann, 201);
}
