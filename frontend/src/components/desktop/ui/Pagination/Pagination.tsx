/**
 * Pagination — one file, one purpose.
 * Page navigation: prev/next + page numbers. Controlled component.
 * Design: PENDING — Stitch "Institutional Excellence" desktop component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./Pagination.module.css";

interface PaginationProps extends HTMLAttributes<HTMLElement> {
  /** page: number; totalPages: number; onPageChange: (p:number)=>void; siblingCount?: number */
  children?: React.ReactNode;
}

export function Pagination({ children, className, ...props }: PaginationProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
