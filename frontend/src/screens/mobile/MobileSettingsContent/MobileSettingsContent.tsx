"use client";

/**
 * MobileSettingsContent — bespoke mobile view for Settings & School Profile.
 *
 * This is the section list only. Tapping a row navigates to a real page
 * (`/settings/<section>`) instead of opening a bottom sheet — each section
 * is its own mobile screen with its own back button, while desktop keeps its
 * single-page tabs layout untouched. State (form/dirty/save/reset) comes
 * from SettingsFormContext, provided by the `/settings` route layout, so it
 * survives navigating between this list and the section pages.
 */

import Link from "next/link";
import {
  School, CalendarDays, Palette, CreditCard, ClipboardList,
  BookOpen, ShieldCheck, Bell, Wifi, Puzzle, ChevronRight, AlertTriangle,
} from "lucide-react";
import { useSettingsFormContext } from "./SettingsFormContext";
import type { SectionId } from "./MobileSettingsSectionPage";
import styles from "./MobileSettingsContent.module.css";

export function MobileSettingsContent() {
  const { form, dirty, saving, resetting, handleSave, handleReset, gradingScale, formattedDate, logoUrl, academicYears } = useSettingsFormContext();

  const currentYear = academicYears.find((y) => y.isCurrent) ?? academicYears[0];
  const currentTerm = currentYear?.terms.find((t) => t.isCurrent);

  const notifFieldKeys = ["feeReminders", "attendanceAlerts", "examResultNotifications", "staffAnnouncements"] as const;
  const enabledNotifCount = notifFieldKeys.filter((f) => form[f]).length;
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
    { id: "notifications", label: "Notifications", Icon: Bell, subtitle: `${enabledNotifCount} of ${notifFieldKeys.length} channels enabled`, tag: "not connected" },
    { id: "offline", label: "Offline & Sync", Icon: Wifi, subtitle: `${form.offlineModeEnabled ? "Active" : "Disabled"} • ${form.syncInterval}m sync` },
    { id: "integrations", label: "Integrations", Icon: Puzzle, subtitle: `${configuredIntegrations} provider${configuredIntegrations === 1 ? "" : "s"} configured`, tag: configuredIntegrations === 0 ? "not connected" : undefined },
  ];

  const groups: { label: string; ids: SectionId[] }[] = [
    { label: "School", ids: ["profile", "academic", "branding"] },
    { label: "Operations", ids: ["fees", "attendance", "gradebook"] },
    { label: "System", ids: ["security", "notifications", "offline", "integrations"] },
  ];

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
                <Link key={id} href={`/settings/${id}`} className={styles.row}>
                  <span className={styles.rowIcon}><s.Icon size={18} /></span>
                  <span className={styles.rowText}>
                    <span className={styles.rowTitle}>{s.label}</span>
                    <span className={styles.rowSubtitle}>{s.subtitle}</span>
                  </span>
                  {s.tag && <span className={styles.notConnectedTag}>{s.tag}</span>}
                  <ChevronRight size={16} className={styles.rowChevron} />
                </Link>
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
    </div>
  );
}
