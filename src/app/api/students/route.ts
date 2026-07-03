import { getCurrentUser } from "@/lib/auth/cookies";
import { handleApiError, ok } from "@/lib/http";
import { saveStudentPhoto } from "@/lib/uploads/student-photo";
import { createStudent, listStudents } from "@/lib/services/student.service";
import { studentSchema } from "@/lib/validation/students";

export const runtime = "nodejs";

export async function GET() {
  try {
    return ok({ students: await listStudents() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await parseStudentRequest(request);
    return ok({ student: await createStudent(user, body) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

async function parseStudentRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return studentSchema.parse(await request.json());
  }

  const formData = await request.formData();
  const photo = formData.get("photo");
  const photoUrl = photo instanceof File && photo.size > 0 ? await saveStudentPhoto(photo) : undefined;

  return studentSchema.parse({
    admissionNo: String(formData.get("admissionNo") ?? ""),
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    gender: String(formData.get("gender") ?? ""),
    dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
    address: String(formData.get("address") ?? ""),
    photoUrl,
    classId: String(formData.get("classId") ?? ""),
    guardian: {
      name: String(formData.get("guardianName") ?? ""),
      phone: String(formData.get("guardianPhone") ?? ""),
      email: String(formData.get("guardianEmail") ?? ""),
      relation: String(formData.get("relation") ?? "")
    }
  });
}
