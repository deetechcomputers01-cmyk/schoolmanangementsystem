import { Table } from "@/components/ui/Table";

type Grade = { id: string; term: string; score: number; remarks: string | null; student: { firstName: string; lastName: string }; subject: { name: string } };

export function GradeReport({ grades }: { grades: Grade[] }) {
  return (
    <Table>
      <thead className="label-sm bg-slate-100 text-left text-muted">
        <tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Term</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Remarks</th></tr>
      </thead>
      <tbody className="divide-y divide-line">
        {grades.map((grade) => (
          <tr key={grade.id}><td className="px-4 py-3 font-medium">{grade.student.firstName} {grade.student.lastName}</td><td className="px-4 py-3">{grade.subject.name}</td><td className="px-4 py-3">{grade.term}</td><td className="px-4 py-3">{grade.score}</td><td className="px-4 py-3">{grade.remarks ?? "-"}</td></tr>
        ))}
      </tbody>
    </Table>
  );
}
