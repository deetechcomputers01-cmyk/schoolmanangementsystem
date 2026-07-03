import { FileSearch } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-line bg-white p-10 text-center shadow-soft">
      <FileSearch className="mb-3 text-muted" />
      <h3 className="font-heading font-semibold text-navy">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
    </div>
  );
}
