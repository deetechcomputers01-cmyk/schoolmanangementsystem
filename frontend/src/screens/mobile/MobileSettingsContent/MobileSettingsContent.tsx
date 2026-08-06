"use client";

/**
 * MobileSettingsContent — bespoke mobile view for Settings & School Profile.
 *
 * Every field/action shares the exact same state and save/reset logic as
 * the desktop SettingsScreen — both now consume useSettingsForm(), a single
 * shared hook, so the two platforms can never save differently. Previously
 * this screen had NO mobile treatment at all (the full 3-column desktop
 * layout rendered unconditionally on every viewport).
 *
 * IA: a grouped menu of the same 10 real sections desktop has, each row's
 * subtitle a real derived value (current term, grading-band count, enabled
 * channel count, etc — no fabricated stats). Tapping a row opens one shared
 * bottom sheet whose body swaps per section, mirroring desktop's tab
 * pattern. A global sticky Save/Discard bar appears only when dirty,
 * exactly like desktop's unsaved-changes banner.
 */

import { useRef, useState } from "react";
import {
  School, CalendarDays, Palette, CreditCard, ClipboardList,
  BookOpen, ShieldCheck, Bell, Wifi, Puzzle, Upload, ChevronRight,
  AlertTriangle, FileText, Eye,
} from "lucide-react";
import { YearsTermsPanel } from "@/screens/desktop/AcademicCalendarScreen/YearsTermsPanel";
import { FeeStructurePanel, type FeeStructureRow } from "@/screens/desktop/FeesScreen/FeeStructurePanel";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import {
  useSettingsForm, GH_REGIONS, SCHOOL_TYPES,
  type SettingsData, type YearData, type Form,
} from "@/screens/desktop/SettingsScreen/useSettingsForm";
import styles from "./MobileSettingsContent.module.css";

type SectionId = "profile" | "academic" | "branding" | "fees" | "attendance" | "gradebook" | "security" | "notifications" | "offline" | "integrations";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" className={`${styles.switch} ${checked ? styles.switchOn : ""}`} onClick={() => onChange(!checked)} aria-pressed={checked}>
      <span className={styles.switchThumb} />
    </button>
  );
}

