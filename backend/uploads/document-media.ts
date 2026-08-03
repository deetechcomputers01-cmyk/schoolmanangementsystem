import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import { join } from "path";

const documentTypes = new Map([
  ["application/pdf", "pdf"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
  ["application/msword", "doc"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
]);

const maxDocumentSize = 15 * 1024 * 1024;

export async function saveGeneralDocument(file: File) {
  const extension = documentTypes.get(file.type);
  if (!extension) throw new Error("Documents must be PDF, DOC, DOCX, XLSX, JPG, or PNG files.");
  if (file.size > maxDocumentSize) throw new Error("Each document must be 15MB or smaller.");

  const uploadDir = join(process.cwd(), "public", "uploads", "documents");
  await mkdir(uploadDir, { recursive: true });

  const fileName = `${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(join(uploadDir, fileName), bytes);

  return { url: `/uploads/documents/${fileName}`, type: extension, size: file.size };
}
