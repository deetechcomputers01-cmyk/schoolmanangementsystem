import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { prisma } from "@backend/prisma";
import { ok, badRequest, forbidden, unauthorized } from "@/lib/http";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "1";

  const classes = await prisma.class.findMany({
    where: includeInactive ? undefined : { isActive: true },
    include: { _count: { select: { students: true, subjects: true } } },
    orderBy: [{ order: { sort: "asc", nulls: "last" } }, { name: "asc" }],
  });
  return ok(classes);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  const body = await request.json().catch(() => ({}));
  const { name, level } = body;
  if (!name || typeof name !== "string" || !name.trim()) return badRequest({ name: ["Name is required"] });
  if (!level || typeof level !== "string" || !level.trim()) return badRequest({ level: ["Level is required"] });

  const room = typeof body.room === "string" && body.room.trim() ? body.room.trim() : null;
  const capacity = typeof body.capacity === "number" && Number.isFinite(body.capacity) ? Math.max(0, Math.round(body.capacity)) : null;
  const order = typeof body.order === "number" && Number.isFinite(body.order) ? Math.round(body.order) : null;

  let classTeacherId: string | null = null;
  if (typeof body.classTeacherId === "string" && body.classTeacherId) {
    const teacher = await prisma.staff.findUnique({ where: { id: body.classTeacherId } });
    if (!teacher || teacher.staffCategory !== "teaching") {
      return badRequest({ classTeacherId: ["Only a teacher can be assigned as class teacher"] });
    }
    classTeacherId = teacher.id;
  }

  try {
    const cls = await prisma.class.create({ data: { name: name.trim(), level: level.trim(), room, capacity, order, classTeacherId } });
    return ok(cls, 201);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg.includes("Unique constraint")) return badRequest({ name: ["A class with this name already exists"] });
    throw e;
  }
}
