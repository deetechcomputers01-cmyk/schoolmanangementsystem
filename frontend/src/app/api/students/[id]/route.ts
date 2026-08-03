import { getCurrentUser } from "@backend/auth/cookies";
import { saveStudentPhoto, saveStudentDocument } from "@backend/uploads/student-photo";
import { fail, handleApiError, ok } from "@/lib/http";
import { getStudent, removeStudent, updateStudent } from "@backend/services/student.service";
import { syncOwnerDocument } from "@backend/services/documents.service";
import { studentUpdateSchema } from "@backend/validation/students";

export const runtime = "nodejs";

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
    const { body, newDocuments, photoUrl } = await parseStudentPatchRequest(request);
    const student = await updateStudent(user, params.id, body);

    // Mirror real new uploads into the Document Center's canonical store
    if (student.userId) {
      await Promise.all([
        ...(photoUrl ? [syncOwnerDocument(student.userId, "student-records", { name: "Profile Photo", url: photoUrl, type: "image", size: 0 })] : []),
        ...newDocuments.map((doc) => syncOwnerDocument(student.userId!, "student-records", doc)),
      ]);
    }

    return ok({ student });
  } catch (error) {
    return handleApiError(error);
  }
}

async function parseStudentPatchRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return { body: studentUpdateSchema.parse(await request.json()), newDocuments: [], photoUrl: undefined as string | undefined };
  }

  const formData = await request.formData();
  const photo = formData.get("photo");
  const photoUrl = photo instanceof File && photo.size > 0 ? await saveStudentPhoto(photo) : undefined;

  const newDocuments = await Promise.all(
    formData
      .getAll("documents")
      .filter((item): item is File => item instanceof File && item.size > 0)
      .map((file) => saveStudentDocument(file)),
  );

  const raw: Record<string, unknown> = {};
  if (photoUrl) raw.photoUrl = photoUrl;
  for (const key of ["admissionNo", "firstName", "lastName", "gender", "dateOfBirth", "address", "classId"]) {
    const value = formData.get(key);
    if (value !== null) raw[key] = String(value);
  }

  return { body: studentUpdateSchema.parse(raw), newDocuments, photoUrl };
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    return ok({ student: await removeStudent(user, params.id) });
  } catch (error) {
    return handleApiError(error);
  }
}
