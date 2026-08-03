import { getCurrentUser } from "@backend/auth/cookies";
import { saveStaffDocument, saveStaffPhoto } from "@backend/uploads/staff-media";
import { fail, handleApiError, ok } from "@/lib/http";
import { getStaff, removeStaff, updateStaff } from "@backend/services/staff.service";
import { syncOwnerDocument } from "@backend/services/documents.service";
import { staffSchema } from "@backend/validation/staff";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const staff = await getStaff(params.id);
    if (!staff) return fail("Staff not found", 404);
    return ok({ staff });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    const { body, newDocuments, photoUrl } = await parseStaffPatchRequest(request);
    const staff = await updateStaff(user, params.id, body);

    // Mirror real new uploads into the Document Center's canonical store
    if (staff.user?.id) {
      await Promise.all([
        ...(photoUrl ? [syncOwnerDocument(staff.user.id, "staff-files", { name: "Profile Photo", url: photoUrl, type: "image", size: 0 })] : []),
        ...newDocuments.map((doc) => syncOwnerDocument(staff.user!.id, "staff-files", doc)),
      ]);
    }

    return ok({ staff });
  } catch (error) {
    return handleApiError(error);
  }
}

async function parseStaffPatchRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return { body: staffSchema.partial().parse(await request.json()), newDocuments: [], photoUrl: undefined as string | undefined };
  }

  const formData = await request.formData();
  const photo = formData.get("photo");
  const photoUrl = photo instanceof File && photo.size > 0 ? await saveStaffPhoto(photo) : undefined;

  const keptDocuments = JSON.parse(String(formData.get("keptDocuments") ?? "[]"));
  const newDocuments = await Promise.all(
    formData
      .getAll("documents")
      .filter((item): item is File => item instanceof File && item.size > 0)
      .map((file) => saveStaffDocument(file)),
  );
  const documents = [...keptDocuments, ...newDocuments];

  const raw: Record<string, unknown> = { documents };
  if (photoUrl) raw.photoUrl = photoUrl;
  for (const key of ["staffNo", "firstName", "lastName", "phone", "roleTitle", "email", "staffCategory", "notes"]) {
    const value = formData.get(key);
    if (value !== null) raw[key] = String(value);
  }
  const isTeaching = formData.get("isTeaching");
  if (isTeaching !== null) raw.isTeaching = isTeaching === "true";

  return { body: staffSchema.partial().parse(raw), newDocuments, photoUrl };
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    return ok({ staff: await removeStaff(user, params.id) });
  } catch (error) {
    return handleApiError(error);
  }
}
