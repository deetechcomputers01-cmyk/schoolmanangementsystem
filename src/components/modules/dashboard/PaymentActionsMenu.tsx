"use client";

import Link from "next/link";
import { Edit3, MoreVertical, ReceiptText, UserRound } from "lucide-react";
import { useState } from "react";

type PaymentActionsMenuProps = {
  studentId: string;
};

export function PaymentActionsMenu({ studentId }: PaymentActionsMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button className="text-muted hover:text-navy" aria-label="Payment actions" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((current) => !current)}>
        <MoreVertical size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-lg border border-line bg-white py-2 shadow-lg" role="menu">
          <Link className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-navy hover:bg-slate-100" href={`/students/${studentId}`} role="menuitem">
            <UserRound size={15} /> View Profile
          </Link>
          <Link className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-navy hover:bg-slate-100" href="/fees/payments" role="menuitem">
            <Edit3 size={15} /> Edit Payment
          </Link>
          <button className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-semibold text-emerald hover:bg-slate-100" onClick={() => window.print()} role="menuitem">
            <ReceiptText size={15} /> Send Receipt
          </button>
        </div>
      )}
    </div>
  );
}
