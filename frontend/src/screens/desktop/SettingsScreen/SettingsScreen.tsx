"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
  School, CalendarDays, Palette, CreditCard, ClipboardList,
  BookOpen, ShieldCheck, Bell, Wifi, Puzzle, Save, RotateCcw,
  FileText, Upload, ChevronDown, AlertTriangle, Eye, X,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { YearsTermsPanel } from "@/screens/desktop/AcademicCalendarScreen/YearsTermsPanel";
import styles from "./SettingsScreen.module.css";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface GradeBand { grade: string; min: number; max: number; remark?: string }

interface TermData { id: string; name: string; startDate: string; endDate: string; isCurrent: boolean }
interface YearData { id: string; name: string; startDate: string; endDate: string; isCurrent: boolean; terms: TermData[] }

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

type Form = {
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

// ── Constants ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "profile",       label: "School Profile",    Icon: School },
  { id: "academic",      label: "Academic Calendar", Icon: CalendarDays },
  { id: "branding",      label: "Branding",          Icon: Palette },
  { id: "fees",          label: "Fees",              Icon: CreditCard },
  { id: "attendance",    label: "Attendance",        Icon: ClipboardList },
  { id: "gradebook",     label: "Gradebook",         Icon: BookOpen },
  { id: "security",      label: "Users & Security",  Icon: ShieldCheck },
  { id: "notifications", label: "Notifications",     Icon: Bell },
  { id: "offline",       label: "Offline & Sync",    Icon: Wifi },
  { id: "integrations",  label: "Integrations",      Icon: Puzzle },
];

const GH_REGIONS = [
  "Greater Accra", "Ashanti", "Western", "Eastern", "Central",
  "Northern", "Upper East", "Upper West", "Volta", "Brong-Ahafo",
  "Oti", "Bono", "Bono East", "Ahafo", "Western North", "Savannah",
];

