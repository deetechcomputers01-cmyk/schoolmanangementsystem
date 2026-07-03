import { prisma } from "../prisma";
import type { SessionUser } from "@/types/auth";
import { audit } from "./audit.service";

export async function listApplications() {
  return prisma.admissionApplication.findMany({
    include: { reviewedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" }
  });
}

export async function createApplication(data: {
  firstName: string; lastName: string; gender: string;
  dateOfBirth: string; address: string; applyingForClass: string;
  guardianName: string; guardianPhone: string;
  guardianEmail?: string; guardianRelation: string;
}) {
  return prisma.admissionApplication.create({
    data: { ...data, dateOfBirth: new Date(data.dateOfBirth) }
  });
}

export async function reviewApplication(
  actor: SessionUser, id: string,
  status: "approved" | "rejected",
  notes?: string
) {
  if (actor.role !== "super_admin" && actor.role !== "principal") throw new Error("Forbidden");

  let admissionNo: string | undefined;
  if (status === "approved") {
    const count = await prisma.admissionApplication.count({ where: { status: "approved" } });
    const year  = new Date().getFullYear();
    admissionNo = `ADM-${year}-${String(count + 1).padStart(3, "0")}`;
  }

  const app = await prisma.admissionApplication.update({
    where: { id },
    data: {
      status,
      notes,
      admissionNo:  admissionNo ?? null,
      reviewedById: actor.id,
      reviewedAt:   new Date()
    }
  });
  await audit(actor, `${status}_application`, "AdmissionApplication", id, { name: `${app.firstName} ${app.lastName}` });
  return app;
}

export async function enrollApplication(actor: SessionUser, id: string) {
  if (actor.role !== "super_admin" && actor.role !== "principal") throw new Error("Forbidden");

  const app = await prisma.admissionApplication.findUniqueOrThrow({ where: { id } });
  if (app.status !== "approved") throw new Error("Application must be approved before enrollment");

  const cls = await prisma.class.findFirst({ where: { name: { contains: app.applyingForClass } } });
  if (!cls) throw new Error(`Class "${app.applyingForClass}" not found. Please create it first.`);

  await prisma.$transaction([
    prisma.student.create({
      data: {
        admissionNo: app.admissionNo!,
        firstName:   app.firstName,
        lastName:    app.lastName,
        gender:      app.gender,
        dateOfBirth: app.dateOfBirth,
        address:     app.address,
        classId:     cls.id,
        guardians: {
          create: {
            name:     app.guardianName,
            phone:    app.guardianPhone,
            email:    app.guardianEmail,
            relation: app.guardianRelation
          }
        }
      }
    }),
    prisma.admissionApplication.update({ where: { id }, data: { status: "enrolled" } })
  ]);

  await audit(actor, "enroll_student", "AdmissionApplication", id, { admissionNo: app.admissionNo });
  return app;
}
