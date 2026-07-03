/**
 * TapButton — one file, one purpose.
 * Full-width touch-friendly button. Variants: primary, secondary, ghost, danger. Minimum 48px height.
 * Design: PENDING — Stitch "Institutional Excellence" mobile component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./TapButton.module.css";

interface TapButtonProps extends HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export function TapButton({ children, className, ...props }: TapButtonProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
