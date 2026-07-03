"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export function TimetableSlotForm({
  classes,
  subjects
}: {
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string; class: { name: string } }[];
}) {
  const router = useRouter();

  async function submit(formData: FormData) {
    const response = await fetch("/api/timetable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classId: String(formData.get("classId")),
        subjectId: String(formData.get("subjectId")),
        day: String(formData.get("day")),
        startsAt: String(formData.get("startsAt")),
        endsAt: String(formData.get("endsAt")),
        room: String(formData.get("room"))
      })
    });
    if (response.ok) router.push("/timetable");
  }

  return (
    <form action={submit} className="grid gap-4 md:grid-cols-2">
      <Select label="Class" name="classId" required>
        <option value="">Select class</option>
        {classes.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
      </Select>
      <Select label="Subject" name="subjectId" required>
        <option value="">Select subject</option>
        {subjects.map((row) => <option key={row.id} value={row.id}>{row.name} - {row.class.name}</option>)}
      </Select>
      <Select label="Day" name="day" required>
        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => <option key={day} value={day}>{day}</option>)}
      </Select>
      <Input label="Room" name="room" placeholder="JHS Block A" required />
      <Input label="Starts at" name="startsAt" placeholder="08:00" required />
      <Input label="Ends at" name="endsAt" placeholder="09:00" required />
      <div className="md:col-span-2"><Button>Add period</Button></div>
    </form>
  );
}
