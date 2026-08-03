import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import { join } from "path";

const imageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const documentTypes = new Map([
  ["application/pdf", "pdf"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
  ["application/msword", "doc"],
]);

const maxPhotoSize = 5 * 1024 * 1024;
const maxDocumentSize = 10 * 1024 * 1024;

export async function saveStaffPhoto(file: File) {
  const extension = imageTypes.get(file.type);

  if (!extension) {
    throw new Error("Staff photo must be a JPG, PNG, or WEBP image.");
  }

  if (file.size > maxPhotoSize) {
    throw new Error("Staff photo must be 5MB or smaller.");
  }

  const uploadDir = join(process.cwd(), "public", "uploads", "staff");
  await mkdir(uploadDir, { recursive: true });

  const fileName = `${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(join(uploadDir, fileName), bytes);

  return `/uploads/staff/${fileName}`;
}

export async function saveStaffDocument(file: File) {
  const extension = documentTypes.get(file.type);

  if (!extension) {
    throw new Error("Staff documents must be PDF, DOC, DOCX, JPG, or PNG files.");
  }

  if (file.size > maxDocumentSize) {
    throw new Error("Each staff document must be 10MB or smaller.");
  }

  const uploadDir = join(process.cwd(), "public", "uploads", "staff-documents");
  await mkdir(uploadDir, { recursive: true });

  const fileName = `${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(join(uploadDir, fileName), bytes);

  return {
    name: file.name,
    url: `/uploads/staff-documents/${fileName}`,
    type: extension,
    size: file.size,
  };
}
