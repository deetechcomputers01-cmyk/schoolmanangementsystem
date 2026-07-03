/**
 * LoadingState — one file, one purpose.
 * Centered spinner + label for async data loads on mobile views.
 * Design: PENDING — Stitch "Institutional Excellence" mobile component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./LoadingState.module.css";

interface LoadingStateProps extends HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export function LoadingState({ children, className, ...props }: LoadingStateProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
