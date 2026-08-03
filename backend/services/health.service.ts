import { prisma } from "../prisma";
import type { SessionUser } from "@/types/auth";
import { audit } from "./audit.service";

export async function getHealthRecord(studentId: string) {
  return prisma.healthRecord.findUnique({
    where: { studentId },
    include: {
      student:      { select: { firstName: true, lastName: true, admissionNo: true, class: { select: { name: true } } } },
      visits:       { orderBy: { date: "desc" } },
      vaccinations: { orderBy: { date: "desc" } }
    }
  });
}

export async function upsertHealthRecord(
  actor: SessionUser,
  studentId: string,
  data: { bloodGroup?: string; allergies?: string; conditions?: string; emergencyContact?: string; emergencyPhone?: string }
) {
  const record = await prisma.healthRecord.upsert({
    where:  { studentId },
    create: { studentId, ...data },
    update: data,
    include: { student: { select: { firstName: true, lastName: true } } }
  });
  await audit(actor, "upsert_health_record", "HealthRecord", record.id, { studentId });
  return record;
}

export async function addSickVisit(
  actor: SessionUser,
  studentId: string,
  data: {
    complaint: string;
    treatment?: string;
    notes?: string;
    date?: string;
    status?: string;
    triage?: string;
    vitalsTemp?: string;
    vitalsBp?: string;
  }
) {
  const record = await prisma.healthRecord.upsert({
    where:  { studentId },
    create: { studentId },
    update: {}
  });
  const visit = await prisma.sickVisit.create({
    data: {
      healthRecordId: record.id,
      complaint:      data.complaint,
      treatment:      data.treatment,
      notes:          data.notes,
      date:           data.date ? new Date(data.date) : new Date(),
      status:         data.status    ?? "waiting",
      triage:         data.triage    ?? "routine",
      vitalsTemp:     data.vitalsTemp ?? undefined,
      vitalsBp:       data.vitalsBp   ?? undefined,
    }
  });
  await audit(actor, "add_sick_visit", "SickVisit", visit.id, { studentId, complaint: data.complaint });
  return visit;
}

export async function addVaccination(
  actor: SessionUser,
  studentId: string,
  data: { vaccineName: string; date: string; nextDue?: string; notes?: string }
) {
  const record = await prisma.healthRecord.upsert({
    where:  { studentId },
    create: { studentId },
    update: {}
  });
  const vax = await prisma.vaccination.create({
    data: {
      healthRecordId: record.id,
      vaccineName:    data.vaccineName,
      date:           new Date(data.date),
      nextDue:        data.nextDue ? new Date(data.nextDue) : null,
      notes:          data.notes
    }
  });
  await audit(actor, "add_vaccination", "Vaccination", vax.id, { studentId, vaccineName: data.vaccineName });
  return vax;
}

export async function listStudentsWithHealthRecords() {
  return prisma.student.findMany({
    include: {
      class:        { select: { name: true } },
      healthRecord: { select: { id: true, bloodGroup: true, _count: { select: { visits: true } } } }
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }]
  });
}
