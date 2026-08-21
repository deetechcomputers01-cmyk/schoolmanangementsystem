"use client";

import { useCallback, useMemo, useState } from "react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { DEFAULT_GRADING_SCALE } from "@backend/utils";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface GradeBand { grade: string; min: number; max: number; remark?: string }

export interface TermData { id: string; name: string; startDate: string; endDate: string; isCurrent: boolean }
export interface YearData { id: string; name: string; startDate: string; endDate: string; isCurrent: boolean; terms: TermData[] }

export interface SettingsData {
  name: string;
  address: string;
  motto: string;
  phone: string;
  email: string;
  logoUrl: string | null;
  letterheadUrl: string | null;
  reportFooter: string;
  timezone: string;
  extra: Record<string, unknown> | null;
  gradingScale: GradeBand[];
  updatedAt: string;
}

export type Form = {
  schoolName: string; gesCode: string; schoolType: string; motto: string;
  headteacher: string; region: string; district: string; postalAddress: string;
  phone: string; email: string; website: string;
  primaryColor: string; accentColor: string; reportFooter: string;
  letterheadMode: string;
  currency: string; latePaymentPenalty: string; gracePeriod: string;
  invoiceAutoSend: string;
  minAttendanceRate: string; alertThreshold: string; lateArrivalCutoff: string;
  minPasswordLength: string; sessionTimeout: string; passwordResetPolicy: string;
  feeReminders: boolean; attendanceAlerts: boolean;
  examResultNotifications: boolean; staffAnnouncements: boolean;
  syncInterval: string; cacheSizeMb: string; offlineModeEnabled: boolean;
  smsProvider: string; smsApiKey: string;
  paymentGateway: string; paymentApiKey: string;
};

export const GH_REGIONS = [
  "Greater Accra", "Ashanti", "Western", "Eastern", "Central",
  "Northern", "Upper East", "Upper West", "Volta", "Brong-Ahafo",
  "Oti", "Bono", "Bono East", "Ahafo", "Western North", "Savannah",
];

export const SCHOOL_TYPES = [
  "Public / Government", "Private / Independent", "Mission / Religious", "International",
];

/** "Reset Defaults" reverts every preference/config field to this — school
 *  identity (name, motto, address, phone, email, logo, GES code, region,
 *  district, website, headteacher) is deliberately excluded: there's no
 *  sensible "default" school name to fall back to, and resetting it would
 *  destroy real entered data instead of just undoing a preference change. */
const PREFERENCE_DEFAULTS = {
  primaryColor: "#5b50f5",
  accentColor: "#3b92e8",
  letterheadMode: "generated",
  currency: "GHS",
  latePaymentPenalty: "5",
  gracePeriod: "14",
  invoiceAutoSend: "start",
  minAttendanceRate: "75",
  alertThreshold: "60",
  lateArrivalCutoff: "15",
  minPasswordLength: "8",
  sessionTimeout: "60",
  passwordResetPolicy: "90",
  feeReminders: true,
  attendanceAlerts: true,
  examResultNotifications: true,
  staffAnnouncements: true,
  syncInterval: "5",
  cacheSizeMb: "50",
  offlineModeEnabled: true,
  smsProvider: "hubtel",
  smsApiKey: "",
  paymentGateway: "paystack",
  paymentApiKey: "",
} as const satisfies Partial<Form>;

function initForm(s: SettingsData): Form {
  const ex = s.extra ?? {};
  return {
    schoolName:    s.name,
    motto:         s.motto,
    postalAddress: s.address,
    phone:         s.phone,
    email:         s.email,
    reportFooter:  s.reportFooter,
    gesCode:      (ex.gesCode      as string) ?? "",
    schoolType:   (ex.schoolType   as string) ?? "Private / Independent",
    headteacher:  (ex.headteacher  as string) ?? "",
    region:       (ex.region       as string) ?? "Greater Accra",
    district:     (ex.district     as string) ?? "",
    website:      (ex.website      as string) ?? "",
    primaryColor: (ex.primaryColor as string) ?? "#5b50f5",
    accentColor:  (ex.accentColor  as string) ?? "#3b92e8",
    letterheadMode: (ex.letterheadMode as string) ?? "generated",
    currency:          (ex.currency         as string) ?? "GHS",
    latePaymentPenalty: String(ex.latePaymentPenalty ?? 5),
    gracePeriod:        String(ex.gracePeriod         ?? 14),
    invoiceAutoSend:   (ex.invoiceAutoSend  as string) ?? "start",
    minAttendanceRate: String(ex.minAttendanceRate ?? 75),
    alertThreshold:    String(ex.alertThreshold    ?? 60),
    lateArrivalCutoff: String(ex.lateArrivalCutoff ?? 15),
    minPasswordLength:   String(ex.minPasswordLength   ?? 8),
    sessionTimeout:      String(ex.sessionTimeout      ?? 60),
    passwordResetPolicy: (ex.passwordResetPolicy as string) ?? "90",
    feeReminders:            (ex.feeReminders            as boolean) ?? true,
    attendanceAlerts:        (ex.attendanceAlerts        as boolean) ?? true,
    examResultNotifications: (ex.examResultNotifications as boolean) ?? true,
    staffAnnouncements:      (ex.staffAnnouncements      as boolean) ?? true,
    syncInterval:      String(ex.syncInterval ?? 5),
    cacheSizeMb:       String(ex.cacheSizeMb  ?? 50),
    offlineModeEnabled: (ex.offlineModeEnabled as boolean) ?? true,
    smsProvider:    (ex.smsProvider    as string) ?? "hubtel",
    smsApiKey:      (ex.smsApiKey      as string) ?? "",
    paymentGateway: (ex.paymentGateway as string) ?? "paystack",
    paymentApiKey:  (ex.paymentApiKey  as string) ?? "",
  };
}

