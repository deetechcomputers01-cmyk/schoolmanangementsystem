"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight, ChevronDown, Phone, Hash, GraduationCap,
  CheckCircle, MoreVertical, Download,
  Users, Clock, Activity, AlertCircle,
  AlertTriangle, Mail, Camera, UploadCloud, X, Paperclip,
  CalendarDays, Edit2, Copy,
} from "lucide-react";
import { DesktopFormModal } from "@/components/desktop/ui/DesktopFormModal/DesktopFormModal";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import styles from "./StaffDetailScreen.module.css";

const CATEGORY_OPTIONS = [
  { value: "teaching",  label: "Teaching" },
  { value: "accounts",  label: "Accounts" },
  { value: "driver",    label: "Driver" },
  { value: "caterer",   label: "Caterer" },
  { value: "nurse",     label: "Nurse" },
  { value: "security",  label: "Security" },
  { value: "admin",     label: "Admin" },
] as const;

export interface StaffDetailProps {
  id: string;
  staffNo: string;
  firstName: string;
  lastName: string;
  phone: string;
  roleTitle: string;
  email: string;
  photoUrl: string | null;
  documents: { name: string; url: string; type: string; size: number }[];
  notes: string;
  isTeaching: boolean;
  staffCategory: string;
  initials: string;
  joinedDate: string;
  yearsOfService: number;
  isActive: boolean;
  userRole: string;
  userEmail: string;
  subjects: { id: string; name: string; code: string; className: string }[];
  assignedClasses: { classId: string; className: string; subjects: string[] }[];
  salary: { basicSalary: number; allowances: number; deductions: number } | null;
  canSeePayroll: boolean;
  defaultTab: string;
  initialEditOpen?: boolean;
  isModal?: boolean;
  recentActivity: { action: string; userName: string; date: string }[];
  passwordResetPolicyDays: string;
  passwordAgeDays: number | null;
  passwordResetDue: boolean;
}

type Tab = "overview" | "timetable" | "attendance" | "classes" | "subjects" | "documents" | "audit";

const TEACHING_TABS: { key: Tab; label: string; badge?: number }[] = [
  { key: "overview",    label: "Overview" },
  { key: "timetable",  label: "Timetable" },
  { key: "attendance", label: "Attendance" },
  { key: "classes",    label: "Classes" },
  { key: "subjects",   label: "Subjects" },
  { key: "documents",  label: "Documents" },
  { key: "audit",      label: "Audit Log" },
];

const SUPPORT_TABS: { key: Tab; label: string; badge?: number }[] = [
  { key: "overview",    label: "Overview" },
  { key: "attendance", label: "Attendance" },
  { key: "documents",  label: "Documents" },
  { key: "audit",      label: "Audit Log" },
];

