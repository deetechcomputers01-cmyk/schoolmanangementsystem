/**
 * Dropdown — one file, one purpose.
 * Contextual action menu anchored to a trigger element.
 * Design: PENDING — Stitch "Institutional Excellence" desktop component spec.
 */

import type { HTMLAttributes } from "react";
import styles from "./Dropdown.module.css";

interface DropdownProps extends HTMLAttributes<HTMLElement> {
  /** trigger: React.ReactNode; items: Array<{label:string;icon?:React.ReactNode;onClick:()=>void;destructive?:boolean;disabled?:boolean}>; align?: "left"|"right" */
  children?: React.ReactNode;
}

export function Dropdown({ children, className, ...props }: DropdownProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
