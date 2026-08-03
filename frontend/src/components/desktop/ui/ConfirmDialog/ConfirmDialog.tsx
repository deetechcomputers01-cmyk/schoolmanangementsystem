"use client";

/**
 * ConfirmDialog — the single shared confirmation surface for every desktop
 * page, replacing native `window.confirm(...)` popups with an in-app styled
 * dialog. Mounted once (see `AppProviders`). Screens call `useConfirm()`:
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm("Delete this record?"))) return;
 *   if (!(await confirm({ message: "...", tone: "danger" }))) return;
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import styles from "./ConfirmDialog.module.css";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" red-styles the confirm button for destructive actions (delete/remove/revoke/unblock). */
  tone?: "default" | "danger";
}

type PendingConfirm = ConfirmOptions & { resolve: (value: boolean) => void };

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    const opts = typeof options === "string" ? { message: options } : options;
    return new Promise<boolean>((resolve) => {
      setPending({ ...opts, resolve });
    });
  }, []);

  function settle(result: boolean) {
    pending?.resolve(result);
    setPending(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div className={styles.overlay} onClick={() => settle(false)}>
          <div
            className={styles.dialog}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-label={pending.title ?? "Confirm action"}
          >
            <div className={`${styles.iconWrap} ${pending.tone === "danger" ? styles.iconWrapDanger : ""}`}>
              {pending.tone === "danger" ? <AlertTriangle size={20} /> : <HelpCircle size={20} />}
            </div>
            <div className={styles.body}>
              {pending.title && <h3 className={styles.title}>{pending.title}</h3>}
              <p className={styles.message}>{pending.message}</p>
            </div>
            <div className={styles.actions}>
              <button className={styles.cancelBtn} onClick={() => settle(false)} autoFocus>
                {pending.cancelLabel ?? "Cancel"}
              </button>
              <button
                className={`${styles.confirmBtn} ${pending.tone === "danger" ? styles.confirmBtnDanger : ""}`}
                onClick={() => settle(true)}
              >
                {pending.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider (mounted in app/layout.tsx via AppProviders)");
  return ctx;
}
