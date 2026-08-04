import type { SessionUser } from "@/types/auth";
import { prisma } from "../prisma";
import { audit } from "./audit.service";

function assertCanManage(actor: SessionUser | null) {
  if (!actor || !["super_admin", "principal"].includes(actor.role)) throw new Error("Forbidden");
}

export function listVehicles() {
  return prisma.vehicle.findMany({
    include: { driver: { select: { id: true, firstName: true, lastName: true, roleTitle: true } } },
    orderBy: { regNo: "asc" },
  });
}

export async function createVehicle(actor: SessionUser, input: { regNo: string; make: string; capacity: number; type: string; driverId?: string | null }) {
  assertCanManage(actor);
  const vehicle = await prisma.vehicle.create({ data: input });
  await audit(actor, "create", "Vehicle", vehicle.id, input);
  return vehicle;
}

export async function updateVehicle(actor: SessionUser, id: string, input: Partial<{ regNo: string; make: string; capacity: number; type: string; driverId: string | null }>) {
  assertCanManage(actor);
  const vehicle = await prisma.vehicle.update({ where: { id }, data: input });
  await audit(actor, "update", "Vehicle", id, input);
  return vehicle;
}

// Driver reports their own live position — only the vehicle's assigned driver may call this
export async function updateVehicleLocation(
  actor: SessionUser,
  vehicleId: string,
  input: { latitude: number; longitude: number; heading?: number; speed?: number }
) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId }, include: { driver: { select: { userId: true } } } });
  if (!vehicle) throw new Error("Vehicle not found");
  if (actor.role !== "super_admin" && vehicle.driver?.userId !== actor.id) throw new Error("Forbidden");

  return prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      latitude: input.latitude,
      longitude: input.longitude,
      heading: input.heading,
      speed: input.speed,
      locationUpdatedAt: new Date(),
    },
  });
}

export async function updateRoute(actor: SessionUser, id: string, input: Partial<{ name: string; vehicleId: string | null; morningPickup: string; afternoonDrop: string; stops: string[] }>) {
  assertCanManage(actor);
  const route = await prisma.transportRoute.update({ where: { id }, data: input });
  await audit(actor, "update", "TransportRoute", id, input);
  return route;
}

export async function assignStudentsToRoute(actor: SessionUser, routeId: string, studentIds: string[]) {
  assertCanManage(actor);
  const results = await Promise.all(
    studentIds.map((studentId) =>
      prisma.studentTransport.upsert({
        where: { studentId_routeId: { studentId, routeId } },
        update: {},
        create: { studentId, routeId },
      })
    )
  );
  await audit(actor, "assign", "TransportRoute", routeId, { count: results.length });
  return results;
}

export async function unassignStudentFromRoute(actor: SessionUser, routeId: string, studentId: string) {
  assertCanManage(actor);
  await prisma.studentTransport.deleteMany({ where: { routeId, studentId } });
  await audit(actor, "unassign", "TransportRoute", routeId, { studentId });
}
