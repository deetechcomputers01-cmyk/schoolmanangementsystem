import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
]);

const maxPhotoSize = 5 * 1024 * 1024;

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
