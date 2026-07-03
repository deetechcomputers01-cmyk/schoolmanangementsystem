export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-4 text-sm text-muted shadow-soft">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald border-t-transparent" />
      {label}
    </div>
  );
}
