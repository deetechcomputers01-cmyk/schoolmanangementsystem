import { cn } from "@backend/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("rounded-xl border border-line bg-white p-5 shadow-soft md:p-6", className)}>{children}</section>;
}
