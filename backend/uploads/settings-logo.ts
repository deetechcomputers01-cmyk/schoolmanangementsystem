import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/svg+xml", "svg"],
]);

const maxLogoSize = 2 * 1024 * 1024;

export async function saveSchoolLogo(file: File) {
  const extension = allowedTypes.get(file.type);
  if (!extension) {
    throw new Error("Logo must be a PNG, JPG, WEBP, or SVG image.");
  }
  if (file.size > maxLogoSize) {
    throw new Error("Logo must be 2MB or smaller.");
  }

  const uploadDir = join(process.cwd(), "public", "uploads", "school");
  await mkdir(uploadDir, { recursive: true });

  const fileName = `logo-${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(join(uploadDir, fileName), bytes);

  return `/uploads/school/${fileName}`;
}
