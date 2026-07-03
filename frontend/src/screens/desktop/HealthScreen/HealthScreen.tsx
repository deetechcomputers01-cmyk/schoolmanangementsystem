/**
 * HealthScreen — desktop view for Health Records.
 */
import Link from "next/link";
import { Heart, Activity } from "lucide-react";
import { listStudentsWithHealthRecords } from "@backend/services/health.service";
import styles from "./HealthScreen.module.css";

export const dynamic = "force-dynamic";

export async function HealthScreen() {
  const students = await listStudentsWithHealthRecords();
  return (
    <div className={styles.root}>
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
        <div className="flex items-center gap-3 border-b border-line px-6 py-4">
          <Heart size={18} className="text-rose-500" />
          <h2 className="font-heading text-lg font-semibold text-navy">Student Health Records</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted">
            <tr>
              <th className="px-5 py-3">Student</th><th className="px-5 py-3">Class</th>
              <th className="px-5 py-3">Blood Group</th><th className="px-5 py-3">Sick Visits</th>
              <th className="px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-semibold text-navy">{s.firstName} {s.lastName}</td>
                <td className="px-5 py-3 text-muted">{s.class.name}</td>
                <td className="px-5 py-3">
                  {s.healthRecord?.bloodGroup
                    ? <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600">{s.healthRecord.bloodGroup}</span>
                    : <span className="text-muted">—</span>}
                </td>
                <td className="px-5 py-3 text-muted">{s.healthRecord?._count?.visits ?? 0}</td>
                <td className="px-5 py-3">
                  <Link href={`/health/${s.id}`} className="text-xs font-semibold text-emerald hover:underline">View Records</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}