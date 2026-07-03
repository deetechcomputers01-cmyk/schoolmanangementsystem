/**
 * MobileAvatar — one file, one purpose.
 * User avatar circle: initials or image. Sizes: xs, sm, md, lg. Optional status ring.
 * Design: PENDING — Stitch "Institutional Excellence" mobile component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./MobileAvatar.module.css";

interface MobileAvatarProps extends HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export function MobileAvatar({ children, className, ...props }: MobileAvatarProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
