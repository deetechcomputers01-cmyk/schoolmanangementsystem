import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = InputHTMLAttributes<HTMLInputElement> & { label?: string };

export function Input({ label, className, ...props }: Props) {
  return (
    <label className="grid gap-1.5">
      {label && <span className="label-sm text-muted">{label}</span>}
      <input className={cn("focus-ring h-10 rounded-md border border-line bg-white px-3 text-sm text-ink", className)} {...props} />
    </label>
  );
}
