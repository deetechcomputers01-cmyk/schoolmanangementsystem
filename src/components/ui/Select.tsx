import type { SelectHTMLAttributes } from "react";
import { cn } from "@backend/utils";

type Props = SelectHTMLAttributes<HTMLSelectElement> & { label?: string };

export function Select({ label, className, children, ...props }: Props) {
  return (
    <label className="grid gap-1.5">
      {label && <span className="label-sm text-muted">{label}</span>}
      <select className={cn("focus-ring h-10 rounded-md border border-line bg-white px-3 text-sm text-ink", className)} {...props}>
        {children}
      </select>
    </label>
  );
}
