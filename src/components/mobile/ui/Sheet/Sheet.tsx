/**
 * Sheet — one file, one purpose.
 * Bottom sheet drawer. Animates up from bottom. Supports snap points and drag-to-dismiss.
 * Design: PENDING — Stitch "Institutional Excellence" mobile component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./Sheet.module.css";

interface SheetProps extends HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export function Sheet({ children, className, ...props }: SheetProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
