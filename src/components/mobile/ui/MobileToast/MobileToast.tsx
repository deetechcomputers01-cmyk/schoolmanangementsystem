/**
 * MobileToast — one file, one purpose.
 * Temporary feedback notification appearing at the bottom of the screen above the nav bar.
 * Design: PENDING — Stitch "Institutional Excellence" mobile component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./MobileToast.module.css";

interface MobileToastProps extends HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export function MobileToast({ children, className, ...props }: MobileToastProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
