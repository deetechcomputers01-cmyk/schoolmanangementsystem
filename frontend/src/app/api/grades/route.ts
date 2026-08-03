import { getCurrentUser } from "@backend/auth/cookies";
import { handleApiError, ok, unauthorized, forbidden } from "@/lib/http";
import { createGrade, listGrades } from "@backend/services/grade.service";
import { gradeSchema } from "@backend/validation/grades";

const GRADES_READ_ROLES = ["super_admin", "principal", "teacher", "staff"];

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!GRADES_READ_ROLES.includes(user.role)) return forbidden();
    return ok({ grades: await listGrades() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = gradeSchema.parse(await request.json());
    return ok({ grade: await createGrade(user, body) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
