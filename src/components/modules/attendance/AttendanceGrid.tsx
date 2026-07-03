"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useOfflineSync } from "@/hooks/useOfflineSync";

type Student = { id: string; firstName: string; lastName: string; classId: string };

export function AttendanceGrid({ students, classId }: { students: Student[]; classId: string }) {
  const { enqueue } = useOfflineSync();
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  async function submit(formData: FormData) {
    const records = students.map((student) => ({
      studentId: student.id,
      status: String(formData.get(student.id)) as "present" | "absent" | "late" | "excused"
    }));
    await enqueue("/api/attendance", { classId, date, records });
    router.refresh();
  }

  return (
    <form action={submit} className="rounded-xl border border-line bg-white p-4 shadow-soft">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <label className="grid gap-1.5">
          <span className="label-sm text-muted">Date</span>
          <input className="focus-ring h-10 rounded-md border border-line px-3" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <Button>Save attendance</Button>
      </div>
      <div className="grid gap-3">
        {students.map((student) => (
          <div key={student.id} className="grid gap-2 rounded-lg border border-line p-3 sm:grid-cols-[1fr_180px] sm:items-center">
            <span className="font-heading font-semibold text-navy">{student.firstName} {student.lastName}</span>
            <Select name={student.id} aria-label={`${student.firstName} status`}>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </Select>
          </div>
        ))}
      </div>
    </form>
  );
}
