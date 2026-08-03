import { cn } from "@backend/utils";

const roleStyles: Record<string, string> = {
  super_admin: "bg-navy/10 text-navy",
  principal:   "bg-navy/10 text-navy",
  teacher:     "bg-emerald/10 text-emerald",
  staff:       "bg-amber/10 text-amber",
  student:     "bg-navy/10 text-navy",
  guardian:    "bg-emerald/10 text-emerald",
  admin:       "bg-navy text-white",
  accountant:  "bg-amber/10 text-amber",
  parent:      "bg-emerald/10 text-emerald",
};

export function Badge({
  children,
  tone = "neutral",
  roleName
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
  roleName?: string;
}) {
  const roleTone = roleName ? (roleStyles[roleName] ?? "bg-shell text-navy") : "";

  return (
    <span
      className={cn(
        "inline-flex rounded px-2.5 py-1 text-[11px] font-semibold capitalize leading-none",
        roleTone || (tone === "neutral" && "bg-shell text-ink"),
        !roleTone && tone === "success" && "bg-emerald/10 text-emerald",
        !roleTone && tone === "warning" && "bg-amber/10 text-amber",
        !roleTone && tone === "danger"  && "bg-rose/10 text-rose"
      )}
    >
      {children}
    </span>
  );
}
