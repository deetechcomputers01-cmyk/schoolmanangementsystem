import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { listAssets, createAsset } from "@backend/services/asset.service";
import { saveAssetImage } from "@backend/uploads/asset-media";
import { ok, badRequest, unauthorized, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try {
    return ok(await listAssets());
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let name: string, category: string, location: string | undefined, custodianId: string | undefined, quantity: number, value: number | undefined, imageUrl: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      name = String(formData.get("name") ?? "");
      category = String(formData.get("category") ?? "");
      location = String(formData.get("location") ?? "") || undefined;
      custodianId = String(formData.get("custodianId") ?? "") || undefined;
      quantity = Number(formData.get("quantity") ?? 1);
      const valueRaw = formData.get("value");
      value = valueRaw ? Number(valueRaw) : undefined;
      const photo = formData.get("image");
      if (photo instanceof File && photo.size > 0) imageUrl = await saveAssetImage(photo);
    } else {
      const body = await request.json();
      ({ name, category, location, custodianId, quantity = 1, value } = body);
    }

    if (!name?.trim() || !category?.trim()) return badRequest({ message: ["name and category are required"] });

    const asset = await createAsset(user, { name: name.trim(), category: category.trim(), location, custodianId, quantity, value, imageUrl });
    return ok(asset, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
