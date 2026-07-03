/**
 * Button — one file, one purpose.
 * Primary action trigger. Variants: primary, secondary, ghost, danger, link. Sizes: sm, md, lg.
 * Design: PENDING — Stitch "Institutional Excellence" desktop component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./Button.module.css";

interface ButtonProps extends HTMLAttributes<HTMLElement> {
  /** variant?: "primary"|"secondary"|"ghost"|"danger"|"link"; size?: "sm"|"md"|"lg"; loading?: boolean; fullWidth?: boolean; leadingIcon?: React.ReactNode; trailingIcon?: React.ReactNode */
  children?: React.ReactNode;
}

export function Button({ children, className, ...props }: ButtonProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
