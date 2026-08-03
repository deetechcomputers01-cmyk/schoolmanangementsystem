import type { Metadata } from "next";
import styles from "./auth-layout.module.css";

export const metadata: Metadata = { title: "ScholarSphere Pro | Authentication" };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.authShell}>{children}</div>;
}