const SCHOOL_TYPES = [
  "Public / Government", "Private / Independent", "Mission / Religious", "International",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Component ─────────────────────────────────────────────────────────────────
export function SettingsScreen({ initialSettings, academicYears }: { initialSettings: SettingsData; academicYears: YearData[] }) {
  const [activeSection,  setActiveSection]  = useState("profile");
  const [form,           setForm]           = useState<Form>(() => initForm(initialSettings));
  const [savedForm,      setSavedForm]      = useState<Form>(() => initForm(initialSettings));
  const [gradingScale,      setGradingScale]      = useState<GradeBand[]>(initialSettings.gradingScale);
  const [savedGradingScale, setSavedGradingScale] = useState<GradeBand[]>(initialSettings.gradingScale);
  const [updatedAt,      setUpdatedAt]      = useState(initialSettings.updatedAt);
  const [saving,         setSaving]         = useState(false);
  const [resetting,      setResetting]      = useState(false);
  const { showToast } = useToast();
  const [showLetterhead, setShowLetterhead] = useState(false);
  const [calcScore, setCalcScore] = useState("78");
  const [logoUrl, setLogoUrl] = useState(initialSettings.logoUrl);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

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

  const [letterheadUrl, setLetterheadUrl] = useState(initialSettings.letterheadUrl);
  const [letterheadUploading, setLetterheadUploading] = useState(false);
  const letterheadInputRef = useRef<HTMLInputElement>(null);

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

  const dirty = JSON.stringify(form) !== JSON.stringify(savedForm) || JSON.stringify(gradingScale) !== JSON.stringify(savedGradingScale);

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

  function set(field: keyof Form, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

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
  }, []);

  const formattedDate = (() => {
    try {
      return new Date(updatedAt).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return "—"; }
  })();

  // Real computation over the actual grading scale — not decorative.
  const sortedScale = useMemo(() => [...gradingScale].sort((a, b) => b.min - a.min), [gradingScale]);
  const calcBand = useMemo(() => {
    const n = Math.max(0, Math.min(100, parseInt(calcScore) || 0));
    return sortedScale.find((b) => n >= b.min) ?? sortedScale[sortedScale.length - 1] ?? null;
  }, [calcScore, sortedScale]);

  return (
    <div className={styles.root}>

      {/* ── Unsaved banner ── */}
      {dirty && (
        <div className={styles.unsavedBanner}>
          <AlertTriangle size={16} className={styles.bannerIcon} />
          <span>You have unsaved changes.</span>
          <div className={styles.bannerActions}>
            <button className={styles.bannerDiscard} onClick={handleReset} disabled={resetting}>Discard</button>
            <button className={styles.bannerSave} onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Now"}
            </button>
          </div>
        </div>
      )}

      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <p className={styles.breadcrumb}>
            <span>Administration</span><span className={styles.sep}>›</span><span>Settings</span>
          </p>
          <h1 className={styles.pageTitle}>Settings &amp; School Profile</h1>
          <p className={styles.pageSubtitle}>Configure institutional identity and system-wide preferences.</p>
        </div>
        <div className={styles.pageHeaderActions}>
          <button className={styles.btnGhost} onClick={handleReset} disabled={resetting}>
            <RotateCcw size={15} /> {resetting ? "Resetting…" : "Reset Defaults"}
          </button>
          <button className={styles.btnOutline} onClick={() => setShowLetterhead(true)}>
            <Eye size={15} /> Preview Letterhead
          </button>
          <button className={styles.btnPrimary} onClick={handleSave} disabled={saving || !dirty}>
            <Save size={15} /> {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className={styles.body}>

        {/* Left nav */}
        <nav className={styles.leftNav} aria-label="Settings sections">
          <p className={styles.navGroupLabel}>CONFIGURATION</p>
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`${styles.navItem} ${activeSection === id ? styles.navItemActive : ""}`}
              onClick={() => setActiveSection(id)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        {/* Center form */}
        <div className={styles.formArea}>

          {/* ── SCHOOL PROFILE ── */}
          {activeSection === "profile" && <>
            <div className={styles.crestCard}>
              <div className={styles.crestPreview}>
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="School crest" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <School size={40} style={{ color: "var(--clr-app-border)" }} />
                )}
              </div>
              <div className={styles.crestInfo}>
                <h3 className={styles.crestTitle}>School Crest</h3>
                <p className={styles.crestDesc}>
                  Upload a high-resolution crest or logo. This will appear on letterheads, reports,
                  and the main application header. (PNG, JPG, WEBP, or SVG, max 2MB).
                </p>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoFile(f); e.target.value = ""; }}
                />
                <div className={styles.crestBtns}>
                  <button className={styles.btnOutline} onClick={() => logoInputRef.current?.click()} disabled={logoUploading}>
                    <Upload size={14} /> {logoUploading ? "Uploading…" : logoUrl ? "Replace Logo" : "Upload Logo"}
                  </button>
                  {logoUrl && (
                    <button className={styles.btnDanger} onClick={handleLogoRemove} disabled={logoUploading}>Remove</button>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.crestCard}>
              <div className={styles.crestPreview}>
                {form.letterheadMode === "custom" && letterheadUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={letterheadUrl} alt="Custom letterhead" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <FileText size={40} style={{ color: "var(--clr-app-border)" }} />
                )}
              </div>
              <div className={styles.crestInfo}>
                <h3 className={styles.crestTitle}>Letterhead</h3>
                <p className={styles.crestDesc}>
                  Use the auto-generated letterhead (built live from your school name, motto, colors, and
                  contact details above) or upload your own pre-designed letterhead image. Either way, the
                  date, signature, and footer still render live from Settings on top of it.
                </p>
                <div className={styles.crestBtns} style={{ marginBottom: 10 }}>
                  <button
                    className={form.letterheadMode === "generated" ? styles.btnPrimary : styles.btnOutline}
                    onClick={() => set("letterheadMode", "generated")}
                  >
                    Auto-generated
                  </button>
                  <button
                    className={form.letterheadMode === "custom" ? styles.btnPrimary : styles.btnOutline}
                    onClick={() => set("letterheadMode", letterheadUrl ? "custom" : "generated")}
                    disabled={!letterheadUrl}
                    title={letterheadUrl ? undefined : "Upload a custom letterhead image first"}
                  >
                    Custom Upload
                  </button>
                </div>
                <input
                  ref={letterheadInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLetterheadFile(f); e.target.value = ""; }}
                />
                <div className={styles.crestBtns}>
                  <button className={styles.btnOutline} onClick={() => letterheadInputRef.current?.click()} disabled={letterheadUploading}>
                    <Upload size={14} /> {letterheadUploading ? "Uploading…" : letterheadUrl ? "Replace Custom Letterhead" : "Upload Custom Letterhead"}
                  </button>
                  {letterheadUrl && (
                    <button className={styles.btnDanger} onClick={handleLetterheadRemove} disabled={letterheadUploading}>Remove</button>
                  )}
                </div>
              </div>
            </div>

            <section className={styles.formSection}>
              <h2 className={styles.sectionTitle}><School size={15} /> Basic Information</h2>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>School Name</label>
                <input className={styles.input} value={form.schoolName}
                  onChange={(e) => set("schoolName", e.target.value)} />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>GES Code</label>
                  <input className={styles.input} value={form.gesCode}
                    onChange={(e) => set("gesCode", e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>School Type</label>
                  <div className={styles.selectWrap}>
                    <select className={styles.select} value={form.schoolType}
                      onChange={(e) => set("schoolType", e.target.value)}>
                      {SCHOOL_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <ChevronDown size={14} className={styles.selectChevron} />
                  </div>
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Motto</label>
                <input className={styles.input} value={form.motto}
                  onChange={(e) => set("motto", e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Headteacher / Principal Name</label>
                <input className={styles.input} value={form.headteacher}
                  onChange={(e) => set("headteacher", e.target.value)} />
              </div>
            </section>

            <section className={styles.formSection}>
              <h2 className={styles.sectionTitle}><FileText size={15} /> Contact &amp; Location</h2>
              <div className={styles.fieldRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Region</label>
                  <div className={styles.selectWrap}>
                    <select className={styles.select} value={form.region}
                      onChange={(e) => set("region", e.target.value)}>
                      {GH_REGIONS.map((r) => <option key={r}>{r}</option>)}
                    </select>
                    <ChevronDown size={14} className={styles.selectChevron} />
                  </div>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>District</label>
                  <input className={styles.input} value={form.district}
                    onChange={(e) => set("district", e.target.value)} />
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Postal Address</label>
                <input className={styles.input} value={form.postalAddress}
                  onChange={(e) => set("postalAddress", e.target.value)} />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Phone Number</label>
                  <input className={styles.input} value={form.phone}
                    onChange={(e) => set("phone", e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Email Address</label>
                  <input className={styles.input} type="email" value={form.email}
                    onChange={(e) => set("email", e.target.value)} />
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Website</label>
                <input className={styles.input} value={form.website}
                  onChange={(e) => set("website", e.target.value)} />
              </div>
            </section>
          </>}

          {/* ── ACADEMIC CALENDAR ── */}
          {activeSection === "academic" && (
            <section className={styles.formSection} style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "24px 24px 0" }}>
                <h2 className={styles.sectionTitle} style={{ border: "none", paddingBottom: 0, marginBottom: 0 }}>
                  <CalendarDays size={15} /> Academic Calendar
                </h2>
                <p className={styles.sectionHint} style={{ margin: "6px 0 0" }}>
                  Manage academic years and terms — supports any number of terms (2 semesters, 3 terms, or otherwise).
                  This is the same data the Timetable and Report Cards use, so a change here applies everywhere immediately.
                </p>
              </div>
              <div style={{ padding: 24 }}>
                <YearsTermsPanel years={academicYears} />
              </div>
            </section>
          )}

          {/* ── BRANDING ── */}
          {activeSection === "branding" && (
            <section className={styles.formSection}>
              <h2 className={styles.sectionTitle}><Palette size={15} /> Branding</h2>
              <p className={styles.sectionHint}>Customise the look and feel of system-generated documents and emails.</p>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Primary Brand Colour</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="color" className={styles.colorInput}
                    value={form.primaryColor}
                    onChange={(e) => set("primaryColor", e.target.value)} />
                  <input className={styles.input} value={form.primaryColor}
                    onChange={(e) => set("primaryColor", e.target.value)} style={{ flex: 1 }} />
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Accent Colour</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="color" className={styles.colorInput}
                    value={form.accentColor}
                    onChange={(e) => set("accentColor", e.target.value)} />
                  <input className={styles.input} value={form.accentColor}
                    onChange={(e) => set("accentColor", e.target.value)} style={{ flex: 1 }} />
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Report Card Footer Text</label>
                <input className={styles.input} value={form.reportFooter}
                  onChange={(e) => set("reportFooter", e.target.value)} />
              </div>
            </section>
          )}

          {/* ── FEES ── */}
          {activeSection === "fees" && (
            <section className={styles.formSection}>
              <h2 className={styles.sectionTitle}><CreditCard size={15} /> Fees Configuration</h2>
              <p className={styles.sectionHint}>Set default fee categories and payment rules.</p>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Default Currency</label>
                <div className={styles.selectWrap}>
                  <select className={styles.select} value={form.currency}
                    onChange={(e) => set("currency", e.target.value)}>
                    <option value="GHS">GHS — Ghanaian Cedi</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                  </select>
                  <ChevronDown size={14} className={styles.selectChevron} />
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Late Payment Penalty (%)</label>
                <input className={styles.input} type="number" min="0" max="50"
                  value={form.latePaymentPenalty}
                  onChange={(e) => set("latePaymentPenalty", e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Grace Period (days)</label>
                <input className={styles.input} type="number" min="0"
                  value={form.gracePeriod}
                  onChange={(e) => set("gracePeriod", e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Invoice Auto-Send</label>
                <div className={styles.selectWrap}>
                  <select className={styles.select} value={form.invoiceAutoSend}
                    onChange={(e) => set("invoiceAutoSend", e.target.value)}>
                    <option value="start">At term start</option>
                    <option value="manual">Manual only</option>
                    <option value="both">Both automatically and manually</option>
                  </select>
                  <ChevronDown size={14} className={styles.selectChevron} />
                </div>
              </div>
            </section>
          )}

          {/* ── ATTENDANCE ── */}
          {activeSection === "attendance" && (
            <section className={styles.formSection}>
              <h2 className={styles.sectionTitle}><ClipboardList size={15} /> Attendance Rules</h2>
              <p className={styles.sectionHint}>Configure attendance thresholds and auto-alert triggers.</p>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Minimum Attendance Rate (%)</label>
                <input className={styles.input} type="number" min="0" max="100"
                  value={form.minAttendanceRate}
                  onChange={(e) => set("minAttendanceRate", e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Alert Threshold — Guardian Notification (%)</label>
                <input className={styles.input} type="number" min="0" max="100"
                  value={form.alertThreshold}
                  onChange={(e) => set("alertThreshold", e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Late Arrival Cut-off (minutes after start)</label>
                <input className={styles.input} type="number" min="0"
                  value={form.lateArrivalCutoff}
                  onChange={(e) => set("lateArrivalCutoff", e.target.value)} />
              </div>
            </section>
          )}

          {/* ── GRADEBOOK ── */}
          {activeSection === "gradebook" && (
            <section className={styles.formSection}>
              <h2 className={styles.sectionTitle}><BookOpen size={15} /> Gradebook Settings</h2>
              <p className={styles.sectionHint}>
                This grading scale drives every report card and gradebook grade letter live — editing a
                minimum score here immediately changes how scores are graded across the app.
              </p>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Grading Scale</label>
                <div className={styles.gradeTableWrap}>
                  <table className={styles.gradeTable}>
                    <thead>
                      <tr>
                        <th>Grade</th><th>Min Score</th><th>Range</th><th>Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedScale.map((band, i) => (
                        <tr key={band.grade} className={band.remark?.toLowerCase().includes("fail") ? styles.gradeFailRow : ""}>
                          <td className={styles.gradeCell}>{band.grade}</td>
                          <td>
                            <input className={styles.gradeMinInput} type="number" min={0} max={100}
                              value={band.min}
                              onChange={(e) => setBandMin(i, parseInt(e.target.value) || 0)} />
                          </td>
                          <td className={styles.gradeRangeText}>{band.min}% – {band.max === 100 ? 100 : band.max}%</td>
                          <td>{band.remark}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ── SECURITY ── */}
          {activeSection === "security" && (
            <section className={styles.formSection}>
              <h2 className={styles.sectionTitle}><ShieldCheck size={15} /> Users &amp; Security</h2>
              <p className={styles.sectionHint}>Manage password policy, session settings, and access control.</p>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Minimum Password Length</label>
                <input className={styles.input} type="number" min="6" max="32"
                  value={form.minPasswordLength}
                  onChange={(e) => set("minPasswordLength", e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Session Timeout (minutes)</label>
                <input className={styles.input} type="number" min="5"
                  value={form.sessionTimeout}
                  onChange={(e) => set("sessionTimeout", e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Password Reset Policy</label>
                <div className={styles.selectWrap}>
                  <select className={styles.select} value={form.passwordResetPolicy}
                    onChange={(e) => set("passwordResetPolicy", e.target.value)}>
                    <option value="never">Never expire</option>
                    <option value="30">Every 30 days</option>
                    <option value="90">Every 90 days</option>
                    <option value="180">Every 180 days</option>
                  </select>
                  <ChevronDown size={14} className={styles.selectChevron} />
                </div>
              </div>
            </section>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeSection === "notifications" && (
            <section className={styles.formSection}>
              <h2 className={styles.sectionTitle}><Bell size={15} /> Notification Settings</h2>
              <p className={styles.sectionHint}>Configure email and SMS notifications sent to guardians and staff.</p>
              <div className={styles.warnBar}>
                <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                <span><strong>Not connected.</strong> These toggles are saved but no email/SMS sending exists yet — Announcements is the only channel that actually delivers today.</span>
              </div>
              {([
                { label: "Fee Reminders",             field: "feeReminders",            desc: "Send fee due reminders to guardians" },
                { label: "Attendance Alerts",         field: "attendanceAlerts",        desc: "Notify guardians when students are absent" },
                { label: "Exam Result Notifications", field: "examResultNotifications", desc: "Notify students and guardians when results are published" },
                { label: "Staff Announcements",       field: "staffAnnouncements",      desc: "Email staff for school-wide announcements" },
              ] as { label: string; field: keyof Form; desc: string }[]).map(({ label, field, desc }) => (
                <div key={String(field)} className={styles.toggleRow}>
                  <div>
                    <span className={styles.toggleLabel}>{label}</span>
                    <span className={styles.toggleDesc}>{desc}</span>
                  </div>
                  <label className={styles.toggle}>
                    <input type="checkbox"
                      checked={form[field] as boolean}
                      onChange={(e) => set(field, e.target.checked)} />
                    <span className={styles.toggleTrack} />
                  </label>
                </div>
              ))}
            </section>
          )}

          {/* ── OFFLINE & SYNC ── */}
          {activeSection === "offline" && (
            <section className={styles.formSection}>
              <h2 className={styles.sectionTitle}><Wifi size={15} /> Offline &amp; Sync</h2>
              <p className={styles.sectionHint}>Control offline caching behaviour and background sync intervals.</p>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Sync Interval (minutes)</label>
                <input className={styles.input} type="number" min="1"
                  value={form.syncInterval}
                  onChange={(e) => set("syncInterval", e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Offline Cache Size (MB)</label>
                <input className={styles.input} type="number" min="10"
                  value={form.cacheSizeMb}
                  onChange={(e) => set("cacheSizeMb", e.target.value)} />
              </div>
              <div className={styles.toggleRow}>
                <div>
                  <span className={styles.toggleLabel}>Enable Offline Mode</span>
                  <span className={styles.toggleDesc}>Allow users to continue working without internet</span>
                </div>
                <label className={styles.toggle}>
                  <input type="checkbox"
                    checked={form.offlineModeEnabled}
                    onChange={(e) => set("offlineModeEnabled", e.target.checked)} />
                  <span className={styles.toggleTrack} />
                </label>
              </div>
            </section>
          )}

          {/* ── INTEGRATIONS ── */}
          {activeSection === "integrations" && (
            <section className={styles.formSection}>
              <h2 className={styles.sectionTitle}><Puzzle size={15} /> Integrations</h2>
              <p className={styles.sectionHint}>Connect external services for SMS, payments, and communications.</p>
              <div className={styles.warnBar}>
                <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                <span><strong>Not connected.</strong> No SMS or payment-gateway integration is wired up yet — these values are saved but nothing in ScholarSphere sends SMS or processes payments through them.</span>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>SMS Gateway Provider</label>
                <div className={styles.selectWrap}>
                  <select className={styles.select} value={form.smsProvider}
                    onChange={(e) => set("smsProvider", e.target.value)}>
                    <option value="hubtel">Hubtel SMS</option>
                    <option value="arkesel">Arkesel</option>
                    <option value="mnotify">mNotify</option>
                    <option value="none">None</option>
                  </select>
                  <ChevronDown size={14} className={styles.selectChevron} />
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>SMS API Key</label>
                <input className={styles.input} type="password" placeholder="Enter API key…"
                  value={form.smsApiKey}
                  onChange={(e) => set("smsApiKey", e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Payment Gateway</label>
                <div className={styles.selectWrap}>
                  <select className={styles.select} value={form.paymentGateway}
                    onChange={(e) => set("paymentGateway", e.target.value)}>
                    <option value="paystack">Paystack</option>
                    <option value="flutterwave">Flutterwave</option>
                    <option value="momo">MTN MoMo</option>
                    <option value="none">None</option>
                  </select>
                  <ChevronDown size={14} className={styles.selectChevron} />
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Payment API Key</label>
                <input className={styles.input} type="password" placeholder="Enter API key…"
                  value={form.paymentApiKey}
                  onChange={(e) => set("paymentApiKey", e.target.value)} />
              </div>
            </section>
          )}

        </div>

        {/* ── Right preview panel ── */}
        {activeSection === "gradebook" ? (
          <aside className={styles.previewPanel}>
            <div className={styles.previewHeader}>
              <span className={styles.previewTitle}>Grading Preview</span>
              <Eye size={14} color="var(--clr-app-muted)" />
            </div>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--clr-app-muted)", margin: 0, lineHeight: 1.5 }}>
              Enter a raw score to see how it maps to the grading scale above.
            </p>
            <div className={styles.calcCard}>
              <div className={styles.calcRow}>
                <span className={styles.calcKey}>Raw Score</span>
                <input className={styles.calcInput} type="number" min={0} max={100} value={calcScore} onChange={(e) => setCalcScore(e.target.value)} />
              </div>
              <div className={styles.calcRow}>
                <span className={styles.calcKey}>Computed Grade</span>
                <span className={styles.calcGradePill}>{calcBand?.grade ?? "—"}</span>
              </div>
              <div className={styles.calcRow}>
                <span className={styles.calcKey}>Remark</span>
                <span className={styles.calcVal}>{calcBand?.remark ?? "—"}</span>
              </div>
            </div>
          </aside>
        ) : activeSection === "security" ? (
          <aside className={styles.previewPanel}>
            <div className={styles.previewHeader}>
              <span className={styles.previewTitle}>Current Policy</span>
              <ShieldCheck size={14} color="var(--clr-success)" />
            </div>
            <div className={styles.statusRow}>
              <CheckCircle2 size={18} className={styles.statusIconGood} />
              <div>
                <div className={styles.statusLabel}>Password Length</div>
                <div className={styles.statusDesc}>Minimum {form.minPasswordLength} characters required.</div>
              </div>
            </div>
            <div className={styles.statusRow}>
              <CheckCircle2 size={18} className={styles.statusIconGood} />
              <div>
                <div className={styles.statusLabel}>Session Timeout</div>
                <div className={styles.statusDesc}>Auto sign-out after {form.sessionTimeout} minutes idle.</div>
              </div>
            </div>
            <div className={styles.statusRow}>
              <CheckCircle2 size={18} className={styles.statusIconGood} />
              <div>
                <div className={styles.statusLabel}>Reset Policy</div>
                <div className={styles.statusDesc}>
                  {form.passwordResetPolicy === "never" ? "Passwords never expire." : `Passwords expire every ${form.passwordResetPolicy} days.`}
                </div>
              </div>
            </div>
          </aside>
        ) : (
          <aside className={styles.previewPanel}>
            <div className={styles.previewHeader}>
              <span className={styles.previewTitle}>Live Profile Preview</span>
              <button className={styles.previewToggle} aria-label="Preview letterhead"
                onClick={() => setShowLetterhead(true)}>
                <Eye size={14} />
              </button>
            </div>
            <div className={styles.previewCard}>
              <div className={styles.previewLogo}>
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "50%" }} />
                ) : (
                  <School size={28} style={{ color: form.primaryColor || "var(--clr-app-border)" }} />
                )}
              </div>
              <p className={styles.previewName}>{form.schoolName || "—"}</p>
              <p className={styles.previewMotto}>&quot;{form.motto || "—"}&quot;</p>
              <div className={styles.previewDivider} />
              <p className={styles.previewDetail}>{form.postalAddress || "—"}</p>
              <p className={styles.previewDetail}>Tel: {form.phone || "—"} | {form.email || "—"}</p>
              <div className={styles.previewLines}>
                <div className={styles.previewLine} style={{ width: "80%" }} />
                <div className={styles.previewLine} style={{ width: "60%" }} />
                <div className={styles.previewLine} style={{ width: "70%" }} />
              </div>
            </div>
            <div className={styles.previewMeta}>
              <span className={styles.previewMetaIcon}><RotateCcw size={12} /></span>
              <span className={styles.previewMetaText}>Last saved<br />{formattedDate}</span>
            </div>
          </aside>
        )}
      </div>

      {/* ── Letterhead preview modal ── */}
      {showLetterhead && (
        <div className={styles.lhBackdrop} onClick={() => setShowLetterhead(false)}>
          <div className={styles.lhModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.lhToolbar}>
              <span className={styles.lhToolbarTitle}>Letterhead Preview</span>
              <button className={styles.lhClose} onClick={() => setShowLetterhead(false)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.lhScroll}>
              <div className={styles.lhPage}>
                <div className={styles.lhHeaderBand} style={{ borderTopColor: form.primaryColor || "#073543" }}>
                  <div className={styles.lhLogoBox}>
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    ) : (
                      <School size={42} style={{ color: form.primaryColor || "#073543" }} />
                    )}
                  </div>
                  <div className={styles.lhSchoolInfo}>
                    <h1 className={styles.lhSchoolName}>{form.schoolName || "School Name"}</h1>
                    {form.motto && <p className={styles.lhMotto}>&ldquo;{form.motto}&rdquo;</p>}
                    <p className={styles.lhContact}>
                      {[form.postalAddress, form.phone, form.email, form.website]
                        .filter(Boolean).join("  |  ")}
                    </p>
                  </div>
                </div>
                <div className={styles.lhDivider} style={{ backgroundColor: form.primaryColor || "#073543" }} />
                <div className={styles.lhBody}>
                  <p className={styles.lhDateLine}>
                    Date: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                  <div className={styles.lhBodyLines}>
                    {[85, 92, 78, 88, 70, 95, 82].map((w, i) => (
                      <div key={i} className={styles.lhBodyLine} style={{ width: `${w}%` }} />
                    ))}
                  </div>
                  <div className={styles.lhSignature}>
                    <div className={styles.lhSigLine} />
                    <p className={styles.lhSigName}>{form.headteacher || "Headteacher"}</p>
                    <p className={styles.lhSigRole}>Headteacher / Principal</p>
                  </div>
                </div>
                {form.reportFooter && (
                  <div className={styles.lhFooter} style={{ borderTopColor: form.accentColor || "#486647" }}>
                    {form.reportFooter}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
