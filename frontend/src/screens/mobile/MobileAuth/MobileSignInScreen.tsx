"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MobileAuthShell } from "./MobileAuthShell";
import f from "./MobileAuthForm.module.css";

export function MobileSignInScreen({ schoolName = "ScholarSphere" }: { schoolName?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password"),
        rememberDevice: true,
      }),
    });

    setBusy(false);
    if (!res.ok) {
      setError("Invalid email or password provided.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <MobileAuthShell title="Sign In" schoolName={schoolName}>
      <form className={f.form} onSubmit={handleSubmit}>
        <div className={f.field}>
          <label className={f.label} htmlFor="ms-email">Email</label>
          <input
            id="ms-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="name@school.edu.gh"
            className={f.input}
          />
        </div>

        <div className={f.field}>
          <label className={f.label} htmlFor="ms-password">Password</label>
          <input
            id="ms-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className={f.input}
          />
        </div>

        {error && <p className={f.error}>{error}</p>}

        <div className={f.spacer} />

        <div className={f.buttonRow}>
          <button type="submit" disabled={busy} className={f.button}>
            {busy ? "Signing in…" : "Sign In"}
          </button>
          <Link href="/forgot-password" className={f.link}>Forgot Password</Link>
        </div>
      </form>
    </MobileAuthShell>
  );
}
