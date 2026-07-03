/**
 * Overlay — one file, one purpose.
 * Semi-transparent backdrop. Used behind Modal, Drawer, Sheet.
 * Design: PENDING — Stitch "Institutional Excellence" desktop component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./Overlay.module.css";

interface OverlayProps extends HTMLAttributes<HTMLElement> {
  /** visible: boolean; onClick?: ()=>void; zIndex?: number */
  children?: React.ReactNode;
}

export function Overlay({ children, className, ...props }: OverlayProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
