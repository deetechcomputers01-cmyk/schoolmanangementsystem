import { getCurrentUser } from "@backend/auth/cookies";
import { saveStaffDocument, saveStaffPhoto } from "@backend/uploads/staff-media";
import { createStaff, listStaff } from "@backend/services/staff.service";
import { staffSchema } from "@backend/validation/staff";
import { forbidden, handleApiError, ok, unauthorized } from "@/lib/http";

export const runtime = "nodejs";

const STAFF_READ_ROLES = ["super_admin", "principal", "staff"];

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!STAFF_READ_ROLES.includes(user.role)) return forbidden();
    return ok({ staff: await listStaff() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await parseStaffRequest(request);
    return ok({ staff: await createStaff(user, body) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

async function parseStaffRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return staffSchema.parse(await request.json());
  }

  const formData = await request.formData();
  const photo = formData.get("photo");
  const photoUrl = photo instanceof File && photo.size > 0 ? await saveStaffPhoto(photo) : undefined;
  const documents = await Promise.all(
    formData
      .getAll("documents")
      .filter((item): item is File => item instanceof File && item.size > 0)
      .map((file) => saveStaffDocument(file)),
  );

  return staffSchema.parse({
    staffNo: String(formData.get("staffNo") ?? ""),
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    roleTitle: String(formData.get("roleTitle") ?? ""),
    email: String(formData.get("email") ?? ""),
    photoUrl,
    documents,
    staffCategory: String(formData.get("staffCategory") ?? "teaching"),
    isTeaching: String(formData.get("isTeaching") ?? "") === "true",
  });
}
