/**
 * Table — one file, one purpose.
 * Data table wrapper with head/body slots. Handles overflow scroll.
 * Design: PENDING — Stitch "Institutional Excellence" desktop component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./Table.module.css";

interface TableProps extends HTMLAttributes<HTMLElement> {
  /** caption?: string; stickyHeader?: boolean */
  children?: React.ReactNode;
}

export function Table({ children, className, ...props }: TableProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
