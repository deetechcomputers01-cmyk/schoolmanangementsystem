import { getCurrentUser } from "@backend/auth/cookies";
import { getHealthRecord } from "@backend/services/health.service";
import { prisma } from "@backend/prisma";
import { HealthRecordClient } from "@/components/modules/health/HealthRecordClient";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const HEALTH_READ_ROLES = ["super_admin", "principal", "staff"];

export default async function Page({ params }: { params: { studentId: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!HEALTH_READ_ROLES.includes(user.role)) redirect("/dashboard");

  const [student, record] = await Promise.all([
    prisma.student.findUnique({
      where: { id: params.studentId },
      select: {
        firstName: true,
        lastName: true,
        class: { select: { name: true } },
      },
    }),
    getHealthRecord(params.studentId),
  ]);

  if (!student) notFound();

  return (
    <HealthRecordClient
      studentId={params.studentId}
      student={student}
      initialRecord={record}
    />
  );
}
