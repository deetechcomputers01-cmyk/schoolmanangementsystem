"use client";

/**
 * SettingsFormContext — shares one `useSettingsForm()` instance across the
 * mobile Settings list page and its per-section pages (real routes now, not
 * sheet modals), so editing Fees then navigating to Attendance without
 * saving keeps the dirty state and the pending edits intact. The provider
 * lives in the `/settings` route layout, which Next.js keeps mounted while
 * navigating between `/settings` and `/settings/<section>`.
 */

import { createContext, useContext, type ReactNode } from "react";
import type { FeeStructureRow } from "@/screens/desktop/FeesScreen/FeeStructurePanel";
import {
  useSettingsForm,
  type SettingsData,
  type YearData,
} from "@/screens/desktop/SettingsScreen/useSettingsForm";

type SettingsFormValue = ReturnType<typeof useSettingsForm> & {
  academicYears: YearData[];
  classes: { id: string; name: string }[];
  feeStructureRows: FeeStructureRow[];
};

const SettingsFormContext = createContext<SettingsFormValue | null>(null);

export function SettingsFormProvider({ initialSettings, academicYears, classes, feeStructureRows, children }: {
  initialSettings: SettingsData;
  academicYears: YearData[];
  classes: { id: string; name: string }[];
  feeStructureRows: FeeStructureRow[];
  children: ReactNode;
}) {
  const form = useSettingsForm(initialSettings);
  return (
    <SettingsFormContext.Provider value={{ ...form, academicYears, classes, feeStructureRows }}>
      {children}
    </SettingsFormContext.Provider>
  );
}

export function useSettingsFormContext() {
  const ctx = useContext(SettingsFormContext);
  if (!ctx) throw new Error("useSettingsFormContext must be used within SettingsFormProvider");
  return ctx;
}
