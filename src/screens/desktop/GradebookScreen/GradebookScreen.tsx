/**
 * GradebookScreen — desktop view for Gradebook.
 */
import Link from "next/link";
import { FileText } from "lucide-react";
import { GradeEntryRow } from "@/components/modules/gradebook/GradeEntryRow";
import { GradeReport } from "@/components/modules/gradebook/GradeReport";
import { Button } from "@/components/ui/Button";
import { getSubjects } from "@/lib/services/dashboard.service";
import { listGrades } from "@/lib/services/grade.service";
import { listStudents } from "@/lib/services/student.service";
import { requireRole } from "@/lib/auth/page-guard";
import styles from "./GradebookScreen.module.css";

export const dynamic = "force-dynamic";

export async function GradebookScreen() {
  await requireRole("super_admin", "principal", "teacher");
  const [students, subjects, grades] = await Promise.all([listStudents(), getSubjects(), listGrades()]);
  return (
    <div className={styles.root}>
      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="label-sm text-emerald">Assessment</p>
          <h1 className="font-heading text-[32px] font-semibold leading-10 text-navy">Gradebook</h1>
          <p className="text-muted">Enter scores and review academic performance by subject.</p>
        </div>
        <Link href="/gradebook/reports"><Button variant="secondary"><FileText size={18} /> Reports</Button></Link>
      </section>
      <div className="grid gap-6">
        <GradeEntryRow students={students} subjects={subjects} />
        <GradeReport grades={grades} />
      </div>
    </div>
  );
}