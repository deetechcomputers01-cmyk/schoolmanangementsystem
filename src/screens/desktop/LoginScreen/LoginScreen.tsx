/**
 * LoginScreen — desktop view for the Login page.
 * Rendered inside (auth)/layout.tsx which centres the card.
 */
import { LoginForm } from "@/components/LoginForm";
import styles from "./LoginScreen.module.css";

export function LoginScreen() {
  return (
    <section className={styles.root}>
      <p className="label-sm text-emerald">ScholarSphere Pro</p>
      <h1 className="font-heading mt-2 text-2xl font-semibold text-navy">Sign in to School MS</h1>
      <p className="mb-6 mt-2 text-sm text-muted">
        Manage students, fees, attendance, and learning records from one secure workspace.
      </p>
      <LoginForm />
    </section>
  );
}