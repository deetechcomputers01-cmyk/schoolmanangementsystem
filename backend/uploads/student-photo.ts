import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
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

export async function saveStudentPhoto(file: File) {
  const extension = allowedTypes.get(file.type);

  if (!extension) {
    throw new Error("Student photo must be a JPG, PNG, or WEBP image.");
  }

  if (file.size > maxPhotoSize) {
    throw new Error("Student photo must be 5MB or smaller.");
  }

  const uploadDir = join(process.cwd(), "public", "uploads", "students");
  await mkdir(uploadDir, { recursive: true });

  const fileName = `${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(join(uploadDir, fileName), bytes);

  return `/uploads/students/${fileName}`;
}

export async function saveStudentDocument(file: File) {
  const extension = documentTypes.get(file.type);
  if (!extension) throw new Error("Student documents must be PDF, DOC, DOCX, JPG, or PNG files.");
  if (file.size > maxDocumentSize) throw new Error("Each student document must be 10MB or smaller.");

  const uploadDir = join(process.cwd(), "public", "uploads", "student-documents");
  await mkdir(uploadDir, { recursive: true });

  const fileName = `${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(join(uploadDir, fileName), bytes);

  return { name: file.name, url: `/uploads/student-documents/${fileName}`, type: extension, size: file.size };
}
