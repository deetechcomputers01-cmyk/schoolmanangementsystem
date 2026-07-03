"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-soft transition hover:border-navy print:hidden"
    >
      <Printer size={16} /> Print Report Card
    </button>
  );
}
