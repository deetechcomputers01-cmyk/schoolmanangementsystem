"use client";

import { createContext, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X } from "lucide-react";
import styles from "./RouteModal.module.css";

/**
 * Lets content rendered inside this modal (specifically DesktopFormModal's
 * `inline` mode) tell the panel how wide it wants to be. Without this, the
 * panel always sits at its max width even when the content inside (an Edit
 * form, Add Guardian) is much narrower, leaving a "stretched" empty-looking
 * box. `null` = no preference, panel uses its default max width.
 */
export const RouteModalWidthContext = createContext<((width: number | null) => void) | null>(null);

export function RouteModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // Next.js keeps a parallel route slot's last-rendered tree mounted when you
  // navigate to a sibling route that doesn't match it (e.g. clicking a link
  // inside this modal that goes to /fees). Track the path we opened on and
  // stop rendering the instant the pathname diverges, so this modal can't be
  // left stacked behind whatever the new page renders.
  const openedForPath = useRef(pathname);
  const [contentWidth, setContentWidth] = useState<number | null>(null);

  function close() {
    router.back();
  }

  const stale = pathname !== openedForPath.current;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The @modal slot can stay mounted (just re-rendered) rather than unmounted
  // when navigating away, so restore body scroll ourselves once stale.
  useEffect(() => {
    if (stale) document.body.style.overflow = "";
  }, [stale]);

  if (stale) return null;

  return (
    <div className={styles.overlay} onClick={close}>
      <div
        className={styles.panel}
        style={contentWidth ? { width: `min(${contentWidth}px, min(1080px, 100%))` } : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <button className={styles.closeBtn} onClick={close} type="button" aria-label="Close">
          <X size={20} />
        </button>
        <div className={styles.panelBody}>
          <RouteModalWidthContext.Provider value={setContentWidth}>
            {children}
          </RouteModalWidthContext.Provider>
        </div>
      </div>
    </div>
  );
}
