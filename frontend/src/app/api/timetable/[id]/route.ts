import { getCurrentUser } from "@backend/auth/cookies";
import { handleApiError, ok } from "@/lib/http";
import { removeTimetableSlot, updateTimetableSlot } from "@backend/services/timetable.service";
import { timetableSchema } from "@backend/validation/timetable";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    const body = timetableSchema.partial().parse(await request.json());
    return ok({ slot: await updateTimetableSlot(user, params.id, body) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    return ok({ slot: await removeTimetableSlot(user, params.id) });
  } catch (error) {
    return handleApiError(error);
  }
}
