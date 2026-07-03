/**
 * Toast — one file, one purpose.
 * Temporary feedback notification. Types: success, warning, error, info.
 * Design: PENDING — Stitch "Institutional Excellence" desktop component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./Toast.module.css";

interface ToastProps extends HTMLAttributes<HTMLElement> {
  /** type?: "success"|"warning"|"error"|"info"; title: string; description?: string; duration?: number; onDismiss?: ()=>void */
  children?: React.ReactNode;
}

export function Toast({ children, className, ...props }: ToastProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
