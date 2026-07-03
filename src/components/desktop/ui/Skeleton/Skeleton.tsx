/**
 * Skeleton — one file, one purpose.
 * Content placeholder shown while data loads. Variants: text, circle, rect.
 * Design: PENDING — Stitch "Institutional Excellence" desktop component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./Skeleton.module.css";

interface SkeletonProps extends HTMLAttributes<HTMLElement> {
  /** variant?: "text"|"circle"|"rect"; width?: string|number; height?: string|number; lines?: number */
  children?: React.ReactNode;
}

export function Skeleton({ children, className, ...props }: SkeletonProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
