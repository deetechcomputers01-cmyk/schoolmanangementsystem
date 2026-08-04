"use client";

import { ReportCardBody, type ReportCardData } from "./ReportCardBody";
import { ReportCardModalContent } from "./ReportCardModalContent";

/** Plain full-page fallback — reached on hard refresh / deep link / bookmark,
 *  cases an intercepted-route modal can't cover. Renders the exact same
 *  on-screen design as the modal (ReportCardModalContent) so navigating here
 *  directly never shows a different, older-looking page. The actual printed
 *  output (window.print()) still uses ReportCardBody, the formal document
 *  layout, kept hidden on-screen and shown only via the print media query. */
export function StudentReportCardClient(props: ReportCardData) {
  return (
    <div style={{ padding: "24px", background: "#ffffff", minHeight: "100%" }}>
      <div className="no-print">
        <ReportCardModalContent {...props} backHref="/report-cards" />
      </div>
      <div className="print-only">
        <ReportCardBody {...props} />
      </div>

      <style>{`
        .print-only { display: none; }
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
          .report-card { border: none !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
