/**
 * (auth)/layout.tsx — layout for all unauthenticated pages.
 * No sidebar, no topbar. Renders children centred within the viewport.
 */
import type { Metadata } from "next";
import styles from "./auth-layout.module.css";

export const metadata: Metadata = { title: "ScholarSphere — Sign In" };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.authShell}>
      {children}
    </div>
  );
}
