import { Loader2 } from "lucide-react";
import styles from "./loading.module.css";

/**
 * Shared route-level loading UI for every page under (app) — Next.js
 * automatically wraps the layout's `children` slot in a Suspense boundary
 * keyed to this file, so navigating anywhere shows this instantly instead
 * of leaving the previous page frozen on screen with no feedback while the
 * next page's data fetches (most routes here are `force-dynamic`, so that
 * fetch is real, not instant). The sidebar/topbar/bottom-nav stay mounted
 * and interactive throughout — only the content area swaps.
 */
export default function Loading() {
  return (
    <div className={styles.root}>
      <Loader2 size={28} className={styles.spinner} />
    </div>
  );
}
