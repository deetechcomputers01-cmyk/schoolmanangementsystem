import type { ButtonHTMLAttributes } from "react";
import { cn } from "@backend/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ className, variant = "primary", ...props }: Props) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-navy text-white shadow-emerald hover:bg-slate-900",
        variant === "secondary" && "border border-line bg-white text-navy hover:bg-slate-50",
        variant === "ghost" && "text-emerald hover:bg-emerald/10",
        variant === "danger" && "bg-rose text-white hover:bg-rose/90",
        className
      )}
      {...props}
    />
  );
}
