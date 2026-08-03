import type { InputHTMLAttributes } from "react";
import { cn } from "@backend/utils";

type Props = InputHTMLAttributes<HTMLInputElement> & { label?: string };

export function Input({ label, className, ...props }: Props) {
  return (
    <label className="grid gap-1.5">
      {label && <span className="text-xs font-semibold text-muted">{label}</span>}
      <input
        className={cn(
          "h-10 rounded border border-line bg-white px-3 text-sm text-ink outline-none",
          "focus:border-navy focus:ring-1 focus:ring-navy/20",
          className
        )}
        {...props}
      />
    </label>
  );
}
