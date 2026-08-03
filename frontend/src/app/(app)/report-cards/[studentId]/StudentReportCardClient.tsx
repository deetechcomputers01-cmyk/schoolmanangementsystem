"use client";

import Link from "next/link";
import { Printer, Download, ArrowLeft } from "lucide-react";
import { ReportCardBody, type ReportCardData } from "./ReportCardBody";

export function StudentReportCardClient(props: ReportCardData) {
  const { studentName, admissionNo, className } = props;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "#ffffff" }}>
      {/* Page header — hidden when printing */}
      <div className="no-print" style={{ background: "transparent", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "#486647", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Academic</p>
          <h1 style={{ margin: "3px 0 0", fontSize: "var(--text-xl)", fontWeight: 700, color: "#141d23" }}>Report Card — {studentName}</h1>
          <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "#41484b" }}>{admissionNo} · {className}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/report-cards" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 4, border: "1px solid #c1c7cb", fontSize: "var(--text-xs)", fontWeight: 500, color: "#073543", textDecoration: "none", background: "#fff" }}>
            <ArrowLeft size={14} /> All Classes
          </Link>
          <button onClick={() => window.print()} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 4, border: "1px solid #c1c7cb", fontSize: "var(--text-xs)", fontWeight: 600, color: "#073543", background: "#fff", cursor: "pointer" }}>
            <Printer size={14} /> Print
          </button>
          <button onClick={() => window.print()} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 4, background: "#073543", border: "none", fontSize: "var(--text-xs)", fontWeight: 600, color: "#fff", cursor: "pointer" }}>
            <Download size={14} /> Save as PDF
          </button>
        </div>
      </div>

      {/* Report card */}
      <div style={{ flex: 1, padding: "24px" }}>
        <ReportCardBody {...props} />
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .report-card { border: none !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