function buildPayload(form: Form, gradingScale: GradeBand[]) {
  return {
    gradingScale,
    name: form.schoolName, motto: form.motto, address: form.postalAddress,
    phone: form.phone, email: form.email, reportFooter: form.reportFooter,
    extra: {
      gesCode: form.gesCode, schoolType: form.schoolType,
      headteacher: form.headteacher, region: form.region,
      district: form.district, website: form.website,
      primaryColor: form.primaryColor, accentColor: form.accentColor,
      letterheadMode: form.letterheadMode,
      currency: form.currency,
      latePaymentPenalty: parseFloat(form.latePaymentPenalty) || 0,
      gracePeriod:        parseInt(form.gracePeriod)          || 0,
      invoiceAutoSend: form.invoiceAutoSend,
      minAttendanceRate: parseFloat(form.minAttendanceRate) || 0,
      alertThreshold:    parseFloat(form.alertThreshold)    || 0,
      lateArrivalCutoff: parseInt(form.lateArrivalCutoff)  || 0,
      minPasswordLength:   parseInt(form.minPasswordLength)  || 8,
      sessionTimeout:      parseInt(form.sessionTimeout)     || 60,
      passwordResetPolicy: form.passwordResetPolicy,
      feeReminders: form.feeReminders, attendanceAlerts: form.attendanceAlerts,
      examResultNotifications: form.examResultNotifications,
      staffAnnouncements: form.staffAnnouncements,
      syncInterval: parseInt(form.syncInterval) || 5,
      cacheSizeMb:  parseInt(form.cacheSizeMb)  || 50,
      offlineModeEnabled: form.offlineModeEnabled,
      smsProvider: form.smsProvider, smsApiKey: form.smsApiKey,
      paymentGateway: form.paymentGateway, paymentApiKey: form.paymentApiKey,
    },
  };
}

/** All real Settings state/logic (form, grading scale, logo/letterhead
 *  upload, save/reset) shared by both the desktop SettingsScreen and
 *  MobileSettingsContent, so the two platforms can never drift on what
 *  "Save" actually does. UI-only concerns (which section is open, the
 *  grading calculator's scratch input) stay local to each component. */
