/**
 * EmptyState — one file, one purpose.
 * Full-area empty state for mobile lists. Icon, title, description, and optional CTA stacked vertically.
 * Design: PENDING — Stitch "Institutional Excellence" mobile component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./EmptyState.module.css";

interface EmptyStateProps extends HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export function EmptyState({ children, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
