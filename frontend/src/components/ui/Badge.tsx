import { cn } from "@backend/utils";

const roleStyles: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700",
  principal:   "bg-navy/10 text-navy",
  teacher:     "bg-emerald/10 text-emerald",
  staff:       "bg-amber/10 text-amber",
  student:     "bg-sky-100 text-sky-700",
  guardian:    "bg-rose/10 text-rose",
  // legacy — kept for backwards compat during transition
  admin:       "bg-navy text-white",
  accountant:  "bg-amber/10 text-amber",
  parent:      "bg-rose/10 text-rose",
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
  const roleTone = roleName ? (roleStyles[roleName] ?? "bg-slate-100 text-navy") : "";

  return (
    <span
      className={cn(
        "font-heading inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize leading-none",
        roleTone || (tone === "neutral" && "bg-slate-100 text-navy"),
        !roleTone && tone === "success" && "bg-emerald/10 text-emerald",
        !roleTone && tone === "warning" && "bg-amber/10 text-amber",
        !roleTone && tone === "danger" && "bg-rose/10 text-rose"
      )}
    >
      {children}
    </span>
  );
}
