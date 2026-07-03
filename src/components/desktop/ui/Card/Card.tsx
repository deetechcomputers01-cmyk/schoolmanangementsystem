/**
 * Card — one file, one purpose.
 * Content container with optional header, footer, padding variants and shadow.
 * Design: PENDING — Stitch "Institutional Excellence" desktop component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./Card.module.css";

interface CardProps extends HTMLAttributes<HTMLElement> {
  /** padding?: "none"|"sm"|"md"|"lg"; shadow?: "none"|"sm"|"md"; header?: React.ReactNode; footer?: React.ReactNode */
  children?: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
