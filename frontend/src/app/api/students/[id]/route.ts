import { getCurrentUser } from "@backend/auth/cookies";
import { fail, handleApiError, ok } from "@/lib/http";
import { getStudent, removeStudent, updateStudent } from "@backend/services/student.service";
import { studentUpdateSchema } from "@backend/validation/students";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const student = await getStudent(params.id);
    if (!student) return fail("Student not found", 404);
    return ok({ student });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    const body = studentUpdateSchema.parse(await request.json());
    return ok({ student: await updateStudent(user, params.id, body) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    return ok({ student: await removeStudent(user, params.id) });
  } catch (error) {
    return handleApiError(error);
  }
}
