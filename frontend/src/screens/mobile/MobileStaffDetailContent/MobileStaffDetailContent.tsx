"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown, Hash, GraduationCap, Download, Users, Activity, AlertCircle, Clock,
  Mail, Phone, Camera, UploadCloud, X, Paperclip, CalendarDays, Edit2, Copy, School,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import type { StaffDetailProps } from "@/screens/desktop/StaffDetailScreen/StaffDetailContent";
import styles from "./MobileStaffDetailContent.module.css";

const CATEGORY_OPTIONS = [
  { value: "teaching",  label: "Teaching" },
  { value: "accounts",  label: "Accounts" },
  { value: "driver",    label: "Driver" },
  { value: "caterer",   label: "Caterer" },
  { value: "nurse",     label: "Nurse" },
  { value: "security",  label: "Security" },
  { value: "admin",     label: "Admin" },
] as const;

type Tab = "overview" | "timetable" | "attendance" | "classes" | "subjects" | "documents" | "audit";

const TEACHING_TABS: { key: Tab; label: string }[] = [
  { key: "overview",   label: "Overview" },
  { key: "timetable",  label: "Timetable" },
  { key: "attendance", label: "Attendance" },
  { key: "classes",    label: "Classes" },
  { key: "subjects",   label: "Subjects" },
  { key: "documents",  label: "Documents" },
  { key: "audit",      label: "Audit Log" },
];

const SUPPORT_TABS: { key: Tab; label: string }[] = [
  { key: "overview",   label: "Overview" },
  { key: "attendance", label: "Attendance" },
  { key: "documents",  label: "Documents" },
  { key: "audit",      label: "Audit Log" },
];

