import { getCurrentUser } from "@backend/auth/cookies";
import { handleApiError, ok, unauthorized, forbidden } from "@/lib/http";
import { prisma } from "@backend/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const routeSchema = z.object({
  name:          z.string().min(1),
  vehicleId:     z.string().nullable().optional(),
  morningPickup: z.string().min(4).default("06:30"),
  afternoonDrop: z.string().min(4).default("15:30"),
  stops:         z.array(z.string()).default([]),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const routes = await prisma.transportRoute.findMany({
      include: {
        vehicle: { select: { id: true, regNo: true, make: true, type: true, capacity: true } },
        students: { include: { student: { select: { id: true, firstName: true, lastName: true, class: { select: { name: true } } } } } },
      },
      orderBy: { name: "asc" },
    });
    return ok({ routes });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["super_admin", "principal"].includes(user.role)) return forbidden();
    const body = routeSchema.parse(await request.json());
    const route = await prisma.transportRoute.create({
      data: {
        name:          body.name,
        vehicleId:     body.vehicleId ?? null,
        morningPickup: body.morningPickup,
        afternoonDrop: body.afternoonDrop,
        stops:         body.stops,
      },
    });
    return ok({ route }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
