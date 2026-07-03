"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export function GradeEntryRow({ students, subjects }: { students: { id: string; firstName: string; lastName: string }[]; subjects: { id: string; name: string }[] }) {
  const router = useRouter();

  async function submit(formData: FormData) {
    const response = await fetch("/api/grades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: String(formData.get("studentId")),
        subjectId: String(formData.get("subjectId")),
        term: String(formData.get("term")),
        score: Number(formData.get("score")),
        remarks: String(formData.get("remarks"))
      })
    });
    if (response.ok) router.refresh();
  }

  return (
    <form action={submit} className="grid gap-3 rounded-xl border border-line bg-white p-4 shadow-soft md:grid-cols-5">
      <Select name="studentId" label="Student">{students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}</Select>
      <Select name="subjectId" label="Subject">{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
      <Input name="term" label="Term" defaultValue="Term 1" />
      <Input name="score" label="Score" type="number" min="0" max="100" />
      <div className="self-end"><Button>Save score</Button></div>
    </form>
  );
}
