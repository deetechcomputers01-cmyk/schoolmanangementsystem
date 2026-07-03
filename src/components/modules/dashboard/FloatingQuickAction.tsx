"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

export function FloatingQuickAction() {
  return (
    <Link
      href="/students/new"
      className="group fixed bottom-8 right-8 z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-emerald text-white shadow-emerald transition hover:scale-110 active:scale-95 md:flex"
      aria-label="Quick action"
    >
      <Plus size={28} />
      <span className="pointer-events-none absolute right-full mr-4 whitespace-nowrap rounded-lg bg-navy px-4 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        Quick Action
      </span>
    </Link>
  );
}