export function MobileSettingsContent({ initialSettings, academicYears, classes, feeStructureRows }: {
  initialSettings: SettingsData;
  academicYears: YearData[];
  classes: { id: string; name: string }[];
  feeStructureRows: FeeStructureRow[];
}) {
  const {
    form, set, dirty, saving, resetting, handleSave, handleReset,
    gradingScale, setBandMin, sortedScale,
    formattedDate,
    logoUrl, logoUploading, handleLogoFile, handleLogoRemove,
    letterheadUrl, letterheadUploading, handleLetterheadFile, handleLetterheadRemove,
  } = useSettingsForm(initialSettings);

  const [openSection, setOpenSection] = useState<SectionId | null>(null);
  const [calcScore, setCalcScore] = useState("78");
  const [showLetterhead, setShowLetterhead] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const letterheadInputRef = useRef<HTMLInputElement>(null);

  const currentYear = academicYears.find((y) => y.isCurrent) ?? academicYears[0];
  const currentTerm = currentYear?.terms.find((t) => t.isCurrent);
  const calcBand = (() => {
    const n = Math.max(0, Math.min(100, parseInt(calcScore) || 0));
    return sortedScale.find((b) => n >= b.min) ?? sortedScale[sortedScale.length - 1] ?? null;
  })();

  const notifFields: { field: keyof Form; label: string; desc: string }[] = [
    { field: "feeReminders",            label: "Fee Reminders",             desc: "Send fee due reminders to guardians" },
    { field: "attendanceAlerts",        label: "Attendance Alerts",         desc: "Notify guardians when students are absent" },
    { field: "examResultNotifications", label: "Exam Result Notifications", desc: "Notify students and guardians when results are published" },
    { field: "staffAnnouncements",      label: "Staff Announcements",       desc: "Email staff for school-wide announcements" },
  ];
  const enabledNotifCount = notifFields.filter((f) => form[f.field]).length;
  const configuredIntegrations = [form.smsProvider !== "none", form.paymentGateway !== "none"].filter(Boolean).length;

  const sections: { id: SectionId; label: string; Icon: typeof School; subtitle: React.ReactNode; tag?: string }[] = [
    { id: "profile", label: "School Profile", Icon: School, subtitle: `${form.schoolName || "Unnamed school"}${form.gesCode ? ` • ${form.gesCode}` : ""}` },
    { id: "academic", label: "Academic Calendar", Icon: CalendarDays, subtitle: currentTerm && currentYear ? `${currentTerm.name}, ${currentYear.name}` : "No active term set" },
    { id: "branding", label: "Branding", Icon: Palette, subtitle: (
      <span className={styles.swatchRow}><span className={styles.swatch} style={{ background: form.primaryColor }} /><span className={styles.swatch} style={{ background: form.accentColor }} /></span>
    ) },
    { id: "fees", label: "Fees", Icon: CreditCard, subtitle: `${form.currency} • ${form.latePaymentPenalty}% Late Penalty` },
    { id: "attendance", label: "Attendance", Icon: ClipboardList, subtitle: `${form.minAttendanceRate}% Minimum Rate` },
    { id: "gradebook", label: "Gradebook", Icon: BookOpen, subtitle: `${gradingScale.length} Grade Bands` },
    { id: "security", label: "Users & Security", Icon: ShieldCheck, subtitle: `${form.minPasswordLength} char min • ${form.passwordResetPolicy === "never" ? "never expires" : `resets every ${form.passwordResetPolicy}d`}` },
    { id: "notifications", label: "Notifications", Icon: Bell, subtitle: `${enabledNotifCount} of ${notifFields.length} channels enabled`, tag: "not connected" },
    { id: "offline", label: "Offline & Sync", Icon: Wifi, subtitle: `${form.offlineModeEnabled ? "Active" : "Disabled"} • ${form.syncInterval}m sync` },
    { id: "integrations", label: "Integrations", Icon: Puzzle, subtitle: `${configuredIntegrations} provider${configuredIntegrations === 1 ? "" : "s"} configured`, tag: configuredIntegrations === 0 ? "not connected" : undefined },
  ];

  const groups: { label: string; ids: SectionId[] }[] = [
    { label: "School", ids: ["profile", "academic", "branding"] },
    { label: "Operations", ids: ["fees", "attendance", "gradebook"] },
    { label: "System", ids: ["security", "notifications", "offline", "integrations"] },
  ];

  const open = sections.find((s) => s.id === openSection) ?? null;

  return (
    <div className={styles.root}>
      <div className={styles.identityCard}>
        <div className={styles.identityTop}>
          <div className={styles.crestAvatar}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <School size={22} style={{ color: "var(--clr-app-border)" }} />
            )}
          </div>
          <div className={styles.identityText}>
            <p className={styles.identityName}>{form.schoolName || "Unnamed school"}</p>
            {form.motto && <p className={styles.identityMotto}>&quot;{form.motto}&quot;</p>}
          </div>
        </div>
        <p className={styles.savedCaption}>Last saved {formattedDate}</p>
      </div>

      {groups.map((g) => (
        <div key={g.label} className={styles.group}>
          <p className={styles.groupLabel}>{g.label}</p>
          <div className={styles.groupCard}>
            {g.ids.map((id) => {
              const s = sections.find((x) => x.id === id)!;
              return (
                <button key={id} type="button" className={styles.row} onClick={() => setOpenSection(id)}>
                  <span className={styles.rowIcon}><s.Icon size={18} /></span>
                  <span className={styles.rowText}>
                    <span className={styles.rowTitle}>{s.label}</span>
                    <span className={styles.rowSubtitle}>{s.subtitle}</span>
                  </span>
                  {s.tag && <span className={styles.notConnectedTag}>{s.tag}</span>}
                  <ChevronRight size={16} className={styles.rowChevron} />
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {dirty && (
        <div className={styles.unsavedBar}>
          <div className={styles.unsavedNote}><AlertTriangle size={14} /> You have unsaved changes</div>
          <div className={styles.unsavedActions}>
            <button type="button" className={styles.discardBtn} onClick={handleReset} disabled={resetting}>Discard</button>
            <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Now"}</button>
          </div>
        </div>
      )}

      <MobileSheet open={!!open} onClose={() => setOpenSection(null)} title={open?.label ?? ""}>
        {open?.id === "profile" && (
          <div className={styles.sheetBody}>
            <div className={kit.previewCard}>
              <div className={kit.previewIcon}>
                {logoUrl ? <Eye size={16} /> : <School size={16} />}
              </div>
              <div className={kit.previewInfo}>
                <p className={kit.previewTitle}>School Crest</p>
                <p className={kit.previewSub}>PNG, JPG, WEBP, or SVG, max 2MB</p>
              </div>
            </div>
            <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoFile(f); e.target.value = ""; }} />
            <div className={styles.uploadRow}>
              <button type="button" className={kit.btnOutline} onClick={() => logoInputRef.current?.click()} disabled={logoUploading}>
                <Upload size={14} /> {logoUploading ? "Uploading…" : logoUrl ? "Replace Logo" : "Upload Logo"}
              </button>
              {logoUrl && <button type="button" className={styles.removeLink} onClick={handleLogoRemove} disabled={logoUploading}>Remove</button>}
            </div>

            <div className={kit.previewCard}>
              <div className={kit.previewIcon}><FileText size={16} /></div>
              <div className={kit.previewInfo}>
                <p className={kit.previewTitle}>Letterhead</p>
                <p className={kit.previewSub}>{form.letterheadMode === "custom" && letterheadUrl ? "Custom uploaded image" : "Auto-generated from details below"}</p>
              </div>
              <button type="button" className={styles.previewBtn} onClick={() => setShowLetterhead(true)}><Eye size={14} /></button>
            </div>
            <div className={kit.segmented}>
              <button type="button" className={form.letterheadMode === "generated" ? kit.segBtnActive : kit.segBtn} onClick={() => set("letterheadMode", "generated")}>Auto-generated</button>
              <button type="button" className={form.letterheadMode === "custom" ? kit.segBtnActive : kit.segBtn} onClick={() => set("letterheadMode", letterheadUrl ? "custom" : "generated")} disabled={!letterheadUrl}>Custom Upload</button>
            </div>
            <input ref={letterheadInputRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLetterheadFile(f); e.target.value = ""; }} />
            <div className={styles.uploadRow}>
              <button type="button" className={kit.btnOutline} onClick={() => letterheadInputRef.current?.click()} disabled={letterheadUploading}>
                <Upload size={14} /> {letterheadUploading ? "Uploading…" : letterheadUrl ? "Replace Letterhead" : "Upload Letterhead"}
              </button>
              {letterheadUrl && <button type="button" className={styles.removeLink} onClick={handleLetterheadRemove} disabled={letterheadUploading}>Remove</button>}
            </div>

            <div className={kit.field}><label>School Name</label><input className={kit.input} value={form.schoolName} onChange={(e) => set("schoolName", e.target.value)} /></div>
            <div className={kit.fieldRow}>
              <div className={kit.field}><label>GES Code</label><input className={kit.input} value={form.gesCode} onChange={(e) => set("gesCode", e.target.value)} /></div>
              <div className={kit.field}>
                <label>School Type</label>
                <select className={kit.select} value={form.schoolType} onChange={(e) => set("schoolType", e.target.value)}>
                  {SCHOOL_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className={kit.field}><label>Motto</label><input className={kit.input} value={form.motto} onChange={(e) => set("motto", e.target.value)} /></div>
            <div className={kit.field}><label>Headteacher / Principal Name</label><input className={kit.input} value={form.headteacher} onChange={(e) => set("headteacher", e.target.value)} /></div>
            <div className={kit.fieldRow}>
              <div className={kit.field}>
                <label>Region</label>
                <select className={kit.select} value={form.region} onChange={(e) => set("region", e.target.value)}>
                  {GH_REGIONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className={kit.field}><label>District</label><input className={kit.input} value={form.district} onChange={(e) => set("district", e.target.value)} /></div>
            </div>
            <div className={kit.field}><label>Postal Address</label><input className={kit.input} value={form.postalAddress} onChange={(e) => set("postalAddress", e.target.value)} /></div>
            <div className={kit.fieldRow}>
              <div className={kit.field}><label>Phone Number</label><input className={kit.input} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
              <div className={kit.field}><label>Email Address</label><input className={kit.input} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
            </div>
            <div className={kit.field}><label>Website</label><input className={kit.input} value={form.website} onChange={(e) => set("website", e.target.value)} /></div>
          </div>
        )}

        {open?.id === "academic" && (
          <div className={styles.sheetBody}>
            <p className={kit.helperText}>Manage academic years and terms — the same data Timetable and Report Cards use. A change here applies everywhere immediately.</p>
            <YearsTermsPanel years={academicYears} />
          </div>
        )}

        {open?.id === "branding" && (
          <div className={styles.sheetBody}>
            <div className={kit.field}>
              <label>Primary Brand Colour</label>
              <div className={styles.colorRow}>
                <input type="color" className={styles.colorInput} value={form.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} />
                <input className={kit.input} value={form.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} style={{ flex: 1 }} />
              </div>
            </div>
            <div className={kit.field}>
              <label>Accent Colour</label>
              <div className={styles.colorRow}>
                <input type="color" className={styles.colorInput} value={form.accentColor} onChange={(e) => set("accentColor", e.target.value)} />
                <input className={kit.input} value={form.accentColor} onChange={(e) => set("accentColor", e.target.value)} style={{ flex: 1 }} />
              </div>
            </div>
            <div className={kit.field}><label>Report Card Footer Text</label><input className={kit.input} value={form.reportFooter} onChange={(e) => set("reportFooter", e.target.value)} /></div>
          </div>
        )}

        {open?.id === "fees" && (
          <div className={styles.sheetBody}>
            <div className={kit.field}>
              <label>Default Currency</label>
              <select className={kit.select} value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                <option value="GHS">GHS — Ghanaian Cedi</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>
            <div className={kit.field}><label>Late Payment Penalty (%)</label><input className={kit.input} type="number" min="0" max="50" value={form.latePaymentPenalty} onChange={(e) => set("latePaymentPenalty", e.target.value)} /></div>
            <div className={kit.field}><label>Grace Period (days)</label><input className={kit.input} type="number" min="0" value={form.gracePeriod} onChange={(e) => set("gracePeriod", e.target.value)} /></div>
            <div className={kit.field}>
              <label>Invoice Auto-Send</label>
              <select className={kit.select} value={form.invoiceAutoSend} onChange={(e) => set("invoiceAutoSend", e.target.value)}>
                <option value="start">At term start</option>
                <option value="manual">Manual only</option>
                <option value="both">Both automatically and manually</option>
              </select>
            </div>
            <div className={kit.field}>
              <label>School Fees by Class</label>
              <p className={kit.helperText}>
                The actual amount each class pays per term and category — used to prefill invoices.
              </p>
              <FeeStructurePanel classes={classes} rows={feeStructureRows} />
            </div>
          </div>
        )}

        {open?.id === "attendance" && (
          <div className={styles.sheetBody}>
            <div className={kit.field}><label>Minimum Attendance Rate (%)</label><input className={kit.input} type="number" min="0" max="100" value={form.minAttendanceRate} onChange={(e) => set("minAttendanceRate", e.target.value)} /></div>
            <div className={kit.field}><label>Alert Threshold — Guardian Notification (%)</label><input className={kit.input} type="number" min="0" max="100" value={form.alertThreshold} onChange={(e) => set("alertThreshold", e.target.value)} /></div>
            <div className={kit.field}><label>Late Arrival Cut-off (minutes after start)</label><input className={kit.input} type="number" min="0" value={form.lateArrivalCutoff} onChange={(e) => set("lateArrivalCutoff", e.target.value)} /></div>
          </div>
        )}

        {open?.id === "gradebook" && (
          <div className={styles.sheetBody}>
            <p className={kit.helperText}>This grading scale drives every report card and gradebook grade letter live.</p>
            <div className={styles.gradeList}>
              {sortedScale.map((band, i) => (
                <div key={band.grade} className={styles.gradeRow}>
                  <span className={styles.gradeLetter}>{band.grade}</span>
                  <input className={styles.gradeMinInput} type="number" min={0} max={100} value={band.min} onChange={(e) => setBandMin(i, parseInt(e.target.value) || 0)} />
                  <span className={styles.gradeRange}>{band.min}% – {band.max === 100 ? 100 : band.max}%</span>
                  <span className={styles.gradeRemark}>{band.remark}</span>
                </div>
              ))}
            </div>
            <div className={styles.calcCard}>
              <p className={styles.calcTitle}>Grading Preview</p>
              <div className={kit.fieldRow}>
                <div className={kit.field}><label>Raw Score</label><input className={kit.input} type="number" min={0} max={100} value={calcScore} onChange={(e) => setCalcScore(e.target.value)} /></div>
                <div className={kit.field}><label>Grade</label><div className={styles.calcGradePill}>{calcBand?.grade ?? "—"}</div></div>
              </div>
              <p className={styles.calcRemark}>{calcBand?.remark ?? "—"}</p>
            </div>
          </div>
        )}

        {open?.id === "security" && (
          <div className={styles.sheetBody}>
            <div className={kit.field}><label>Minimum Password Length</label><input className={kit.input} type="number" min="6" max="32" value={form.minPasswordLength} onChange={(e) => set("minPasswordLength", e.target.value)} /></div>
            <div className={kit.field}><label>Session Timeout (minutes)</label><input className={kit.input} type="number" min="5" value={form.sessionTimeout} onChange={(e) => set("sessionTimeout", e.target.value)} /></div>
            <div className={kit.field}>
              <label>Password Reset Policy</label>
              <select className={kit.select} value={form.passwordResetPolicy} onChange={(e) => set("passwordResetPolicy", e.target.value)}>
                <option value="never">Never expire</option>
                <option value="30">Every 30 days</option>
                <option value="90">Every 90 days</option>
                <option value="180">Every 180 days</option>
              </select>
            </div>
          </div>
        )}

        {open?.id === "notifications" && (
          <div className={styles.sheetBody}>
            <div className={`${kit.banner} ${kit.bannerWarn}`}>
              <AlertTriangle size={14} /> <strong>Not connected.</strong> These toggles are saved but no email/SMS sending exists yet — Announcements is the only channel that actually delivers today.
            </div>
            {notifFields.map(({ field, label, desc }) => (
              <div key={field} className={styles.toggleRow}>
                <div><p className={styles.toggleLabel}>{label}</p><p className={styles.toggleDesc}>{desc}</p></div>
                <Toggle checked={form[field] as boolean} onChange={(v) => set(field, v)} />
              </div>
            ))}
          </div>
        )}

        {open?.id === "offline" && (
          <div className={styles.sheetBody}>
            <div className={kit.field}><label>Sync Interval (minutes)</label><input className={kit.input} type="number" min="1" value={form.syncInterval} onChange={(e) => set("syncInterval", e.target.value)} /></div>
            <div className={kit.field}><label>Offline Cache Size (MB)</label><input className={kit.input} type="number" min="10" value={form.cacheSizeMb} onChange={(e) => set("cacheSizeMb", e.target.value)} /></div>
            <div className={styles.toggleRow}>
              <div><p className={styles.toggleLabel}>Enable Offline Mode</p><p className={styles.toggleDesc}>Allow users to continue working without internet</p></div>
              <Toggle checked={form.offlineModeEnabled} onChange={(v) => set("offlineModeEnabled", v)} />
            </div>
          </div>
        )}

        {open?.id === "integrations" && (
          <div className={styles.sheetBody}>
            <div className={`${kit.banner} ${kit.bannerWarn}`}>
              <AlertTriangle size={14} /> <strong>Not connected.</strong> No SMS or payment-gateway integration is wired up yet — these values are saved but nothing sends SMS or processes payments through them.
            </div>
            <div className={kit.field}>
              <label>SMS Gateway Provider</label>
              <select className={kit.select} value={form.smsProvider} onChange={(e) => set("smsProvider", e.target.value)}>
                <option value="hubtel">Hubtel SMS</option>
                <option value="arkesel">Arkesel</option>
                <option value="mnotify">mNotify</option>
                <option value="none">None</option>
              </select>
            </div>
            <div className={kit.field}><label>SMS API Key</label><input className={kit.input} type="password" placeholder="Enter API key…" value={form.smsApiKey} onChange={(e) => set("smsApiKey", e.target.value)} /></div>
            <div className={kit.field}>
              <label>Payment Gateway</label>
              <select className={kit.select} value={form.paymentGateway} onChange={(e) => set("paymentGateway", e.target.value)}>
                <option value="paystack">Paystack</option>
                <option value="flutterwave">Flutterwave</option>
                <option value="momo">MTN MoMo</option>
                <option value="none">None</option>
              </select>
            </div>
            <div className={kit.field}><label>Payment API Key</label><input className={kit.input} type="password" placeholder="Enter API key…" value={form.paymentApiKey} onChange={(e) => set("paymentApiKey", e.target.value)} /></div>
          </div>
        )}
      </MobileSheet>

      <MobileSheet open={showLetterhead} onClose={() => setShowLetterhead(false)} title="Letterhead Preview" compact>
        <div className={styles.lhPage}>
          <div className={styles.lhHeaderBand} style={{ borderTopColor: form.primaryColor || "#073543" }}>
            <div className={styles.lhLogoBox}>
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              ) : <School size={28} style={{ color: form.primaryColor || "#073543" }} />}
            </div>
            <div>
              <p className={styles.lhSchoolName}>{form.schoolName || "School Name"}</p>
              {form.motto && <p className={styles.lhMotto}>&ldquo;{form.motto}&rdquo;</p>}
              <p className={styles.lhContact}>{[form.postalAddress, form.phone, form.email].filter(Boolean).join("  |  ")}</p>
            </div>
          </div>
          <div className={styles.lhDivider} style={{ background: form.primaryColor || "#073543" }} />
          <div className={styles.lhBodyLines}>
            {[85, 92, 78, 88, 70].map((w, i) => <div key={i} className={styles.lhBodyLine} style={{ width: `${w}%` }} />)}
          </div>
          {form.reportFooter && <div className={styles.lhFooter} style={{ borderTopColor: form.accentColor || "#486647" }}>{form.reportFooter}</div>}
        </div>
      </MobileSheet>
    </div>
  );
}