function fmtCurrency(n: number) {
  return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtActivityDate(iso: string) {
  const date = new Date(iso);
  const diffH = (Date.now() - date.getTime()) / 3600000;
  if (diffH < 24) return `Today, ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  if (diffH < 48) return `Yesterday, ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function MobileStaffDetailContent(props: StaffDetailProps) {
  const {
    id, staffNo, firstName, lastName, phone, roleTitle, isTeaching, staffCategory,
    initials, joinedDate, yearsOfService, isActive, userRole, userEmail,
    subjects, assignedClasses, salary, canSeePayroll, defaultTab, initialEditOpen, isModal,
    recentActivity, passwordResetPolicyDays, passwordAgeDays, passwordResetDue,
  } = props;

  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const TABS = isTeaching ? TEACHING_TABS : SUPPORT_TABS;
  const validDefault = TABS.find(t => t.key === defaultTab)?.key ?? "overview";
  const [activeTab, setActiveTab] = useState<Tab>(validDefault as Tab);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const fullName = `${firstName} ${lastName}`;
  const netPay = salary ? salary.basicSalary + salary.allowances - salary.deductions : 0;

  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["personal"]));
  function toggleSection(key: string) {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  async function handleResetPassword() {
    const confirmed = await confirm({
      title: "Reset password",
      message: `Generate a new temporary password for ${fullName}? Their current password will stop working immediately.`,
      confirmLabel: "Reset password",
    });
    if (!confirmed) return;
    setResettingPassword(true);
    setTempPassword(null);
    try {
      const res = await fetch(`/api/staff/${id}/reset-password`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.showToast(data.error ?? "Failed to reset password", "error"); return; }
      setTempPassword(data.tempPassword);
    } catch { toast.showToast("Network error. Please try again.", "error"); }
    finally { setResettingPassword(false); }
  }

  // ── Edit form state ──
  const [editing, setEditing] = useState(!!initialEditOpen);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState({
    firstName, lastName, phone, roleTitle, staffCategory, email: props.email, notes: props.notes,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [keptDocuments, setKeptDocuments] = useState(props.documents);
  const [newDocFiles, setNewDocFiles] = useState<File[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const categoryChanged = editForm.staffCategory !== staffCategory;
  const willBeTeaching = editForm.staffCategory === "teaching";

  function openEdit() {
    setEditForm({ firstName, lastName, phone, roleTitle, staffCategory, email: props.email, notes: props.notes });
    setPhotoFile(null);
    setPhotoPreview(null);
    setKeptDocuments(props.documents);
    setNewDocFiles([]);
    setEditError("");
    setEditing(true);
  }

  function closeEdit() {
    if (saving) return;
    setEditing(false);
  }

  function handlePhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleDocPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) setNewDocFiles(prev => [...prev, ...files]);
    e.target.value = "";
  }

  function removeKeptDocument(url: string) {
    setKeptDocuments(prev => prev.filter(d => d.url !== url));
  }

  function removeNewDocFile(index: number) {
    setNewDocFiles(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSaveStaff() {
    setSaving(true);
    setEditError("");
    try {
      const fd = new FormData();
      fd.append("firstName", editForm.firstName);
      fd.append("lastName", editForm.lastName);
      fd.append("phone", editForm.phone);
      fd.append("roleTitle", editForm.roleTitle);
      fd.append("staffCategory", editForm.staffCategory);
      fd.append("isTeaching", String(editForm.staffCategory === "teaching"));
      fd.append("email", editForm.email);
      fd.append("notes", editForm.notes);
      fd.append("keptDocuments", JSON.stringify(keptDocuments));
      newDocFiles.forEach(file => fd.append("documents", file));
      if (photoFile) fd.append("photo", photoFile);

      const res = await fetch(`/api/staff/${id}`, { method: "PATCH", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setEditError(data?.message ?? "Failed to save. Please check the details and try again.");
        return;
      }
      toast.showToast("Staff profile saved");
      router.refresh();
      if (isModal) router.back();
      else setEditing(false);
    } catch {
      setEditError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const editBody = (
    <div className={styles.editBody}>
      <div className={styles.editIdentity}>
        <div className={styles.editPhotoWrap}>
          {photoPreview || props.photoUrl ? (
            <img src={photoPreview ?? props.photoUrl ?? ""} alt={fullName} className={styles.editPhoto} />
          ) : (
            <div className={styles.editPhotoFallback}>{initials}</div>
          )}
          <button type="button" className={styles.editPhotoBtn} onClick={() => photoInputRef.current?.click()} aria-label="Change photo">
            <Camera size={15} />
          </button>
          <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handlePhotoPick} />
        </div>
        <span className={styles.idPill}>{staffNo}</span>
      </div>

      <section className={styles.editSection}>
        <h3 className={styles.editSectionTitle}>Update Documents</h3>
        <div className={styles.dropzone} onClick={() => docInputRef.current?.click()}>
          <UploadCloud size={22} className={styles.dropzoneIcon} />
          <p className={styles.dropzoneText}>
            Click to upload or <span className={styles.dropzoneLink}>drag and drop</span>
          </p>
          <p className={styles.dropzoneHint}>PDF, JPG or PNG</p>
        </div>
        <input ref={docInputRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={handleDocPick} />
        {(keptDocuments.length > 0 || newDocFiles.length > 0) && (
          <div className={styles.fileList}>
            {keptDocuments.map(doc => (
              <div key={doc.url} className={styles.fileItem}>
                <Paperclip size={14} className={styles.fileItemIcon} />
                <span className={styles.fileItemName}>{doc.name}</span>
                <button type="button" className={styles.fileItemDelete} onClick={() => removeKeptDocument(doc.url)} aria-label={`Remove ${doc.name}`}>
                  <X size={13} />
                </button>
              </div>
            ))}
            {newDocFiles.map((file, i) => (
              <div key={`new-${i}`} className={styles.fileItem}>
                <Paperclip size={14} className={styles.fileItemIcon} />
                <span className={styles.fileItemName}>{file.name}</span>
                <button type="button" className={styles.fileItemDelete} onClick={() => removeNewDocFile(i)} aria-label={`Remove ${file.name}`}>
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.editSection}>
        <h3 className={styles.editSectionTitle}>Personal Details</h3>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>First Name</label>
          <input className={styles.input} type="text" value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Last Name</label>
          <input className={styles.input} type="text" value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} />
        </div>
      </section>

      <section className={styles.editSection}>
        <h3 className={styles.editSectionTitle}>Employment</h3>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Role Category</label>
          <select className={styles.select} value={editForm.staffCategory} onChange={e => setEditForm(f => ({ ...f, staffCategory: e.target.value }))}>
            {CATEGORY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        {categoryChanged && isTeaching && !willBeTeaching && (
          <div className={styles.dangerBox}>
            <AlertCircle size={15} />
            <p>Changing away from Teaching will remove this staff member from all class and subject assignments.</p>
          </div>
        )}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Role Title</label>
          <input className={styles.input} type="text" value={editForm.roleTitle} onChange={e => setEditForm(f => ({ ...f, roleTitle: e.target.value }))} />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Phone Number</label>
          <div className={styles.iconInputWrap}>
            <Phone size={15} className={styles.iconInputIcon} />
            <input className={styles.iconInput} type="text" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Email Address</label>
          <div className={styles.iconInputWrap}>
            <Mail size={15} className={styles.iconInputIcon} />
            <input className={styles.iconInput} type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
          </div>
        </div>
      </section>

      <section className={styles.editSection}>
        <h3 className={styles.editSectionTitle}>Institutional Notes</h3>
        <textarea
          className={styles.textarea}
          rows={3}
          placeholder="Notes visible to administrators only..."
          value={editForm.notes}
          onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
        />
      </section>

      {editError && <p className={styles.errorText}>{editError}</p>}
    </div>
  );

  const editFooter = (
    <div className={styles.editFooter}>
      <button className={styles.btnOutline} onClick={closeEdit} disabled={saving} type="button">Cancel</button>
      <button className={styles.btnPrimary} onClick={handleSaveStaff} disabled={saving} type="button">
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );

  if (editing) {
    const body = (
      <>
        {editBody}
        {editFooter}
      </>
    );
    if (isModal) {
      return (
        <div className={styles.editInline}>
          <h2 className={styles.editInlineTitle}>Edit Staff Profile</h2>
          {body}
        </div>
      );
    }
    return (
      <div className={styles.sheetBackdrop} onClick={closeEdit}>
        <div className={styles.sheet} onClick={e => e.stopPropagation()}>
          <div className={styles.sheetHandle} />
          <div className={styles.sheetHeaderRow}>
            <h2 className={styles.editInlineTitle}>Edit Staff Profile</h2>
            <button className={styles.sheetClose} onClick={closeEdit} aria-label="Close" type="button"><X size={18} /></button>
          </div>
          {body}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* Header */}
      <header className={styles.profileHeader}>
        <div className={styles.avatar}>{initials}</div>
        <div className={styles.profileInfo}>
          <div className={styles.nameRow}>
            <h1 className={styles.name}>{fullName}</h1>
            <span className={isActive ? styles.badgeActive : styles.badgeInactive}>{isActive ? "Active" : "Inactive"}</span>
          </div>
          <p className={styles.metaLine}>
            <Hash size={12} /> {staffNo} · {roleTitle}
          </p>
          <p className={styles.metaLine}><CalendarDays size={12} /> Joined {joinedDate}</p>
        </div>
      </header>

      {/* Action */}
      <div className={styles.actionCol}>
        <button className={styles.btnPrimary} onClick={openEdit} type="button">
          <Edit2 size={14} /> Edit Profile
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabRow}>
        {TABS.map(t => (
          <button key={t.key} className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ""}`} onClick={() => setActiveTab(t.key)} type="button">
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Years of Service</span>
              <span className={styles.kpiValue}>{yearsOfService}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Classes Assigned</span>
              <span className={styles.kpiValue}>{assignedClasses.length}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Subjects Taught</span>
              <span className={styles.kpiValue}>{subjects.length}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Attendance Rate</span>
              <span className={styles.kpiValueMuted}>—</span>
            </div>
          </div>

          {isTeaching && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}><School size={15} /> Current Assignments</h3>
              {assignedClasses.length === 0 ? (
                <p className={styles.emptyText}>No classes assigned.</p>
              ) : (
                <div className={styles.assignmentList}>
                  {assignedClasses.map(c => (
                    <div key={c.classId} className={styles.assignmentCard}>
                      <div className={styles.assignmentIcon}><Users size={17} /></div>
                      <div className={styles.assignmentInfo}>
                        <p className={styles.assignmentName}>{c.className} — {c.subjects.join(", ")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <div className={styles.accordionCard}>
            <AccordionSection id="personal" label="Personal Details" open={openSections.has("personal")} onToggle={toggleSection}>
              <FieldRow label="First Name" value={firstName} />
              <FieldRow label="Last Name" value={lastName} />
              <FieldRow label="Phone" value={phone} />
              <FieldRow label="Email" value={userEmail} />
            </AccordionSection>

            <AccordionSection id="employment" label="Employment" open={openSections.has("employment")} onToggle={toggleSection}>
              <FieldRow label="Role Title" value={roleTitle} />
              <FieldRow label="Category" value={staffCategory} capitalize />
              <FieldRow label="Date Joined" value={joinedDate} />
              <FieldRow label="Teaching" value={isTeaching ? "Yes" : "No"} />
            </AccordionSection>

            {canSeePayroll && salary && (
              <AccordionSection id="salary" label="Salary Summary" open={openSections.has("salary")} onToggle={toggleSection}>
                <FieldRow label="Basic Salary" value={fmtCurrency(salary.basicSalary)} />
                <FieldRow label="Allowances" value={fmtCurrency(salary.allowances)} />
                <FieldRow label="Deductions" value={`-${fmtCurrency(salary.deductions)}`} />
                <FieldRow label="Net Pay" value={fmtCurrency(netPay)} accent />
              </AccordionSection>
            )}

            <AccordionSection id="leave" label="Leave Balance" open={openSections.has("leave")} onToggle={toggleSection}>
              <p className={styles.emptyText}>No leave records on file.</p>
            </AccordionSection>

            <AccordionSection id="access" label="System Access" open={openSections.has("access")} onToggle={toggleSection}>
              <FieldRow label="Role" value={userRole.replace("_", " ")} capitalize />
              {userEmail !== "—" && (
                <FieldRow
                  label="Password"
                  value={
                    passwordAgeDays === null
                      ? "Never reset"
                      : `Changed ${passwordAgeDays} day${passwordAgeDays === 1 ? "" : "s"} ago${
                          passwordResetPolicyDays !== "never" ? ` · policy: every ${passwordResetPolicyDays} days` : ""
                        }${passwordResetDue ? " · reset due" : ""}`
                  }
                />
              )}
              {userEmail === "—" ? (
                <p className={styles.emptyText}>No login account exists for this staff member.</p>
              ) : (
                <button className={styles.btnFullOutline} disabled={resettingPassword} onClick={handleResetPassword} type="button">
                  {resettingPassword ? "Resetting…" : "Reset Password"}
                </button>
              )}
              {tempPassword && (
                <div className={styles.resetBox}>
                  <p className={styles.resetHint}>Share this temporary password with {firstName}. It won&apos;t be shown again.</p>
                  <div className={styles.resetRow}>
                    <span className={styles.resetValue}>{tempPassword}</span>
                    <button className={styles.resetCopyBtn} title="Copy password" onClick={() => navigator.clipboard.writeText(tempPassword)} type="button">
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              )}
            </AccordionSection>
          </div>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}><Activity size={15} /> Recent Activity</h3>
            {recentActivity.length === 0 ? (
              <p className={styles.emptyText}>No recent activity recorded.</p>
            ) : (
              <div className={styles.timeline}>
                {recentActivity.map((item, i) => (
                  <div key={i} className={styles.timelineItem}>
                    <div className={styles.timelineDot} />
                    <div className={styles.timelineBody}>
                      <p className={styles.timelineTitle}>{item.action.charAt(0).toUpperCase() + item.action.slice(1)}d record</p>
                      <p className={styles.timelineSub}>by {item.userName} · {fmtActivityDate(item.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {activeTab === "subjects" && isTeaching && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Assigned Subjects</h3>
          {subjects.length === 0 ? (
            <p className={styles.emptyText}>No subjects assigned.</p>
          ) : (
            <div className={styles.assignmentList}>
              {subjects.map(s => (
                <div key={s.id} className={styles.assignmentCard}>
                  <div className={styles.assignmentIcon}><GraduationCap size={17} /></div>
                  <div className={styles.assignmentInfo}>
                    <p className={styles.assignmentName}>{s.name} <span className={styles.mono}>({s.code})</span></p>
                    <p className={styles.assignmentSub}>{s.className}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "documents" && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Documents</h3>
          {props.documents.length === 0 ? (
            <p className={styles.emptyText}>No documents uploaded yet.</p>
          ) : (
            <div className={styles.fileList}>
              {props.documents.map(doc => (
                <a key={doc.url} href={doc.url} target="_blank" rel="noreferrer" className={styles.fileItemLink}>
                  <Paperclip size={14} className={styles.fileItemIcon} />
                  <span className={styles.fileItemName}>{doc.name}</span>
                  <Download size={14} />
                </a>
              ))}
            </div>
          )}
        </section>
      )}

      {(activeTab === "timetable" || activeTab === "attendance" || activeTab === "classes" || activeTab === "audit") && (
        <PlaceholderTab tab={activeTab} />
      )}
    </div>
  );
}

function AccordionSection({
  id, label, open, onToggle, children,
}: { id: string; label: string; open: boolean; onToggle: (id: string) => void; children: React.ReactNode }) {
  return (
    <div className={styles.accordionItem}>
      <button type="button" className={styles.accordionBtn} onClick={() => onToggle(id)}>
        <span className={styles.accordionLabel}>{label}</span>
        <ChevronDown size={16} className={`${styles.accordionChevron} ${open ? styles.accordionChevronOpen : ""}`} />
      </button>
      {open && <div className={styles.accordionContent}>{children}</div>}
    </div>
  );
}

function FieldRow({ label, value, capitalize, accent }: { label: string; value: string; capitalize?: boolean; accent?: boolean }) {
  return (
    <div className={styles.fieldRowView}>
      <span className={styles.fieldRowLabel}>{label}</span>
      <span className={styles.fieldRowValue} style={{ textTransform: capitalize ? "capitalize" : undefined, color: accent ? "var(--clr-app-accent)" : undefined, fontWeight: accent ? 700 : undefined }}>
        {value}
      </span>
    </div>
  );
}

function PlaceholderTab({ tab }: { tab: string }) {
  const icons: Record<string, React.ReactNode> = {
    timetable: <Clock size={32} />,
    attendance: <Activity size={32} />,
    classes: <Users size={32} />,
    audit: <AlertCircle size={32} />,
  };
  const labels: Record<string, string> = {
    timetable: "Timetable",
    attendance: "Attendance Records",
    classes: "Class Assignments",
    audit: "Audit Log",
  };
  return (
    <div className={styles.placeholder}>
      {icons[tab]}
      <p className={styles.placeholderTitle}>{labels[tab] ?? tab}</p>
      <p className={styles.placeholderHint}>Coming soon</p>
    </div>
  );
}
