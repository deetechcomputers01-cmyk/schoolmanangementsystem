import { getCurrentUser } from "@/lib/auth/cookies";
import { handleApiError, ok } from "@/lib/http";
import { createGrade, listGrades } from "@/lib/services/grade.service";
import { gradeSchema } from "@/lib/validation/grades";

export async function GET() {
  try {
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
