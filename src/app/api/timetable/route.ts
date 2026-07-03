import { getCurrentUser } from "@/lib/auth/cookies";
import { handleApiError, ok } from "@/lib/http";
import { createTimetableSlot, listTimetable } from "@/lib/services/timetable.service";
import { timetableSchema } from "@/lib/validation/timetable";

export async function GET() {
  try {
    return ok({ timetable: await listTimetable() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = timetableSchema.parse(await request.json());
    return ok({ slot: await createTimetableSlot(user, body) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
