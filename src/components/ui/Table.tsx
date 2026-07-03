import { cn } from "@backend/utils";

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-soft">
      <table className={cn("min-w-full divide-y divide-line text-sm", className)}>{children}</table>
    </div>
  );
}
