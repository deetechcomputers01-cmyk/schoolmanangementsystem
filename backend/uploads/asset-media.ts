import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import { join } from "path";

const imageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const maxPhotoSize = 5 * 1024 * 1024;

export async function saveAssetImage(file: File) {
  const extension = imageTypes.get(file.type);
  if (!extension) throw new Error("Asset image must be a JPG, PNG, or WEBP image.");
  if (file.size > maxPhotoSize) throw new Error("Asset image must be 5MB or smaller.");

  const uploadDir = join(process.cwd(), "public", "uploads", "assets");
  await mkdir(uploadDir, { recursive: true });

  const fileName = `${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(join(uploadDir, fileName), bytes);

  return `/uploads/assets/${fileName}`;
}
