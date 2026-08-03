"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import styles from "./MobileSheet.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  subtitle?: string;
  headerExtra?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  canClose?: boolean;
  compact?: boolean;
};

/**
 * Shared mobile bottom-sheet chrome (drag handle, header, scrollable body,
 * sticky footer) — the same visual language established for the Student/
 * Staff profile sheets and the Fees "Record Payment" sheet. Screens whose
 * desktop modal is left untouched (per one-off `modalOverlay` CSS) render
 * this as their `.mobileOnly` counterpart, reusing the same state/handlers.
 */
export function MobileSheet({
  open, onClose, title, eyebrow, subtitle, headerExtra, footer, children, canClose = true, compact = false,
}: Props) {
  if (!open) return null;
  return (
    <div className={styles.backdrop} onClick={() => canClose && onClose()}>
      <div className={`${styles.sheet} ${compact ? styles.sheetCompact : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.dragHandle} aria-hidden />
        <div className={styles.header}>
          <div className={styles.headerText}>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            <h3 className={styles.title}>{title}</h3>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {headerExtra}
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close" disabled={!canClose}>
            <X size={20} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
