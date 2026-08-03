import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { updateSettings } from "@backend/services/settings.service";
import { saveSchoolLetterhead } from "@backend/uploads/settings-letterhead";
import { ok, badRequest, forbidden, unauthorized, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return badRequest({ message: "A letterhead file is required." });

    const letterheadUrl = await saveSchoolLetterhead(file);
    const settings = await updateSettings(user, { letterheadUrl });
    return ok(settings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

    const settings = await updateSettings(user, { letterheadUrl: "" });
    return ok(settings);
  } catch (error) {
    return handleApiError(error);
  }
}
