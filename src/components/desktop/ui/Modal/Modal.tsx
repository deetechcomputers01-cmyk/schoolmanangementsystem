/**
 * Modal — one file, one purpose.
 * Accessible dialog overlay. Manages focus trap and scroll lock.
 * Design: PENDING — Stitch "Institutional Excellence" desktop component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./Modal.module.css";

interface ModalProps extends HTMLAttributes<HTMLElement> {
  /** open: boolean; onClose: ()=>void; title?: string; description?: string; size?: "sm"|"md"|"lg"|"xl"; footer?: React.ReactNode */
  children?: React.ReactNode;
}

export function Modal({ children, className, ...props }: ModalProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
