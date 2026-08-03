"use client";

import { useEffect } from "react";
import { DatabaseUnavailable } from "@/components/system/DatabaseUnavailable";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const databaseError = /can't reach database|connection refused|connect econnrefused|database server|P1001|P1017/i.test(error.message);
  if (databaseError) return <DatabaseUnavailable />;

  return (
    <main style={{ padding: 24, color: "#18181b" }}>
      <p style={{ margin: "0 0 8px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#5b50f5" }}>
        Something went wrong
      </p>
      <h2 style={{ margin: "0 0 8px", fontSize: "var(--text-2xl)" }}>This page could not load</h2>
      <p style={{ margin: "0 0 20px", color: "#71717a" }}>Try again, or return to the page after the issue is resolved.</p>
      <button type="button" onClick={reset} style={{ border: 0, borderRadius: 4, padding: "10px 14px", background: "#5b50f5", color: "white", cursor: "pointer" }}>
        Try again
      </button>
    </main>
  );
}
