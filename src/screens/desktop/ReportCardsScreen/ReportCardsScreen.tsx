/**
 * ReportCardsScreen — desktop view for Report Cards.
 */
import Link from "next/link";
import { FileText, GraduationCap } from "lucide-react";
import { getCurrentAcademicContext } from "@/lib/services/academic.service";
import { prisma } from "@/lib/prisma";
import styles from "./ReportCardsScreen.module.css";

export const dynamic = "force-dynamic";

export async function ReportCardsScreen() {
  const [context, classes] = await Promise.all([
    getCurrentAcademicContext(),
    prisma.class.findMany({
      orderBy: { name: "asc" },
      include: {
        students: {
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          select: { id: true, firstName: true, lastName: true, admissionNo: true },
        },
      },
    }),
  ]);
  return (
    <div className={styles.root}>
      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-emerald/20 bg-emerald/5 px-5 py-4">
        <FileText size={20} className="text-emerald" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Showing for</p>
          <p className="font-heading font-semibold text-navy">
            {context.year?.name ?? "No active year"} · {context.term?.name ?? "No active term"}
          </p>
        </div>
      </div>
      <div className="grid gap-6">
        {classes.map((cls) => (
          <div key={cls.id} className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className="flex items-center gap-3 border-b border-line bg-slate-50 px-6 py-4">
              <GraduationCap size={18} className="text-navy" />
              <h2 className="font-heading font-semibold text-navy">{cls.name}</h2>
              <span className="ml-auto label-sm text-muted">{cls.students.length} students</span>
            </div>
            {cls.students.length === 0 ? (
              <p className="px-6 py-6 text-sm text-muted">No students in this class.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-white text-xs font-semibold text-muted">
                  <tr><th className="px-6 py-3">Student Name</th><th className="px-6 py-3">Admission No</th><th className="px-6 py-3 text-right">Report Card</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {cls.students.map((student) => (
                    <tr key={student.id} className="transition hover:bg-slate-50">
                      <td className="px-6 py-3 font-semibold text-navy">{student.firstName} {student.lastName}</td>
                      <td className="font-data px-6 py-3 text-muted">{student.admissionNo}</td>
                      <td className="px-6 py-3 text-right">
                        <Link href={`/report-cards/${student.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-navy transition hover:border-emerald hover:text-emerald">
                          <FileText size={13} /> View Report Card
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}