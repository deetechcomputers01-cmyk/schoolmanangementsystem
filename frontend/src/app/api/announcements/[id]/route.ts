import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { deleteAnnouncement, updateAnnouncement } from "@backend/services/announcement.service";
import { updateAnnouncementSchema } from "@backend/validation/announcements";
import { badRequest, forbidden, handleApiError, notFound, ok, unauthorized } from "@/lib/http";

function isMissingRecord(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code ?? "")
    : "";
  const message = error instanceof Error ? error.message : String(error ?? "");

  return code === "P2025"
    || /record to update|record to delete|no .* found|expected a record/i.test(message);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  try {
    const body = await request.json();
    const parsed = updateAnnouncementSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.flatten().fieldErrors);

    const announcement = await updateAnnouncement(user, params.id, parsed.data);
    return ok(announcement);
  } catch (error: unknown) {
    if (isMissingRecord(error)) return notFound();
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  try {
    const announcement = await deleteAnnouncement(user, params.id);
    return ok(announcement);
  } catch (error: unknown) {
    if (isMissingRecord(error)) return notFound();
    return handleApiError(error);
  }
}
