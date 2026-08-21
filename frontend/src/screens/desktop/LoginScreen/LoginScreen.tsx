"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "../AuthShell/AuthShell";
import s from "../AuthShell/AuthShell.module.css";

export function LoginScreen({ schoolName = "ScholarSphere" }: { schoolName?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);

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
        rememberDevice,
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
    <AuthShell
      schoolName={schoolName}
      aside={(
        <>
          <div className={s.leftTop}>
            <div className={s.panelBrandRow}>
              <div className={s.brandIcon} aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 22h18M2 11h20M12 2L2 7h20L12 2zM5 11v7M9 11v7M15 11v7M19 11v7" />
                </svg>
              </div>
              <h1 className={s.panelBrandName}>{schoolName}</h1>
            </div>

            <h2 className={s.panelTitle}>Secure school operations for Ghanaian schools.</h2>
            <p className={s.panelSubtitle}>
              Institutional Security Protocol v4.2 active. Access restricted to authorized administration and faculty.
            </p>

            <div className={s.panelMeta}>
              <span className={s.panelPill}>Role-based access</span>
              <span className={s.panelPill}>Encrypted sessions</span>
              <span className={s.panelPill}>Built for Ghanaian schools</span>
            </div>
          </div>

          <div className={s.leftPhoto}>
            <img src="/students-hero.png" alt="" aria-hidden="true" />
            <div className={s.leftPhotoOverlay}>
              <div className={s.panelSupport}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Support Contact: ict-support@scholarsphere.edu.gh
              </div>

              <div className={s.panelCard}>
                <div className={s.panelCardTitle}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 22h18M2 11h20M12 2L2 7h20L12 2zM5 11v7M9 11v7M15 11v7M19 11v7" />
                  </svg>
                  Demo Accounts
                </div>
                <div className={s.panelList}>
                  <div className={s.panelListItem}><span className={s.panelRole}>Admin</span>admin@school.test</div>
                  <div className={s.panelListItem}><span className={s.panelRole}>Teacher</span>teacher@school.test</div>
                  <div className={s.panelListItem}><span className={s.panelRole}>Bursar</span>accountant@school.test</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      footerNote={error ? `Authentication failed: ${error}` : undefined}
    >
      <div className={s.screenCard}>
        <div className={s.screenHeader}>
          <span className={s.screenEyebrow}>Secure Login</span>
          <h2 className={s.screenTitle}>Please enter your credentials to proceed.</h2>
          <p className={s.screenSubtitle}>Institutional access is limited to authorized staff and faculty.</p>
        </div>

        {error && (
          <div className={s.alert} role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <strong style={{ display: "block", marginBottom: 4 }}>Authentication Failed</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form className={s.formGrid} onSubmit={handleSubmit}>
          <div className={s.field}>
            <label className={s.fieldLabel} htmlFor="ss-email">Institutional Email</label>
            <div className={s.fieldControl}>
              <span className={s.inputIcon} aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input
                id="ss-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@scholarsphere.edu.gh"
                className={`${s.input} ${s.inputWithIcon}`}
              />
            </div>
          </div>

          <div className={s.field}>
            <div className={s.row}>
              <label className={s.fieldLabel} htmlFor="ss-password">Password</label>
              <Link href="/forgot-password" className={s.link}>Forgot password?</Link>
            </div>
            <div className={s.fieldControl}>
              <span className={s.inputIcon} aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="ss-password"
                name="password"
                type={showPw ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className={`${s.input} ${s.inputWithIcon}`}
              />
              <button
                type="button"
                onClick={() => setShowPw((value) => !value)}
                className={s.toggleBtn}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className={s.row}>
            <label className={s.checkboxLabel}>
              <input
                type="checkbox"
                className={s.checkbox}
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
              />
              Remember this device
            </label>
            <span className={s.checkHint}>Keeps you signed in on this browser after it closes.</span>
          </div>

          <div className={s.buttonRow}>
            <button type="submit" disabled={busy} className={`${s.button} ${s.buttonPrimary}`}>
              {busy ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin">
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  Signing in…
                </>
              ) : "Login"}
            </button>
            <Link href="/forgot-password" className={`${s.button} ${s.buttonSecondary}`}>
              Need a reset link?
            </Link>
          </div>
        </form>
      </div>
    </AuthShell>
  );
}
