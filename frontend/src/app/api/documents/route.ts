import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { listDocuments, createDocument, getDocumentStats, getFolderCounts } from "@backend/services/documents.service";
import { saveGeneralDocument } from "@backend/uploads/document-media";
import { ok, unauthorized, forbidden, badRequest, handleApiError } from "@/lib/http";

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  const { searchParams } = req.nextUrl;

  if (searchParams.get("stats") === "1") {
    const [stats, folderCounts] = await Promise.all([getDocumentStats(), getFolderCounts()]);
    return ok({ stats, folderCounts });
  }

  const filters = {
    category:   searchParams.get("category")   ?? undefined,
    status:     searchParams.get("status")     ?? undefined,
    visibility: searchParams.get("visibility") ?? undefined,
  };
  const docs = await listDocuments(filters);
  return ok(docs);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  try {
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      if (!(file instanceof File) || file.size === 0) return badRequest({ message: "A file is required" });
      const category = String(formData.get("category") ?? "");
      if (!category) return badRequest({ message: "category is required" });

      const saved = await saveGeneralDocument(file);
      const doc = await createDocument(user, {
        name: String(formData.get("name") ?? file.name),
        category,
        visibility: String(formData.get("visibility") ?? "internal"),
        classDept: String(formData.get("classDept") ?? "") || undefined,
        fileType: saved.type,
        fileSize: fmtSize(saved.size),
        fileUrl: saved.url,
        isTemplate: formData.get("isTemplate") === "true",
      });
      return ok(doc, 201);
    }

    const body = await req.json().catch(() => null);
    if (!body?.name || !body?.category) return badRequest({ message: "name and category are required" });

    const doc = await createDocument(user, {
      name:       body.name,
      category:   body.category,
      visibility: body.visibility,
      classDept:  body.classDept,
      fileType:   body.fileType,
      fileSize:   body.fileSize,
      fileUrl:    body.fileUrl,
      isTemplate: body.isTemplate,
    });
    return ok(doc, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
