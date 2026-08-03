import { getCurrentUser } from "@backend/auth/cookies";
import { handleApiError, ok } from "@/lib/http";
import { listAttendance, recordAttendance } from "@backend/services/attendance.service";
import { attendanceSchema } from "@backend/validation/attendance";
import { prisma } from "@backend/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    let classIds: string[] | undefined;
    if (user?.role === "teacher") {
      const staff = await prisma.staff.findFirst({
        where: { userId: user.id },
        select: { subjects: { select: { classId: true } } }
      });
      if (staff?.subjects.length) {
        classIds = [...new Set(staff.subjects.map((s) => s.classId))];
      }
    }
    return ok({ attendance: await listAttendance(classIds) });
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
