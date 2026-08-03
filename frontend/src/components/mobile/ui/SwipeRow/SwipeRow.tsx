"use client";

/**
 * SwipeRow — wraps a card so it can be dragged horizontally to reveal action
 * icons pinned behind it. Drag left reveals `rightActions` (pinned to the
 * right edge); drag right reveals `leftActions` (pinned to the left edge).
 * A plain tap (no meaningful horizontal movement) passes through untouched,
 * so buttons inside `children` (e.g. a "more" menu) keep working normally.
 */

import { useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import styles from "./SwipeRow.module.css";

export interface SwipeAction {
  key: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  tone?: "primary" | "soft" | "danger";
}

interface SwipeRowProps {
  rightActions?: SwipeAction[];
  leftActions?: SwipeAction[];
  children: React.ReactNode;
}

const ACTION_WIDTH = 56;
const DRAG_THRESHOLD = 6;

export function SwipeRow({ rightActions = [], leftActions = [], children }: SwipeRowProps) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);
  const startOffset = useRef(0);
  const draggedRef = useRef(false);

  const rightW = rightActions.length * ACTION_WIDTH;
  const leftW = leftActions.length * ACTION_WIDTH;
  const hasActions = rightW > 0 || leftW > 0;

  function close() {
    setOffset(0);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!hasActions) return;
    startX.current = e.clientX;
    startOffset.current = offset;
    draggedRef.current = false;
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (startX.current === null) return;
    const delta = e.clientX - startX.current;
    if (!draggedRef.current && Math.abs(delta) > DRAG_THRESHOLD) {
      draggedRef.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    }
    if (!draggedRef.current) return;
    const next = Math.min(leftW, Math.max(-rightW, startOffset.current + delta));
    setOffset(next);
  }

  function onPointerUp() {
    setDragging(false);
    startX.current = null;
    if (!draggedRef.current) return;
    if (offset <= -rightW * 0.4 && rightW > 0) setOffset(-rightW);
    else if (offset >= leftW * 0.4 && leftW > 0) setOffset(leftW);
    else setOffset(0);
  }

  return (
    <div className={styles.wrap}>
      {rightActions.length > 0 && (
        <div className={styles.rightPanel} style={{ width: rightW }}>
          {rightActions.map((a) => (
            <button
              key={a.key}
              type="button"
              className={`${styles.actionBtn} ${styles[`tone_${a.tone ?? "primary"}`]}`}
              onClick={() => { a.onClick(); close(); }}
              aria-label={a.label}
            >
              <a.icon size={18} />
            </button>
          ))}
        </div>
      )}
      {leftActions.length > 0 && (
        <div className={styles.leftPanel} style={{ width: leftW }}>
          {leftActions.map((a) => (
            <button
              key={a.key}
              type="button"
              className={`${styles.actionBtn} ${styles[`tone_${a.tone ?? "soft"}`]}`}
              onClick={() => { a.onClick(); close(); }}
              aria-label={a.label}
            >
              <a.icon size={18} />
            </button>
          ))}
        </div>
      )}
      <div
        className={styles.content}
        style={{ transform: `translateX(${offset}px)`, transition: dragging ? "none" : "transform 0.2s ease-out" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {children}
      </div>
    </div>
  );
}