export function useSettingsForm(initialSettings: SettingsData) {
  const [form,           setForm]           = useState<Form>(() => initForm(initialSettings));
  const [savedForm,      setSavedForm]      = useState<Form>(() => initForm(initialSettings));
  const [gradingScale,      setGradingScale]      = useState<GradeBand[]>(initialSettings.gradingScale);
  const [savedGradingScale, setSavedGradingScale] = useState<GradeBand[]>(initialSettings.gradingScale);
  const [updatedAt,      setUpdatedAt]      = useState(initialSettings.updatedAt);
  const [saving,         setSaving]         = useState(false);
  const [resetting,      setResetting]      = useState(false);
  const [resettingDefaults, setResettingDefaults] = useState(false);
  const { showToast } = useToast();
  const [logoUrl, setLogoUrl] = useState(initialSettings.logoUrl);
  const [logoUploading, setLogoUploading] = useState(false);
  const [letterheadUrl, setLetterheadUrl] = useState(initialSettings.letterheadUrl);
  const [letterheadUploading, setLetterheadUploading] = useState(false);

  function set(field: keyof Form, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Editing a band's minimum score re-derives the band above it's floor, so the
  // scale can never end up with gaps or overlaps between grades.
  function setBandMin(index: number, newMin: number) {
    setGradingScale((scale) => {
      const sorted = [...scale].sort((a, b) => b.min - a.min);
      const clamped = Math.max(0, Math.min(100, newMin));
      sorted[index] = { ...sorted[index], min: clamped };
      return sorted.map((band, i) => ({
        ...band,
        max: i === 0 ? 100 : sorted[i - 1].min - 1,
      }));
    });
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(savedForm) || JSON.stringify(gradingScale) !== JSON.stringify(savedGradingScale);
  const sortedScale = useMemo(() => [...gradingScale].sort((a, b) => b.min - a.min), [gradingScale]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(form, gradingScale)),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? `Error ${res.status}`);
      }
      const saved = await res.json() as SettingsData & { extra: Record<string,unknown>; updatedAt: string };
      const next = initForm({ ...saved, extra: saved.extra ?? null, updatedAt: saved.updatedAt });
      setForm(next);
      setSavedForm(next);
      setGradingScale(saved.gradingScale);
      setSavedGradingScale(saved.gradingScale);
      setUpdatedAt(saved.updatedAt);
      showToast("Settings saved successfully.", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to save settings.", "error");
    } finally {
      setSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, gradingScale]);

  const handleReset = useCallback(async () => {
    setResetting(true);
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      const data = await res.json() as SettingsData & { extra: Record<string,unknown>; updatedAt: string };
      const fresh = initForm({ ...data, extra: data.extra ?? null, updatedAt: data.updatedAt });
      setForm(fresh);
      setSavedForm(fresh);
      setGradingScale(data.gradingScale);
      setSavedGradingScale(data.gradingScale);
      setUpdatedAt(data.updatedAt);
      showToast("Settings reset to last saved values.", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to reset.", "error");
    } finally {
      setResetting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Reset Defaults" — distinct from handleReset (which only discards
  // unsaved edits back to whatever was last *saved*, so it does nothing if
  // the unwanted value was already saved, e.g. a branding colour). This
  // actually restores the built-in defaults for preference/config fields
  // and persists immediately, same as clicking Save — school identity
  // fields are left exactly as last saved, see PREFERENCE_DEFAULTS above.
  const handleResetToDefaults = useCallback(async () => {
    setResettingDefaults(true);
    try {
      const nextForm: Form = { ...savedForm, ...PREFERENCE_DEFAULTS };
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(nextForm, DEFAULT_GRADING_SCALE)),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? `Error ${res.status}`);
      }
      const saved = await res.json() as SettingsData & { extra: Record<string,unknown>; updatedAt: string };
      const next = initForm({ ...saved, extra: saved.extra ?? null, updatedAt: saved.updatedAt });
      setForm(next);
      setSavedForm(next);
      setGradingScale(saved.gradingScale);
      setSavedGradingScale(saved.gradingScale);
      setUpdatedAt(saved.updatedAt);
      showToast("Preferences reset to defaults.", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to reset to defaults.", "error");
    } finally {
      setResettingDefaults(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedForm]);

  async function handleLogoFile(file: File) {
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/settings/logo", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => null) as { message?: string } | null;
        showToast(err?.message ?? "Failed to upload logo.", "error");
        return;
      }
      const saved = await res.json() as { logoUrl: string | null };
      setLogoUrl(saved.logoUrl);
      showToast("Logo updated.", "success");
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleLogoRemove() {
    setLogoUploading(true);
    try {
      const res = await fetch("/api/settings/logo", { method: "DELETE" });
      if (!res.ok) { showToast("Failed to remove logo.", "error"); return; }
      setLogoUrl(null);
      showToast("Logo removed.", "success");
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleLetterheadFile(file: File) {
    setLetterheadUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/settings/letterhead", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => null) as { message?: string } | null;
        showToast(err?.message ?? "Failed to upload letterhead.", "error");
        return;
      }
      const saved = await res.json() as { letterheadUrl: string | null };
      setLetterheadUrl(saved.letterheadUrl);
      set("letterheadMode", "custom");
      showToast("Letterhead uploaded.", "success");
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setLetterheadUploading(false);
    }
  }

  async function handleLetterheadRemove() {
    setLetterheadUploading(true);
    try {
      const res = await fetch("/api/settings/letterhead", { method: "DELETE" });
      if (!res.ok) { showToast("Failed to remove letterhead.", "error"); return; }
      setLetterheadUrl(null);
      set("letterheadMode", "generated");
      showToast("Custom letterhead removed.", "success");
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setLetterheadUploading(false);
    }
  }

  const formattedDate = (() => {
    try {
      return new Date(updatedAt).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return "—"; }
  })();

  return {
    form, savedForm, set, dirty, saving, resetting, handleSave, handleReset,
    resettingDefaults, handleResetToDefaults,
    gradingScale, setBandMin, sortedScale,
    updatedAt, formattedDate,
    logoUrl, logoUploading, handleLogoFile, handleLogoRemove,
    letterheadUrl, letterheadUploading, handleLetterheadFile, handleLetterheadRemove,
  };
}
