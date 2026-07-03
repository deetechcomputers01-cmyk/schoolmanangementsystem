/**
 * GradebookReportsScreen — desktop view for Grade Reports.
 */
import { GradeReport } from "@/components/modules/gradebook/GradeReport";
import { listGrades } from "@/lib/services/grade.service";
import styles from "./GradebookReportsScreen.module.css";

export const dynamic = "force-dynamic";

export async function GradebookReportsScreen() {
  const grades = await listGrades();
  return (
    <div className={styles.root}>
      <section className="mb-6">
        <p className="label-sm text-emerald">Assessment</p>
        <h1 className="font-heading text-[32px] font-semibold leading-10 text-navy">Grade Reports</h1>
      </section>
      <GradeReport grades={grades} />
    </div>
  );
}