import { requireRole } from "@backend/auth/page-guard";
import { prisma } from "@backend/prisma";
import { HealthContent } from "./HealthContent";
import type { ClinicVisit, HealthClinicProps } from "./HealthContent";

export const dynamic = "force-dynamic";

export async function HealthScreen() {
  await requireRole("super_admin", "principal", "staff");

  const now        = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd   = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // All non-completed clinic visits (the active sick-bay queue) with full context
  const visits = await prisma.sickVisit.findMany({
    where: { status: { not: "completed" } },
    include: {
      healthRecord: {
        select: {
          allergies:  true,
          conditions: true,
          bloodGroup: true,
          vaccinations: { orderBy: { date: "desc" }, select: { vaccineName: true, date: true, nextDue: true } },
          student: {
            select: {
              id:          true,
              firstName:   true,
              lastName:    true,
              admissionNo: true,
              gender:      true,
              dateOfBirth: true,
              class:    { select: { name: true } },
              guardians: {
                take: 1,
                orderBy: { createdAt: "asc" },
                select: { name: true, phone: true, relation: true },
              },
            },
          },
        },
      },
    },
    orderBy: { date: "asc" },
  });

  // All students (for new visit modal)
  const studentRows = await prisma.student.findMany({
    select: {
      id:        true,
      firstName: true,
      lastName:  true,
      class:     { select: { name: true } },
    },
    orderBy: [{ firstName: "asc" }],
  });

  const [visitsTodayCount, visitsYesterdayCount, alertCount, vaxDueThisMonth] = await Promise.all([
    prisma.sickVisit.count({ where: { date: { gte: todayStart, lt: todayEnd } } }),
    prisma.sickVisit.count({ where: { date: { gte: yesterdayStart, lt: todayStart } } }),
    prisma.healthRecord.count({ where: { OR: [{ allergies: { not: null } }, { conditions: { not: null } }] } }),
    prisma.vaccination.count({ where: { nextDue: { gte: monthStart, lt: monthEnd } } }),
  ]);

  function ageFromDob(dob: Date): number {
    const diff = now.getTime() - dob.getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  }

  const clinicVisits: ClinicVisit[] = visits.map(v => {
    const hr      = v.healthRecord;
    const student = hr.student;
    const guardian = student.guardians[0] ?? null;
    return {
      id:               v.id,
      studentId:        student.id,
      studentName:      `${student.firstName} ${student.lastName}`,
      admNo:            student.admissionNo,
      className:        student.class.name,
      gender:           student.gender,
      age:              ageFromDob(student.dateOfBirth),
      complaint:        v.complaint,
      status:           v.status,
      triage:           v.triage,
      arrivalTime:      v.date.toISOString(),
      treatment:        v.treatment    ?? null,
      notes:            v.notes        ?? null,
      vitalsTemp:       v.vitalsTemp   ?? null,
      vitalsBp:         v.vitalsBp     ?? null,
      allergies:        hr.allergies   ?? null,
      conditions:       hr.conditions  ?? null,
      bloodGroup:       hr.bloodGroup  ?? null,
      guardianName:     guardian?.name     ?? null,
      guardianPhone:    guardian?.phone    ?? null,
      guardianRelation: guardian?.relation ?? null,
      vaccinations:     hr.vaccinations.map(vc => ({
        vaccineName: vc.vaccineName,
        date:        vc.date.toISOString(),
        nextDue:     vc.nextDue ? vc.nextDue.toISOString() : null,
        overdue:     vc.nextDue ? vc.nextDue.getTime() < now.getTime() : false,
      })),
    };
  });

  const stats: HealthClinicProps["stats"] = {
    visitsToday:    visitsTodayCount,
    visitsDelta:    visitsTodayCount - visitsYesterdayCount,
    activeAlerts:   alertCount,
    waiting:        clinicVisits.filter(v => v.status === "waiting").length,
    inConsultation: clinicVisits.filter(v => v.status === "in_consultation").length,
    medicationDue:  clinicVisits.filter(v => v.status === "medication_due").length,
    vaxDueThisMonth,
  };

  return (
    <HealthContent
      visits={clinicVisits}
      stats={stats}
      students={studentRows.map(s => ({
        id:        s.id,
        firstName: s.firstName,
        lastName:  s.lastName,
        className: s.class.name,
      }))}
    />
  );
}
