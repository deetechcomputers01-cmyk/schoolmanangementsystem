"use client";

import { DatabaseZap, RefreshCw } from "lucide-react";
import styles from "./DatabaseUnavailable.module.css";

export function DatabaseUnavailable() {
  return (
    <section className={styles.card} role="alert">
      <div className={styles.icon} aria-hidden>
        <DatabaseZap size={22} />
      </div>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Connection issue</p>
        <h2 className={styles.title}>Database connection unavailable</h2>
        <p className={styles.message}>
          ScholarSphere could not read the school data right now. Start PostgreSQL and try again; your account session is still safe.
        </p>
        <button type="button" className={styles.retry} onClick={() => window.location.reload()}>
          <RefreshCw size={15} />
          Try again
        </button>
      </div>
    </section>
  );
}
