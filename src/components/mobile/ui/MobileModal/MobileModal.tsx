/**
 * MobileModal — one file, one purpose.
 * Full-screen-height modal for complex forms or multi-step flows on mobile.
 * Design: PENDING — Stitch "Institutional Excellence" mobile component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./MobileModal.module.css";

interface MobileModalProps extends HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export function MobileModal({ children, className, ...props }: MobileModalProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
