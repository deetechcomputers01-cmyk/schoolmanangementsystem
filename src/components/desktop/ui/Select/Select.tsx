/**
 * Select — one file, one purpose.
 * Dropdown select with label and error state.
 * Design: PENDING — Stitch "Institutional Excellence" desktop component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./Select.module.css";

interface SelectProps extends HTMLAttributes<HTMLElement> {
  /** label?: string; options: Array<{value:string;label:string}>; error?: string; placeholder?: string */
  children?: React.ReactNode;
}

export function Select({ children, className, ...props }: SelectProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
