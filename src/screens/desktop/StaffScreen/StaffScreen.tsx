/**
 * StaffScreen — desktop view for Staff Management.
 */
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { listStaff } from "@/lib/services/staff.service";
import { requireRole } from "@/lib/auth/page-guard";
import styles from "./StaffScreen.module.css";

export const dynamic = "force-dynamic";

export async function StaffScreen() {
  await requireRole("super_admin", "principal");
  const staff = await listStaff();
  return (
    <div className={styles.root}>
      <section className="mb-6 flex flex-col gap-1">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="label-sm text-emerald">Human Resources</p>
            <h1 className="font-heading text-[32px] font-semibold leading-10 text-navy">Staff Management</h1>
            <p className="text-muted">Teacher assignments, contacts, and staff records.</p>
          </div>
          <Link href="/staff/new"><Button><Plus size={18} /> New Staff</Button></Link>
        </div>
      </section>
      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <Metric label="Total Staff" value={staff.length.toString()} />
        <Metric label="Teachers" value={staff.filter((s) => s.roleTitle.toLowerCase().includes("teacher")).length.toString()} />
        <Metric label="Subjects Assigned" value={staff.reduce((sum, s) => sum + s.subjects.length, 0).toString()} />
      </section>
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm text-muted shadow-soft">
        <Search size={18} /> Search staff name, phone, subject, staff number
      </div>
      <Table>
        <thead className="label-sm bg-slate-100 text-left text-muted">
          <tr>
            <th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4">Phone</th>
            <th className="p-4">Subjects</th><th className="p-4">Status</th><th className="p-4">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {staff.map((member) => (
            <tr key={member.id} className="hover:bg-slate-50">
              <td className="p-4 font-semibold text-navy">{member.firstName} {member.lastName}</td>
              <td className="p-4 text-muted">{member.roleTitle}</td>
              <td className="p-4 text-muted">{member.phone ?? "—"}</td>
              <td className="p-4 text-muted">{member.subjects.map((sub) => sub.name).join(", ") || "—"}</td>
              <td className="p-4"><Badge tone="success">Active</Badge></td>
              <td className="p-4">
                <Link href={`/staff/${member.id}`} className="text-xs font-semibold text-emerald hover:underline">View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
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