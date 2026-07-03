/**
 * EmptyState — one file, one purpose.
 * Placeholder for empty lists/search/filtered views with optional CTA.
 * Design: PENDING — Stitch "Institutional Excellence" desktop component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./EmptyState.module.css";

interface EmptyStateProps extends HTMLAttributes<HTMLElement> {
  /** icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode */
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
