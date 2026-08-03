import type { SessionUser } from "@/types/auth";
import { prisma } from "../prisma";
import { audit } from "./audit.service";

function assertCanManage(actor: SessionUser | null) {
  if (!actor || !["super_admin", "principal", "staff"].includes(actor.role)) throw new Error("Forbidden");
}

export function listHostels() {
  return prisma.hostel.findMany({
    include: {
      rooms: {
        include: {
          allocations: {
            where: { endDate: null },
            include: { student: { select: { id: true, firstName: true, lastName: true, admissionNo: true, class: { select: { name: true } } } } },
          },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

export function listIncidents() {
  return prisma.hostelIncident.findMany({
    include: {
      student: { select: { firstName: true, lastName: true } },
      room: { select: { name: true, hostel: { select: { name: true } } } },
      reportedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function createHostel(actor: SessionUser, name: string) {
  assertCanManage(actor);
  const hostel = await prisma.hostel.create({ data: { name } });
  await audit(actor, "create", "Hostel", hostel.id, { name });
  return hostel;
}

export async function createRoom(actor: SessionUser, input: { hostelId: string; name: string; capacity: number }) {
  assertCanManage(actor);
  if (input.capacity <= 0) throw new Error("Capacity must be greater than 0");
  const room = await prisma.room.create({ data: input });
  await audit(actor, "create", "Room", room.id, input);
  return room;
}

export async function allocateStudent(actor: SessionUser, input: { studentId: string; roomId: string; bedNumber: number }) {
  assertCanManage(actor);

  const room = await prisma.room.findUnique({ where: { id: input.roomId }, include: { allocations: { where: { endDate: null } } } });
  if (!room) throw new Error("Room not found");
  if (room.allocations.some((a) => a.bedNumber === input.bedNumber)) throw new Error("This bed is already occupied");
  if (room.allocations.length >= room.capacity) throw new Error("This room is at full capacity");

  return prisma.$transaction(async (tx) => {
    // End any existing active allocation for this student (e.g. changing bed/room)
    await tx.allocation.updateMany({
      where: { studentId: input.studentId, endDate: null },
      data: { endDate: new Date() },
    });
    const allocation = await tx.allocation.create({ data: input });
    await audit(actor, "allocate", "Allocation", allocation.id, input);
    return allocation;
  });
}

export async function vacateStudent(actor: SessionUser, studentId: string) {
  assertCanManage(actor);
  const result = await prisma.allocation.updateMany({
    where: { studentId, endDate: null },
    data: { endDate: new Date() },
  });
  await audit(actor, "vacate", "Allocation", studentId, {});
  return result;
}

export async function logIncident(actor: SessionUser, input: { studentId?: string; roomId?: string; description: string }) {
  assertCanManage(actor);
  if (!input.description.trim()) throw new Error("Description is required");
  const incident = await prisma.hostelIncident.create({
    data: { studentId: input.studentId, roomId: input.roomId, description: input.description, reportedById: actor.id },
  });
  await audit(actor, "create", "HostelIncident", incident.id, input);
  return incident;
}
