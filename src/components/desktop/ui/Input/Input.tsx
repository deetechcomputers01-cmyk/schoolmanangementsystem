/**
 * Input — one file, one purpose.
 * Text input field with label, helper text, error and leading/trailing slots.
 * Design: PENDING — Stitch "Institutional Excellence" desktop component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./Input.module.css";

interface InputProps extends HTMLAttributes<HTMLElement> {
  /** label?: string; helperText?: string; error?: string; leadingIcon?: React.ReactNode; trailingSlot?: React.ReactNode; size?: "sm"|"md" */
  children?: React.ReactNode;
}

export function Input({ children, className, ...props }: InputProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
