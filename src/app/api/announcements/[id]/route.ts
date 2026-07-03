import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { updateAnnouncement, deleteAnnouncement } from "@backend/services/announcement.service";
import { updateAnnouncementSchema } from "@backend/validation/announcements";
import { ok, badRequest, forbidden, unauthorized, notFound } from "@/lib/http";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  const body = await request.json();
  const parsed = updateAnnouncementSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten().fieldErrors);

  try {
    const ann = await updateAnnouncement(user, params.id, parsed.data);
    return ok(ann);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Record to update")) return notFound();
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  try {
    const ann = await deleteAnnouncement(user, params.id);
    return ok(ann);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Record to delete")) return notFound();
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
