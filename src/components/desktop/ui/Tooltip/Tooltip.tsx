/**
 * Tooltip — one file, one purpose.
 * Accessible tooltip shown on hover/focus. Positions: top, right, bottom, left.
 * Design: PENDING — Stitch "Institutional Excellence" desktop component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./Tooltip.module.css";

interface TooltipProps extends HTMLAttributes<HTMLElement> {
  /** content: React.ReactNode; position?: "top"|"right"|"bottom"|"left"; delay?: number */
  children?: React.ReactNode;
}

export function Tooltip({ children, className, ...props }: TooltipProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
