"use client";

import dynamic from "next/dynamic";

export const VehicleMapLoader = dynamic(() => import("./VehicleMap").then((m) => m.VehicleMap), {
  ssr: false,
  loading: () => <div style={{ height: 360, display: "flex", alignItems: "center", justifyContent: "center", color: "#71787b", fontSize: "var(--text-xs)", background: "#f9f9f7", borderRadius: 8 }}>Loading map…</div>,
});
