import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { updateAsset } from "@backend/services/asset.service";
import { saveAssetImage } from "@backend/uploads/asset-media";
import { ok, unauthorized, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let data: Record<string, unknown> = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      for (const key of ["name", "category", "status", "location", "custodianId"]) {
        const v = formData.get(key);
        if (v !== null) data[key] = String(v) || null;
      }
      const valueRaw = formData.get("value");
      if (valueRaw !== null) data.value = Number(valueRaw);
      const photo = formData.get("image");
      if (photo instanceof File && photo.size > 0) data.imageUrl = await saveAssetImage(photo);
    } else {
      data = await request.json();
    }

    return ok(await updateAsset(user, params.id, data));
  } catch (e) {
    return handleApiError(e);
  }
}
