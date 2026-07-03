/**
 * StudentsScreen — desktop view for Student Management.
 */
import Link from "next/link";
import { Download, Filter, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StudentTable } from "@/components/modules/students/StudentTable";
import { listStudents } from "@/lib/services/student.service";
import { requireRole } from "@/lib/auth/page-guard";
import styles from "./StudentsScreen.module.css";

export const dynamic = "force-dynamic";

export async function StudentsScreen() {
  await requireRole("super_admin", "principal", "teacher", "staff");
  const students = await listStudents();
  return (
    <div className={styles.root}>
      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-heading text-[32px] font-semibold leading-10 text-navy">Student Management</h1>
          <p className="text-muted">Track admissions, guardians, classes, and learner records.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary"><Filter size={18} /> Filter</Button>
          <Button variant="secondary"><Download size={18} /> Export</Button>
          <Link href="/students/add"><Button><Plus size={18} /> Add Student</Button></Link>
        </div>
      </section>
      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <Metric label="Total Students" value={students.length.toString()} />
        <Metric label="Basic 6" value={students.filter((s) => s.class.name === "Basic 6").length.toString()} />
        <Metric label="JHS 1" value={students.filter((s) => s.class.name === "JHS 1").length.toString()} />
        <Metric label="Guardians Linked" value={students.reduce((sum, s) => sum + s.guardians.length, 0).toString()} />
      </section>
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm text-muted shadow-soft">
        <Search size={18} /> Search student name, admission number, class, guardian
      </div>
      <StudentTable students={students} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-soft">
      <p className="label-sm text-muted">{label}</p>
      <p className="font-data mt-1 text-2xl font-semibold text-navy">{value}</p>
    </div>
  );
}