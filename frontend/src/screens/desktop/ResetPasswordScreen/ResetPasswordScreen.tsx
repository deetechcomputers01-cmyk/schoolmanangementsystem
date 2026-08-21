"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "../AuthShell/AuthShell";
import s from "../AuthShell/AuthShell.module.css";

export function ResetPasswordScreen({ schoolName = "ScholarSphere" }: { schoolName?: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    await new Promise((r) => setTimeout(r, 1000));
    setBusy(false);
    setSent(true);
  }

  return (
    <AuthShell
      schoolName={schoolName}
      aside={(
        <>
          <div className={s.panelBrandRow}>
            <div className={s.brandIcon} aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 22h18M2 11h20M12 2L2 7h20L12 2zM5 11v7M9 11v7M15 11v7M19 11v7" />
              </svg>
            </div>
            <h1 className={s.panelBrandName}>{schoolName}</h1>
          </div>

          <div>
            <h2 className={s.panelTitle}>Secure account recovery for school staff.</h2>
            <p className={s.panelSubtitle}>
              Submit your institutional email and a secure, time-limited reset link will be dispatched to you.
            </p>
          </div>

          <div>
            <div className={s.panelSupport}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Support: ict-support@scholarsphere.edu.gh
            </div>
          </div>
        </>
      )}
      footerNote={sent ? "Reset link prepared for delivery." : undefined}
    >
      <div className={s.screenCard}>
        {sent ? (
          <div className={s.success}>
            <div className={s.successMark} aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className={s.successTitle}>Check your email</h3>
            <p className={s.successBody}>
              If <strong>{email}</strong> is registered, a reset link has been sent. Check your inbox and spam folder.
            </p>
            <Link href="/login" className={`${s.button} ${s.buttonPrimary}`}>Return to login</Link>
          </div>
        ) : (
          <>
            <div className={s.screenHeader}>
              <Link href="/login" className={s.link} style={{ display: "flex", width: "fit-content", alignItems: "center", gap: 6, marginBottom: 16 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back to login
              </Link>
              <span className={s.screenEyebrow}>Reset Password</span>
              <h2 className={s.screenTitle}>Enter your institutional email to receive a secure reset link.</h2>
              <p className={s.screenSubtitle}>The link is time-limited and will be sent to your registered inbox.</p>
            </div>

            <form className={s.formGrid} onSubmit={handleSubmit}>
              <div className={s.field}>
                <label className={s.fieldLabel} htmlFor="ss-reset-email">Institutional Email</label>
                <div className={s.fieldControl}>
                  <span className={s.inputIcon} aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <input
                    id="ss-reset-email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="name@scholarsphere.edu.gh"
                    className={`${s.input} ${s.inputWithIcon}`}
                  />
                </div>
              </div>

              <div className={s.buttonRow}>
                <button type="submit" disabled={busy} className={`${s.button} ${s.buttonPrimary}`}>
                  {busy ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin">
                        <path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                      Sending…
                    </>
                  ) : "Send reset link"}
                </button>
                <Link href="/login" className={`${s.button} ${s.buttonSecondary}`}>Return to login</Link>
              </div>
            </form>
          </>
        )}
      </div>
    </AuthShell>
  );
}
