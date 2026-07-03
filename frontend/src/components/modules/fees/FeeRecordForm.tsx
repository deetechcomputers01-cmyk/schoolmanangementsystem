"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export function FeeRecordForm({ students }: { students: { id: string; firstName: string; lastName: string; class: { name: string } }[] }) {
  const router = useRouter();

  async function submit(formData: FormData) {
    const response = await fetch("/api/fees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: String(formData.get("studentId")),
        term: String(formData.get("term")),
        description: String(formData.get("description")),
        amountDue: Number(formData.get("amountDue"))
      })
    });
    if (response.ok) router.refresh();
  }

  return (
    <form action={submit} className="grid gap-4 rounded-xl border border-line bg-white p-5 shadow-soft md:grid-cols-4">
      <Select name="studentId" label="Student" required>
        <option value="">Select student</option>
        {students.map((student) => (
          <option key={student.id} value={student.id}>{student.firstName} {student.lastName} - {student.class.name}</option>
        ))}
      </Select>
      <Input name="term" label="Term" defaultValue="Term 1" required />
      <Input name="description" label="Description" defaultValue="Tuition and PTA levy" required />
      <Input name="amountDue" label="Amount due" type="number" min="1" required />
      <div className="md:col-span-4"><Button>Create invoice</Button></div>
    </form>
  );
}
