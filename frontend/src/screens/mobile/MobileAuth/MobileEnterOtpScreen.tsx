"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MobileAuthShell } from "./MobileAuthShell";
import f from "./MobileAuthForm.module.css";

const OTP_LENGTH = 5;

export function MobileEnterOtpScreen({ schoolName = "ScholarSphere" }: { schoolName?: string }) {
  const router = useRouter();
  const phone = useSearchParams().get("phone") ?? "";
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function updateDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });
    if (clean && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== OTP_LENGTH) {
      setError("Enter the full code.");
      return;
    }
    setBusy(true);
    setError("");

    const res = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });

    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Invalid or expired code.");
      return;
    }

    router.push("/new-password");
  }

  async function handleResend() {
    setResending(true);
    setError("");
    await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    setResending(false);
    setDigits(Array(OTP_LENGTH).fill(""));
    inputs.current[0]?.focus();
  }

  return (
    <MobileAuthShell title="Forgot Password" schoolName={schoolName}>
      <form className={f.form} onSubmit={handleVerify}>
        <div className={f.field}>
          <label className={f.label}>Enter OTP</label>
          <div className={f.otpRow}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => updateDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={f.otpBox}
              />
            ))}
          </div>
          <button type="button" onClick={handleResend} disabled={resending} className={f.link}>
            {resending ? "Sending…" : "Send Again"}
          </button>
        </div>

        {error && <p className={f.error}>{error}</p>}

        <div className={f.spacer} />

        <div className={f.buttonRow}>
          <button type="submit" disabled={busy} className={f.button}>
            {busy ? "Verifying…" : "Verify"}
          </button>
          <Link href="/login" className={f.link}>Cancel</Link>
        </div>
      </form>
    </MobileAuthShell>
  );
}
