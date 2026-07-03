/**
 * MobileBadge — one file, one purpose.
 * Compact inline status label. Tones: neutral, success, warning, error, info. Optimised for small text.
 * Design: PENDING — Stitch "Institutional Excellence" mobile component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./MobileBadge.module.css";

interface MobileBadgeProps extends HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export function MobileBadge({ children, className, ...props }: MobileBadgeProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
