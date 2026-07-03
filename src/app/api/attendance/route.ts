import { getCurrentUser } from "@backend/auth/cookies";
import { handleApiError, ok } from "@/lib/http";
import { listAttendance, recordAttendance } from "@backend/services/attendance.service";
import { attendanceSchema } from "@backend/validation/attendance";

export async function GET() {
  try {
    return ok({ attendance: await listAttendance() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = attendanceSchema.parse(await request.json());
    return ok({ attendance: await recordAttendance(user, body) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
