"use client";

import Link from "next/link";
import { CheckCircle2, Download, FileSpreadsheet, FileText, Printer, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function DashboardActionBar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-3">
      <Link href="/students/new">
        <Button className="transition hover:scale-105 active:scale-95">
          <UserPlus size={18} /> Add Student
        </Button>
      </Link>
      <Link href="/attendance">
        <Button className="bg-emerald transition hover:scale-105 hover:bg-emerald/90 active:scale-95">
          <CheckCircle2 size={18} /> Mark Attendance
        </Button>
      </Link>
      <div className="relative">
        <Button variant="secondary" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-haspopup="menu">
          <Download size={18} /> Export Report
        </Button>
        {open && (
          <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-lg border border-line bg-white py-2 shadow-lg" role="menu">
            <Link className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-navy hover:bg-slate-100" href="/reports" role="menuitem">
              <FileText size={16} /> Export as PDF
            </Link>
            <Link className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-navy hover:bg-slate-100" href="/reports" role="menuitem">
              <FileSpreadsheet size={16} /> Export as Excel
            </Link>
            <button className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-navy hover:bg-slate-100" onClick={() => window.print()} role="menuitem">
              <Printer size={16} /> Print Summary
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
