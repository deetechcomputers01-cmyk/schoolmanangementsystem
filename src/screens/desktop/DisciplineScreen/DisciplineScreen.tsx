/**
 * DisciplineScreen — desktop view for Disciplinary Records.
 */
import { getCurrentUser } from "@/lib/auth/cookies";
import { listDisciplinaryRecords } from "@/lib/services/disciplinary.service";
import { DisciplinaryClient } from "@/components/modules/disciplinary/DisciplinaryClient";
import { requireRole } from "@/lib/auth/page-guard";
import { prisma } from "@/lib/prisma";
import styles from "./DisciplineScreen.module.css";

export const dynamic = "force-dynamic";

export async function DisciplineScreen() {
  await requireRole("super_admin", "principal", "teacher");
  const [user, records, students] = await Promise.all([
    getCurrentUser(),
    listDisciplinaryRecords(),
    prisma.student.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true, admissionNo: true, class: { select: { name: true } } },
    }),
  ]);
  const canCreate = user?.role === "super_admin" || user?.role === "principal" || user?.role === "teacher";
  const canDelete = user?.role === "super_admin" || user?.role === "principal";
  return (
    <div className={styles.root}>
      <DisciplinaryClient initialRecords={records} students={students} canCreate={canCreate} canDelete={canDelete} />
    </div>
  );
}