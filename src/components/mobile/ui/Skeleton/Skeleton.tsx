/**
 * Skeleton — one file, one purpose.
 * Content placeholder skeleton. Variants: text, circle, rect. Matches mobile card/list shapes.
 * Design: PENDING — Stitch "Institutional Excellence" mobile component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./Skeleton.module.css";

interface SkeletonProps extends HTMLAttributes<HTMLElement> {
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
