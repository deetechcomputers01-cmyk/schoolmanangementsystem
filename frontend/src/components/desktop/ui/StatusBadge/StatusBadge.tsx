/**
 * StatusBadge — one file, one purpose.
 * Semantic status chip for records: active, inactive, pending, suspended.
 * Design: PENDING — Stitch "Institutional Excellence" desktop component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./StatusBadge.module.css";

interface StatusBadgeProps extends HTMLAttributes<HTMLElement> {
  /** status: "active"|"inactive"|"pending"|"suspended"|"paid"|"overdue"|"present"|"absent" */
  children?: React.ReactNode;
}

export function StatusBadge({ children, className, ...props }: StatusBadgeProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
