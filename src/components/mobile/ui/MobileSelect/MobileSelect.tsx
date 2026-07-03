/**
 * MobileSelect — one file, one purpose.
 * Native-feeling dropdown select with custom chevron. Optimised for mobile keyboard avoidance.
 * Design: PENDING — Stitch "Institutional Excellence" mobile component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./MobileSelect.module.css";

interface MobileSelectProps extends HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export function MobileSelect({ children, className, ...props }: MobileSelectProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
