import type { ButtonHTMLAttributes } from "react";
import { cn } from "@backend/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ className, variant = "primary", ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary"   && "bg-navy text-white shadow-soft hover:bg-teal",
        variant === "secondary" && "border border-line bg-white text-navy hover:bg-shell",
        variant === "ghost"     && "text-navy hover:bg-shell",
        variant === "danger"    && "bg-rose text-white hover:opacity-90",
        className
      )}
      {...props}
    />
  );
}
