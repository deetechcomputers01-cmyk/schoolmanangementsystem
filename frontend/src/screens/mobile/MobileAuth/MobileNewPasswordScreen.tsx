"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MobileAuthShell } from "./MobileAuthShell";
import f from "./MobileAuthForm.module.css";

export function MobileNewPasswordScreen({ schoolName = "ScholarSphere" }: { schoolName?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const fd = new FormData(e.currentTarget);
    const newPassword = String(fd.get("newPassword") ?? "");
    const confirmPassword = String(fd.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    const res = await fetch("/api/auth/otp/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });
    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Something went wrong. Please try again.");
      return;
    }

    router.push("/login");
  }

  return (
    <MobileAuthShell title="Forgot Password" schoolName={schoolName}>
      <form className={f.form} onSubmit={handleSubmit}>
        <div className={f.field}>
          <label className={f.label} htmlFor="ms-new-password">Create New Password</label>
          <input
            id="ms-new-password"
            name="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="••••••••"
            className={f.input}
          />
        </div>

        <div className={f.field}>
          <label className={f.label} htmlFor="ms-confirm-password">Confirm New Password</label>
          <input
            id="ms-confirm-password"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="••••••••"
            className={f.input}
          />
        </div>

        {error && <p className={f.error}>{error}</p>}

        <div className={f.spacer} />

        <div className={f.buttonRow}>
          <button type="submit" disabled={busy} className={f.button}>
            {busy ? "Submitting…" : "Submit"}
          </button>
          <Link href="/login" className={f.link}>Cancel</Link>
        </div>
      </form>
    </MobileAuthShell>
  );
}
