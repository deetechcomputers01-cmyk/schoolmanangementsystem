/**
 * LoadingState — one file, one purpose.
 * Full-area loading spinner with optional label. For async data loads.
 * Design: PENDING — Stitch "Institutional Excellence" desktop component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./LoadingState.module.css";

interface LoadingStateProps extends HTMLAttributes<HTMLElement> {
  /** label?: string; size?: "sm"|"md"|"lg" */
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
