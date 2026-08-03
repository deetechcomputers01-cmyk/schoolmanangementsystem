"use client";

/**
 * Toast — the single shared notification surface for every desktop page.
 * Mounted once (see `AppProviders`), positioned top-center so feedback is
 * always in view. Screens call `useToast()` instead of keeping their own
 * local toast state/JSX.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import styles from "./Toast.module.css";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = nextId++;
    setItems((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), 3800);
  }, [dismiss]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.stack} aria-live="polite">
        {items.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div key={t.id} className={`${styles.toast} ${styles[t.type]}`} role="status">
              <Icon size={18} className={styles.icon} />
              <span className={styles.message}>{t.message}</span>
              <button className={styles.close} onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider (mounted in app/layout.tsx via AppProviders)");
  return ctx;
}
