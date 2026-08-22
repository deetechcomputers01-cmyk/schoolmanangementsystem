"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MobileAuthShell } from "./MobileAuthShell";
import f from "./MobileAuthForm.module.css";

export function MobileForgotPasswordScreen({ schoolName = "ScholarSphere" }: { schoolName?: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const res = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Something went wrong. Please try again.");
      return;
    }

    router.push(`/enter-otp?phone=${encodeURIComponent(phone)}`);
  }

  return (
    <MobileAuthShell title="Forgot Password" schoolName={schoolName}>
      <form className={f.form} onSubmit={handleSubmit}>
        <div className={f.field}>
          <label className={f.label} htmlFor="ms-phone">Phone Number</label>
          <div className={f.phoneRow}>
            <span className={f.phoneCode}>+233</span>
            <input
              id="ms-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              required
              autoComplete="tel"
              placeholder="0244123456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={f.input}
            />
          </div>
        </div>

        {error && <p className={f.error}>{error}</p>}

        <div className={f.spacer} />

        <div className={f.buttonRow}>
          <button type="submit" disabled={busy} className={f.button}>
            {busy ? "Sending…" : "Generate OTP"}
          </button>
          <Link href="/login" className={f.link}>Cancel</Link>
        </div>
      </form>
    </MobileAuthShell>
  );
}
