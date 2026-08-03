"use client";

import { useContext, useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { RouteModalWidthContext } from "@/components/desktop/ui/RouteModal/RouteModal";
import styles from "./DesktopFormModal.module.css";

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  width?: number;
  canClose?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** Render without the fixed backdrop/overlay — used when this content already sits
   *  inside another modal's chrome (e.g. a RouteModal panel), so only one overlay ever shows. */
  inline?: boolean;
};

export function DesktopFormModal({
  open,
  title,
  subtitle,
  eyebrow,
  width = 720,
  canClose = true,
  onClose,
  children,
  footer,
  inline = false,
}: Props) {
  const setRouteModalWidth = useContext(RouteModalWidthContext);

  // When inline (swapped in place inside a RouteModal panel), tell the panel
  // to shrink to this content's width instead of sitting at its full max
  // width with the form floating narrow inside a much wider empty box.
  useEffect(() => {
    if (!inline || !setRouteModalWidth || !open) return;
    setRouteModalWidth(width + 48); // + panelBody's 24px horizontal padding on each side
    return () => setRouteModalWidth(null);
  }, [inline, open, width, setRouteModalWidth]);

  if (!open) return null;

  const dialog = (
    <div
      className={inline ? styles.dialogInline : styles.dialog}
      style={{ ["--modal-width" as string]: `${width}px` }}
      onClick={inline ? undefined : (event) => event.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {!inline && <div className={styles.dragHandle} aria-hidden />}
      <div className={styles.header}>
        <div className={styles.heading}>
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          <h2 className={styles.title}>{title}</h2>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
        {!inline && (
          <button className={styles.closeButton} onClick={() => { if (canClose) onClose(); }} aria-label="Close modal" disabled={!canClose}>
            <X size={18} />
          </button>
        )}
      </div>
      <div className={inline ? styles.bodyInline : styles.body}>{children}</div>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </div>
  );

  if (inline) return <div className={styles.inlineWrap}>{dialog}</div>;

  return (
    <div className={styles.overlay} onClick={() => { if (canClose) onClose(); }}>
      {dialog}
    </div>
  );
}
