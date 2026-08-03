"use client";
import { useState } from "react";

const T = {
  bg:        "#ffffff",
  border:    "#c1c7cb",
  pContainer:"#244c5a",
  onPrimary: "#ffffff",
  onBg:      "#141d23",
  onSurface: "#141d23",
} as const;

export function MobileExportSheet() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed", bottom: 88, right: 20, zIndex: 45,
          width: 52, height: 52, borderRadius: "50%",
          background: T.pContainer, color: T.onPrimary,
          border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(7,53,67,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        aria-label="Export Report"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)", zIndex: 60 }} />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 70,
            background: T.bg, borderRadius: "24px 24px 0 0", padding: "20px 24px 48px",
            boxShadow: "0 -4px 32px rgba(7,53,67,0.15)",
          }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: T.border, margin: "0 auto 20px" }} />
            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: T.onBg, marginBottom: 20 }}>Export Report</h3>
            {[{ label: "Export as PDF", emoji: "📄" }, { label: "Export as Excel", emoji: "📊" }, { label: "Print Report", emoji: "🖨️" }].map(({ label, emoji }) => (
              <button key={label} onClick={() => setOpen(false)} style={{
                display: "flex", alignItems: "center", gap: 16, width: "100%",
                padding: "14px 16px", border: `1px solid ${T.border}`, borderRadius: 4,
                background: "transparent", cursor: "pointer", marginBottom: 12,
                fontSize: "var(--text-base)", fontWeight: 500, color: T.onSurface, textAlign: "left",
              }}>
                <span style={{ fontSize: "var(--text-2xl)" }}>{emoji}</span>
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
