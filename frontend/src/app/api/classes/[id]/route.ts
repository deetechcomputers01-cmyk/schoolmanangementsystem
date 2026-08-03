import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { prisma } from "@backend/prisma";
import { ok, badRequest, forbidden, unauthorized } from "@/lib/http";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.level === "string" && body.level.trim()) data.level = body.level.trim();
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (body.room === null || typeof body.room === "string") data.room = body.room?.trim() || null;
  if (body.capacity === null) data.capacity = null;
  else if (typeof body.capacity === "number" && Number.isFinite(body.capacity)) data.capacity = Math.max(0, Math.round(body.capacity));
  if (body.order === null) data.order = null;
  else if (typeof body.order === "number" && Number.isFinite(body.order)) data.order = Math.round(body.order);

  if (body.classTeacherId === null) {
    data.classTeacherId = null;
  } else if (typeof body.classTeacherId === "string" && body.classTeacherId) {
    const teacher = await prisma.staff.findUnique({ where: { id: body.classTeacherId } });
    if (!teacher || teacher.staffCategory !== "teaching") {
      return badRequest({ classTeacherId: ["Only a teacher can be assigned as class teacher"] });
    }
    data.classTeacherId = teacher.id;
  }

  try {
    const cls = await prisma.class.update({ where: { id: params.id }, data });
    return ok(cls);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg.includes("Unique constraint")) return badRequest({ name: ["A class with this name already exists"] });
    if (msg.includes("Record to update not found")) return badRequest({ id: ["Class not found"] });
    throw e;
  }
}
