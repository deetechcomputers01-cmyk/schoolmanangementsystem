/**
 * Checkbox — one file, one purpose.
 * Labelled checkbox with indeterminate state support.
 * Design: PENDING — Stitch "Institutional Excellence" desktop component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./Checkbox.module.css";

interface CheckboxProps extends HTMLAttributes<HTMLElement> {
  /** label?: string; helperText?: string; error?: string; indeterminate?: boolean */
  children?: React.ReactNode;
}

export function Checkbox({ children, className, ...props }: CheckboxProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
