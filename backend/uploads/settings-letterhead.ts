import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const maxLetterheadSize = 5 * 1024 * 1024;

export async function saveSchoolLetterhead(file: File) {
  const extension = allowedTypes.get(file.type);
  if (!extension) {
    throw new Error("Letterhead must be a PNG, JPG, or WEBP image.");
  }
  if (file.size > maxLetterheadSize) {
    throw new Error("Letterhead must be 5MB or smaller.");
  }

  const uploadDir = join(process.cwd(), "public", "uploads", "school");
  await mkdir(uploadDir, { recursive: true });

  const fileName = `letterhead-${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(join(uploadDir, fileName), bytes);

  return `/uploads/school/${fileName}`;
}
