"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function StaffForm() {
  const router = useRouter();

  async function submit(formData: FormData) {
    const response = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staffNo: String(formData.get("staffNo")),
        firstName: String(formData.get("firstName")),
        lastName: String(formData.get("lastName")),
        phone: String(formData.get("phone")),
        roleTitle: String(formData.get("roleTitle")),
        email: String(formData.get("email") || "")
      })
    });
    if (response.ok) router.push("/staff");
  }

  return (
    <form action={submit} className="grid gap-4 rounded-xl border border-line bg-white p-5 shadow-soft md:grid-cols-2">
      <Input name="staffNo" label="Staff number" required />
      <Input name="roleTitle" label="Role title" required />
      <Input name="firstName" label="First name" required />
      <Input name="lastName" label="Last name" required />
      <Input name="phone" label="Phone" required />
      <Input name="email" label="Email" type="email" />
      <div className="md:col-span-2"><Button>Save staff</Button></div>
    </form>
  );
}
