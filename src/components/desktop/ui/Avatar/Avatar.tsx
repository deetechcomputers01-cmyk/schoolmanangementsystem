/**
 * Avatar — one file, one purpose.
 * User avatar: initials or image, with size and status indicator.
 * Design: PENDING — Stitch "Institutional Excellence" desktop component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./Avatar.module.css";

interface AvatarProps extends HTMLAttributes<HTMLElement> {
  /** initials?: string; src?: string; size?: "xs"|"sm"|"md"|"lg"|"xl"; status?: "online"|"away"|"busy"|"offline"; alt?: string */
  children?: React.ReactNode;
}

export function Avatar({ children, className, ...props }: AvatarProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
