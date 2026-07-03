/**
 * MobileInput — one file, one purpose.
 * Touch-optimised text input with label, error, and icon slots. 48px height for tap accuracy.
 * Design: PENDING — Stitch "Institutional Excellence" mobile component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./MobileInput.module.css";

interface MobileInputProps extends HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export function MobileInput({ children, className, ...props }: MobileInputProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