function fmtCurrency(n: number) {
  return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtActivityDate(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffH = diffMs / 3600000;
  if (diffH < 24) return `Today, ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  if (diffH < 48) return `Yesterday, ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function StaffDetailContent(props: StaffDetailProps) {
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

  const fullName = `${firstName} ${lastName}`;
  const netPay = salary ? salary.basicSalary + salary.allowances - salary.deductions : 0;

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

  // ── Accordion state (view mode) ──
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["personal"]));
  function toggleSection(key: string) {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

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
      router.refresh();
      if (isModal) {
        router.back();
      } else {
        setEditing(false);
      }
    } catch {
      setEditError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const editBody = (
    <div className={styles.editCenterCol}>
      <div className={styles.editIdentity}>
        <div className={styles.editPhotoWrap}>
          {photoPreview || props.photoUrl ? (
            <img src={photoPreview ?? props.photoUrl ?? ""} alt={fullName} className={styles.editPhotoCircle} />
          ) : (
            <div className={styles.editPhotoFallback}>{initials}</div>
          )}
          <button
            type="button"
            className={styles.editPhotoBtn}
            onClick={() => photoInputRef.current?.click()}
            aria-label="Change photo"
          >
            <Camera size={15} />
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={handlePhotoPick}
          />
        </div>
        <span className={styles.staffIdLabel}>Staff ID</span>
        <span className={styles.staffIdPill}>{staffNo}</span>
      </div>

      <div className={styles.drawerField}>
        <label className={styles.drawerLabel}>Update Documents</label>
        <div className={styles.dropzone} onClick={() => docInputRef.current?.click()}>
          <UploadCloud size={22} className={styles.dropzoneIcon} />
          <p className={styles.dropzoneText}>
            Drag files here or <span className={styles.dropzoneLink}>Browse Files</span>
          </p>
        </div>
        <input
          ref={docInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          style={{ display: "none" }}
          onChange={handleDocPick}
        />
      </div>

      {(keptDocuments.length > 0 || newDocFiles.length > 0) && (
        <div className={styles.drawerField}>
          <label className={styles.drawerLabel}>Uploaded Files</label>
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
        </div>
      )}

      <div className={styles.drawerGrid2Col}>
        <div className={styles.drawerField}>
          <label className={styles.drawerLabel}>First Name</label>
          <input
            className={styles.drawerInput}
            type="text"
            value={editForm.firstName}
            onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))}
          />
        </div>
        <div className={styles.drawerField}>
          <label className={styles.drawerLabel}>Last Name</label>
          <input
            className={styles.drawerInput}
            type="text"
            value={editForm.lastName}
            onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))}
          />
        </div>
      </div>

      <div className={styles.drawerGrid2Col}>
        <div className={styles.drawerField}>
          <label className={styles.drawerLabel}>Role Category</label>
          <select
            className={styles.drawerSelect}
            value={editForm.staffCategory}
            onChange={e => setEditForm(f => ({ ...f, staffCategory: e.target.value }))}
          >
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.drawerField}>
          <label className={styles.drawerLabel}>Role Title</label>
          <input
            className={styles.drawerInput}
            type="text"
            value={editForm.roleTitle}
            onChange={e => setEditForm(f => ({ ...f, roleTitle: e.target.value }))}
          />
        </div>
      </div>

      {categoryChanged && isTeaching && !willBeTeaching && (
        <div className={styles.dangerZone}>
          <AlertTriangle size={16} style={{ color: "#cb4d5b", flexShrink: 0 }} />
          <p className={styles.dangerSub} style={{ color: "#cb4d5b" }}>
            Changing away from Teaching will remove this staff member from all class and subject assignments.
          </p>
        </div>
      )}

      <div className={styles.drawerField}>
        <label className={styles.drawerLabel}>Phone Number</label>
        <div className={styles.iconInputWrap}>
          <Phone size={15} className={styles.iconInputIcon} />
          <input
            className={styles.iconInput}
            type="text"
            value={editForm.phone}
            onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
          />
        </div>
      </div>

      <div className={styles.drawerField}>
        <label className={styles.drawerLabel}>Email Address</label>
        <div className={styles.iconInputWrap}>
          <Mail size={15} className={styles.iconInputIcon} />
          <input
            className={styles.iconInput}
            type="email"
            value={editForm.email}
            onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
          />
        </div>
      </div>

      <div className={styles.drawerField}>
        <label className={styles.drawerLabel}>Institutional Notes</label>
        <textarea
          className={styles.drawerTextarea}
          rows={3}
          placeholder="Notes visible to administrators only..."
          value={editForm.notes}
          onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
        />
      </div>

      {editError && <p className={styles.dangerSub} style={{ color: "#cb4d5b" }}>{editError}</p>}
    </div>
  );

  const editFooter = (
    <>
      <button className={styles.drawerCancelBtn} onClick={closeEdit} disabled={saving} type="button">Cancel</button>
      <button className={styles.drawerSaveBtn} onClick={handleSaveStaff} disabled={saving} type="button">
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </>
  );

  if (editing) {
    return (
      <DesktopFormModal
        open
        inline={!!isModal}
        title="Edit Staff Profile"
        eyebrow={isModal ? undefined : "Staff Directory"}
        width={640}
        canClose={!saving}
        onClose={closeEdit}
        footer={editFooter}
      >
        {editBody}
      </DesktopFormModal>
    );
  }

  return (
    <div className={styles.root}>
      {/* ── Breadcrumb ── */}
      <div className={styles.breadcrumb}>
        <Link href="/staff" className={styles.breadcrumbLink}>Staff</Link>
        <ChevronRight size={14} />
        <span className={styles.breadcrumbCurrent}>{fullName}</span>
      </div>

      {/* ── Profile header ── */}
      <div className={styles.profileCard}>
        <div className={styles.profileLeft}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>{initials}</div>
            <div className={`${styles.statusDot} ${isActive ? styles.statusDotActive : styles.statusDotInactive}`} />
          </div>
          <div className={styles.profileInfo}>
            <div className={styles.profileTitleRow}>
              <h2 className={styles.profileName}>{fullName}</h2>
              <span className={isActive ? styles.badgeActive : styles.badgeInactive}>
                <CheckCircle size={13} />
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className={styles.profileMeta}>
              <span className={styles.profileMetaItem}><Hash size={14} />Staff No. {staffNo}</span>
              <span className={styles.profileMetaItem}><GraduationCap size={14} />{roleTitle}</span>
              <span className={styles.profileMetaItem}><CalendarDays size={14} />Joined {joinedDate}</span>
            </div>
          </div>
        </div>
        <div className={styles.profileActions}>
          {isTeaching && <button className={`${styles.btnOutline} ${styles.headerActionUnwired}`}>View Timetable</button>}
          <button className={styles.btnPrimary} onClick={openEdit} type="button">
            <Edit2 size={14} style={{ marginRight: 6 }} />Edit Profile
          </button>
          <button className={`${styles.btnIcon} ${styles.headerActionUnwired}`}>
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabNav}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          {/* ── KPI row ── */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Years of Service</p>
              <p className={styles.kpiValue}>{yearsOfService}</p>
            </div>
            <div className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Classes Assigned</p>
              <p className={styles.kpiValue}>{assignedClasses.length}</p>
            </div>
            <div className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Subjects Taught</p>
              <p className={styles.kpiValue}>{subjects.length}</p>
            </div>
            <div className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Leave Days Left</p>
              <p className={styles.kpiValue} style={{ color: "var(--clr-app-muted)" }}>—</p>
            </div>
            <div className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Attendance Rate</p>
              <p className={styles.kpiValue} style={{ color: "var(--clr-app-muted)" }}>—</p>
            </div>
          </div>

          {/* ── Two-column workspace ── */}
          <div className={styles.bentoGrid}>
            {/* Left: Profile Details accordion */}
            <aside className={styles.colLeft}>
              <div className={styles.accordionCard}>
                <div className={styles.accordionHead}>Profile Details</div>
                <div className={styles.accordionList}>
                  <AccordionSection
                    id="personal"
                    label="Personal Details"
                    open={openSections.has("personal")}
                    onToggle={toggleSection}
                  >
                    <FieldRow label="First Name" value={firstName} />
                    <FieldRow label="Last Name" value={lastName} />
                    <FieldRow label="Phone" value={phone} />
                    <FieldRow label="Email" value={userEmail} />
                  </AccordionSection>

                  <AccordionSection
                    id="employment"
                    label="Employment"
                    open={openSections.has("employment")}
                    onToggle={toggleSection}
                  >
                    <FieldRow label="Role Title" value={roleTitle} />
                    <FieldRow label="Category" value={staffCategory} capitalize />
                    <FieldRow label="Date Joined" value={joinedDate} />
                    <FieldRow label="Teaching" value={isTeaching ? "Yes" : "No"} />
                    <FieldRow label="Contract" value="Permanent, Full-Time" />
                  </AccordionSection>

                  {canSeePayroll && salary && (
                    <AccordionSection
                      id="salary"
                      label="Salary Summary"
                      open={openSections.has("salary")}
                      onToggle={toggleSection}
                    >
                      <FieldRow label="Basic Salary" value={fmtCurrency(salary.basicSalary)} />
                      <FieldRow label="Allowances" value={fmtCurrency(salary.allowances)} />
                      <FieldRow label="Deductions" value={`-${fmtCurrency(salary.deductions)}`} />
                      <FieldRow label="Net Pay" value={fmtCurrency(netPay)} accent />
                    </AccordionSection>
                  )}

                  <AccordionSection
                    id="leave"
                    label="Leave Balance"
                    open={openSections.has("leave")}
                    onToggle={toggleSection}
                  >
                    <p className={styles.emptyHint} style={{ padding: 0 }}>No leave records on file.</p>
                  </AccordionSection>

                  <AccordionSection
                    id="access"
                    label="System Access"
                    open={openSections.has("access")}
                    onToggle={toggleSection}
                  >
                    <FieldRow label="Role" value={userRole.replace("_", " ")} capitalize />
                    <FieldRow label="Last Login" value="Today" />
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
                      <p className={styles.emptyHint}>No login account exists for this staff member.</p>
                    ) : (
                      <button
                        className={styles.btnFullOutline}
                        style={{ marginTop: 4 }}
                        disabled={resettingPassword}
                        onClick={handleResetPassword}
                      >
                        {resettingPassword ? "Resetting…" : "Reset Password"}
                      </button>
                    )}
                    {tempPassword && (
                      <div className={styles.resetPasswordBox}>
                        <p className={styles.resetPasswordHint}>
                          Share this temporary password with {firstName}. It won&apos;t be shown again.
                        </p>
                        <div className={styles.resetPasswordRow}>
                          <span className={styles.resetPasswordValue}>{tempPassword}</span>
                          <button
                            className={styles.resetPasswordCopyBtn}
                            title="Copy password"
                            onClick={() => navigator.clipboard.writeText(tempPassword)}
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </AccordionSection>

                  <AccordionSection
                    id="documents"
                    label="Documents"
                    badge={props.documents.length || undefined}
                    open={openSections.has("documents")}
                    onToggle={toggleSection}
                  >
                    {props.documents.length === 0 ? (
                      <p className={styles.emptyHint} style={{ padding: 0 }}>No documents uploaded yet.</p>
                    ) : (
                      <div className={styles.docList}>
                        {props.documents.map(doc => (
                          <a key={doc.url} href={doc.url} target="_blank" rel="noreferrer" className={styles.docItem}>
                            <div className={styles.docLeft}>
                              <Paperclip size={16} className={styles.docIcon} />
                              <span className={styles.docName}>{doc.name}</span>
                            </div>
                            <Download size={15} className={styles.docDownload} style={{ opacity: 1 }} />
                          </a>
                        ))}
                      </div>
                    )}
                  </AccordionSection>
                </div>
              </div>
            </aside>

            {/* Right: Current Assignment + Recent Activity */}
            <main className={styles.colCenter}>
              {isTeaching && (
                <section className={styles.infoCard}>
                  <div className={styles.cardHeaderRow}>
                    <h3 className={styles.cardTitle} style={{ margin: 0, padding: 0, border: 0 }}>Current Assignment</h3>
                    <button className={styles.cardLink}>Manage</button>
                  </div>
                  {assignedClasses.length === 0 ? (
                    <p className={styles.emptyHint}>No classes assigned.</p>
                  ) : (
                    <div className={styles.classCardGrid}>
                      {assignedClasses.map(c => (
                        <div key={c.classId} className={styles.classCard}>
                          <div className={styles.classCardTop}>
                            <div>
                              <p className={styles.classCardLabel}>Class</p>
                              <h4 className={styles.classCardName}>{c.className}</h4>
                            </div>
                            <div className={styles.classCardIcon}><Users size={16} /></div>
                          </div>
                          <p className={styles.classCardSubjects}>{c.subjects.join(", ")}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              <section className={styles.infoCard}>
                <div className={styles.cardHeaderRow}>
                  <h3 className={styles.cardTitle} style={{ margin: 0, padding: 0, border: 0 }}>Recent Activity</h3>
                </div>
                {recentActivity.length === 0 ? (
                  <p className={styles.emptyHint}>No recent activity recorded.</p>
                ) : (
                  <div className={styles.timeline}>
                    {recentActivity.map((item, i) => (
                      <div key={i} className={styles.timelineItem}>
                        <div className={styles.timelineDot}><Activity size={13} /></div>
                        <div>
                          <div className={styles.timelineTopRow}>
                            <p className={styles.timelineTitle}>{item.action.charAt(0).toUpperCase() + item.action.slice(1)}d record</p>
                            <span className={styles.timelineTime}>{fmtActivityDate(item.date)}</span>
                          </div>
                          <p className={styles.timelineSub}>by {item.userName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </main>
          </div>
        </>
      )}

      {activeTab === "subjects" && isTeaching && (
        <SubjectsTab subjects={subjects} />
      )}

      {activeTab === "documents" && (
        <DocumentsTab documents={props.documents} />
      )}

      {(activeTab === "timetable" || activeTab === "attendance" || activeTab === "classes" || activeTab === "audit") && (
        <PlaceholderTab tab={activeTab} />
      )}
    </div>
  );
}

/* ── Accordion primitives ─────────────────────────────────────────── */
function AccordionSection({
  id, label, badge, open, onToggle, children,
}: {
  id: string; label: string; badge?: number; open: boolean;
  onToggle: (id: string) => void; children: React.ReactNode;
}) {
  return (
    <div className={styles.accordionItem}>
      <button type="button" className={styles.accordionBtn} onClick={() => onToggle(id)}>
        <span className={`${styles.accordionLabel} ${open ? styles.accordionLabelActive : ""}`}>
          {label}
          {badge !== undefined && <span className={styles.tabBadge}>{badge}</span>}
        </span>
        <ChevronDown size={16} className={`${styles.accordionChevron} ${open ? styles.accordionChevronOpen : ""}`} />
      </button>
      {open && <div className={styles.accordionContent}>{children}</div>}
    </div>
  );
}

function FieldRow({ label, value, capitalize, accent }: { label: string; value: string; capitalize?: boolean; accent?: boolean }) {
  return (
    <div className={styles.fieldRow}>
      <label className={styles.drawerLabel}>{label}</label>
      <p className={styles.fieldRowValue} style={{ textTransform: capitalize ? "capitalize" : undefined, color: accent ? "var(--clr-app-accent)" : undefined, fontWeight: accent ? 700 : undefined }}>
        {value}
      </p>
    </div>
  );
}

/* ── Subjects tab ─────────────────────────────────────────────────── */
function SubjectsTab({ subjects }: { subjects: { id: string; name: string; code: string; className: string }[] }) {
  return (
    <div className={styles.infoCard}>
      <h3 className={styles.cardTitle}>Assigned Subjects</h3>
      {subjects.length === 0 ? (
        <p className={styles.emptyHint}>No subjects assigned.</p>
      ) : (
        <table className={styles.subjectTable}>
          <thead className={styles.subjectThead}>
            <tr>
              <th className={styles.subjectTh}>Subject</th>
              <th className={styles.subjectTh}>Code</th>
              <th className={styles.subjectTh}>Class</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map(s => (
              <tr key={s.id} className={styles.subjectTr}>
                <td className={`${styles.subjectTd} ${styles.subjectTdBold}`}>{s.name}</td>
                <td className={`${styles.subjectTd} ${styles.subjectTdMono}`}>{s.code}</td>
                <td className={styles.subjectTd}>{s.className}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ── Documents tab ────────────────────────────────────────────────── */
function DocumentsTab({ documents }: { documents: { name: string; url: string; type: string; size: number }[] }) {
  return (
    <div className={styles.infoCard}>
      <div className={styles.cardHeaderRow}>
        <h3 className={styles.cardTitle} style={{ margin: 0, padding: 0, border: 0 }}>Documents</h3>
      </div>
      {documents.length === 0 ? (
        <p style={{ fontSize: "var(--text-xs)", color: "var(--clr-app-muted)", marginTop: 8 }}>No documents uploaded yet.</p>
      ) : (
        <div className={styles.docList}>
          {documents.map(doc => (
            <a key={doc.url} href={doc.url} target="_blank" rel="noreferrer" className={styles.docItem}>
              <div className={styles.docLeft}>
                <Paperclip size={16} className={styles.docIcon} />
                <span className={styles.docName}>{doc.name}</span>
              </div>
              <Download size={15} className={styles.docDownload} style={{ opacity: 1 }} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Placeholder tab ──────────────────────────────────────────────── */
function PlaceholderTab({ tab }: { tab: string }) {
  const icons: Record<string, React.ReactNode> = {
    timetable:  <Clock size={40} />,
    attendance: <Activity size={40} />,
    classes:    <Users size={40} />,
    audit:      <AlertCircle size={40} />,
  };
  const labels: Record<string, string> = {
    timetable:  "Timetable",
    attendance: "Attendance Records",
    classes:    "Class Assignments",
    audit:      "Audit Log",
  };
  return (
    <div className={styles.placeholderTab}>
      <div className={styles.placeholderIcon}>{icons[tab]}</div>
      <p className={styles.placeholderTitle}>{labels[tab] ?? tab}</p>
      <p className={styles.placeholderHint}>Coming soon</p>
    </div>
  );
}
