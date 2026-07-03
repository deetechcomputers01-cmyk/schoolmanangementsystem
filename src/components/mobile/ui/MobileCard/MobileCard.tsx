/**
 * MobileCard — one file, one purpose.
 * Content block with optional tap state and swipe-to-reveal action affordance.
 * Design: PENDING — Stitch "Institutional Excellence" mobile component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./MobileCard.module.css";

interface MobileCardProps extends HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export function MobileCard({ children, className, ...props }: MobileCardProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
