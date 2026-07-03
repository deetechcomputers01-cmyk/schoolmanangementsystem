import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";

type Student = {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  gender: string;
  class: { name: string };
  guardians: { name: string; phone: string }[];
};

export function StudentTable({ students }: { students: Student[] }) {
  return (
    <Table>
      <thead className="label-sm bg-slate-100 text-left text-muted">
        <tr>
          <th className="px-4 py-3">Student</th>
          <th className="px-4 py-3">Admission</th>
          <th className="px-4 py-3">Class</th>
          <th className="px-4 py-3">Guardian</th>
          <th className="px-4 py-3">Gender</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {students.map((student) => (
          <tr key={student.id} className="hover:bg-shell">
            <td className="px-4 py-2.5 font-semibold text-navy">
              <Link className="flex items-center gap-3" href={`/students/${student.id}`}>
                <span
                  className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-navy bg-cover bg-center text-[10px] font-bold text-white"
                  style={student.photoUrl ? { backgroundImage: `url(${student.photoUrl})` } : undefined}
                >
                  {!student.photoUrl && `${student.firstName[0]}${student.lastName[0]}`}
                </span>
                <span>{student.firstName} {student.lastName}</span>
              </Link>
            </td>
            <td className="font-data px-4 py-2.5 text-muted">{student.admissionNo}</td>
            <td className="px-4 py-2.5"><Badge>{student.class.name}</Badge></td>
            <td className="px-4 py-2.5 text-muted">{student.guardians[0]?.name ?? "Not assigned"}</td>
            <td className="px-4 py-2.5 text-muted">{student.gender}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
