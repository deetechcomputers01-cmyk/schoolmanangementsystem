"use client";

import { cn } from "@backend/utils";

export function Toast({ message, tone = "success" }: { message: string; tone?: "success" | "error" }) {
  return (
    <div className={cn("fixed bottom-5 right-5 rounded-md px-4 py-3 text-sm font-semibold shadow-lift", tone === "success" ? "bg-emerald text-white" : "bg-rose text-white")}>
      {message}
    </div>
  );
}
