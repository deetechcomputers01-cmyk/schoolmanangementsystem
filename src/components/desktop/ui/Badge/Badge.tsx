/**
 * Badge — one file, one purpose.
 * Inline status label. Tones: neutral, success, warning, error, info, primary.
 * Design: PENDING — Stitch "Institutional Excellence" desktop component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./Badge.module.css";

interface BadgeProps extends HTMLAttributes<HTMLElement> {
  /** tone?: "neutral"|"success"|"warning"|"error"|"info"|"primary"; size?: "sm"|"md"; dot?: boolean */
  children?: React.ReactNode;
}

export function Badge({ children, className, ...props }: BadgeProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
