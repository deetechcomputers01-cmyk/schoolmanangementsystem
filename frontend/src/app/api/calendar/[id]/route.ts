import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { deleteCalendarEvent } from "@backend/services/calendar.service";
import { ok, unauthorized, notFound } from "@/lib/http";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try {
    await deleteCalendarEvent(user, params.id);
    return ok({ deleted: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Not found") return notFound();
    throw e;
  }
}
