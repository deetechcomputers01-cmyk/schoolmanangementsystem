"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(formData: FormData) {
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.get("email"), password: formData.get("password") })
    });
    setBusy(false);
    if (!response.ok) {
      setError("Invalid email or password");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <form action={submit} className="grid gap-4">
      <Input name="email" label="Email" type="email" defaultValue="superadmin@scholarsphere.edu.gh" required />
      <Input name="password" label="Password" type="password" defaultValue="Password123!" required />
      {error && <p className="rounded-md bg-rose/10 px-3 py-2 text-sm font-medium text-rose">{error}</p>}
      <Button type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}
