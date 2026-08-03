"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Edit2, CalendarDays, CreditCard, MoreVertical, ArrowRight, ChevronDown,
  X, Stethoscope, UserRound, UsersRound,
  CheckCircle, FileText, DollarSign, Phone, Mail,
  Plus, Key, Copy, Trash2, Upload, File, FileImage, FileSpreadsheet, Paperclip,
  Camera, GraduationCap, Award,
} from "lucide-react";
import { DesktopFormModal } from "@/components/desktop/ui/DesktopFormModal/DesktopFormModal";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import { gradeFromScore, type GradeBand } from "@backend/utils";
import styles from "./StudentDetailScreen.module.css";

export type StudentProps = {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  classId: string;
  className: string;
  house: string | null;
  photoUrl: string | null;
  gender: string;
  dateOfBirth: string;
  address: string;
  admissionDate: string;
  guardians: { id: string; name: string; relation: string; phone: string; email: string | null; hasLogin: boolean }[];
  canManageGuardians: boolean;
  attendancePct: number;
  avgGrade: number | null;
  outstandingBalance: number;
  recentInvoice: {
    id: string; description: string; invoiceRef: string; amount: number; status: string;
    discountApplied: number;
    scholarship: { type: "percent" | "fixed"; value: number; reason: string | null } | null;
  } | null;
  recentActivity: { type: "attendance" | "grade" | "fee"; label: string; date: string }[];
  grades: { subject: string; score: number; term: string }[];
  gradingScale: GradeBand[];
  minAttendanceRate: number;
  attendanceRecords: { status: string; date: string; note: string | null }[];
  feeRecords: {
    id: string; description: string; term: string; amountDue: number; amountPaid: number; status: string;
    discountApplied: number;
    scholarship: { type: "percent" | "fixed"; value: number; reason: string | null } | null;
  }[];
  health: { bloodGroup: string | null; allergies: string | null; conditions: string | null } | null;
  canEdit: boolean;
  initialEditOpen?: boolean;
  isModal?: boolean;
};

type Tab = "overview" | "academics" | "attendance" | "financials";

function fmtActivityDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function scholarshipLabel(scholarship: { type: "percent" | "fixed"; value: number; reason: string | null } | null, discountApplied: number) {
  if (!scholarship || discountApplied <= 0) return null;
  const off = scholarship.type === "percent"
    ? `${scholarship.value}% off`
    : `GHS ${scholarship.value.toLocaleString()} off`;
  return scholarship.reason ? `${off} · ${scholarship.reason}` : off;
}

export function StudentDetailContent(props: StudentProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const studentFeesHref = `/fees?studentId=${props.id}`;
  const recentInvoiceHref = props.recentInvoice
    ? `/fees?studentId=${props.id}&feeRecordId=${props.recentInvoice.id}`
    : studentFeesHref;
  const recentPaymentHref = props.recentInvoice
    ? `${recentInvoiceHref}&recordPayment=1`
    : `${studentFeesHref}&recordPayment=1`;
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(!!props.initialEditOpen);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [firstName, setFirstName] = useState(props.firstName);
  const [lastName, setLastName] = useState(props.lastName);
  const [editGender, setEditGender] = useState(props.gender);
  const [editDob, setEditDob] = useState(props.dateOfBirth.slice(0, 10));
  const [editAddress, setEditAddress] = useState(props.address);
  const [editClassId, setEditClassId] = useState(props.classId);
  const [editClasses, setEditClasses] = useState<{ id: string; name: string }[]>([]);
  const primaryGuardian = props.guardians[0] ?? null;
  const [editGuardianName, setEditGuardianName] = useState(primaryGuardian?.name ?? "");
  const [editGuardianRelation, setEditGuardianRelation] = useState(primaryGuardian?.relation ?? "");
  const [editGuardianPhone, setEditGuardianPhone] = useState(primaryGuardian?.phone ?? "");
  const [editGuardianEmail, setEditGuardianEmail] = useState(primaryGuardian?.email ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [medNotes, setMedNotes] = useState(
    [props.health?.conditions, props.health?.allergies].filter(Boolean).join("; ") ?? ""
  );

  // Accordion state (view mode)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["personal"]));
  function toggleSection(key: string) {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  // Guardian modal state
  const [gOpen,        setGOpen]        = useState(false);
  const [gStep,        setGStep]        = useState<"form" | "created">("form");
  const [gName,        setGName]        = useState("");
  const [gRelation,    setGRelation]    = useState("Father");
  const [gPhone,       setGPhone]       = useState("");
  const [gEmail,       setGEmail]       = useState("");
  const [gCreateLogin, setGCreateLogin] = useState(false);
  const [gSaving,      setGSaving]      = useState(false);
  const [gError,       setGError]       = useState("");
  const [gCreds,       setGCreds]       = useState<{ email: string; password: string } | null>(null);
  const [gDeleting,    setGDeleting]    = useState<string | null>(null);

  useEffect(() => {
    if (!editing) return;
    fetch("/api/classes")
      .then(r => r.json())
      .then(d => setEditClasses(Array.isArray(d) ? d : (d.classes ?? [])))
      .catch(() => {});
  }, [editing]);

  // Document state — queued for upload, submitted with the next Save (see handleSave)
  const docInputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<{ name: string; size: number; type: string; addedAt: Date; file: File }[]>([]);

  function handleDocFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newDocs = files.map(f => ({ name: f.name, size: f.size, type: f.type, addedAt: new Date(), file: f }));
    setDocs(prev => [...newDocs, ...prev]);
    showToast(`${files.length} document${files.length !== 1 ? "s" : ""} queued — click Save to upload`);
    e.target.value = "";
  }

  function removeDoc(index: number) {
    setDocs(prev => prev.filter((_, i) => i !== index));
  }

  function docIcon(type: string) {
    if (type.startsWith("image/")) return <FileImage size={16} />;
    if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv")) return <FileSpreadsheet size={16} />;
    if (type.includes("pdf") || type.includes("word") || type.includes("text")) return <FileText size={16} />;
    return <File size={16} />;
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function openGuardianModal() {
    setGName(""); setGRelation("Father"); setGPhone(""); setGEmail("");
    setGCreateLogin(false); setGError(""); setGCreds(null); setGStep("form");
    setGOpen(true);
  }

  async function deleteGuardian(guardianId: string) {
    if (!(await confirm({ message: "Remove this guardian from the student's record?", confirmLabel: "Remove" }))) return;
    setGDeleting(guardianId);
    try {
      await fetch(`/api/students/${props.id}/guardians/${guardianId}`, { method: "DELETE" });
      router.refresh();
    } finally { setGDeleting(null); }
  }

  async function submitGuardian() {
    if (!gName.trim() || !gPhone.trim()) { setGError("Name and phone are required."); return; }
    if (gCreateLogin && !gEmail.trim())  { setGError("Email is required to create a login."); return; }
    setGSaving(true); setGError("");
    try {
      const res = await fetch(`/api/students/${props.id}/guardians`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: gName.trim(), relation: gRelation, phone: gPhone.trim(), email: gEmail.trim() || undefined, createLogin: gCreateLogin }),
      });
      const data = await res.json();
      if (!res.ok) { setGError(data.error ?? "Failed to save."); return; }
      if (data.tempPassword) {
        setGCreds({ email: gEmail.trim(), password: data.tempPassword });
        setGStep("created");
      } else {
        setGOpen(false);
        router.refresh();
      }
    } catch { setGError("Network error. Please try again."); }
    finally { setGSaving(false); }
  }

  const fullName = `${props.firstName} ${props.lastName}`;
  const initials = `${props.firstName[0] ?? ""}${props.lastName[0] ?? ""}`.toUpperCase();
  const dob = new Date(props.dateOfBirth);
  const age = Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25));

  function openEdit() {
    setFirstName(props.firstName);
    setLastName(props.lastName);
    setEditGender(props.gender);
    setEditDob(props.dateOfBirth.slice(0, 10));
    setEditAddress(props.address);
    setEditClassId(props.classId);
    setEditGuardianName(primaryGuardian?.name ?? "");
    setEditGuardianRelation(primaryGuardian?.relation ?? "");
    setEditGuardianPhone(primaryGuardian?.phone ?? "");
    setEditGuardianEmail(primaryGuardian?.email ?? "");
    setPhotoFile(null);
    setPhotoPreview(null);
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

  async function handleSave() {
    setSaving(true);
    setEditError("");
    try {
      const fd = new FormData();
      fd.append("firstName", firstName);
      fd.append("lastName", lastName);
      fd.append("gender", editGender);
      fd.append("dateOfBirth", editDob);
      fd.append("address", editAddress);
      if (editClassId) fd.append("classId", editClassId);
      if (photoFile) fd.append("photo", photoFile);
      docs.forEach((d) => fd.append("documents", d.file));

      const res = await fetch(`/api/students/${props.id}`, { method: "PATCH", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setEditError(data?.message ?? "Failed to save. Please check the details and try again.");
        return;
      }

      if (primaryGuardian && (
        editGuardianName !== primaryGuardian.name ||
        editGuardianRelation !== primaryGuardian.relation ||
        editGuardianPhone !== primaryGuardian.phone ||
        editGuardianEmail !== (primaryGuardian.email ?? "")
      )) {
        const gRes = await fetch(`/api/students/${props.id}/guardians/${primaryGuardian.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editGuardianName,
            relation: editGuardianRelation,
            phone: editGuardianPhone,
            email: editGuardianEmail,
          }),
        });
        if (!gRes.ok) {
          const data = await gRes.json().catch(() => ({}));
          setEditError(data?.error ?? "Student details saved, but the guardian update failed. Please try again.");
          return;
        }
      }

      setDocs([]);
      router.refresh();
      if (props.isModal) {
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
        <div className={styles.editPhotoWrap} style={{ margin: 0 }}>
          {photoPreview || props.photoUrl ? (
            <img src={photoPreview ?? props.photoUrl ?? ""} alt={fullName} className={styles.editPhotoSquare} />
          ) : (
            <div className={styles.editPhotoFallbackSquare}>{initials}</div>
          )}
          <button
            type="button"
            className={styles.editPhotoBtnSquare}
            onClick={() => photoInputRef.current?.click()}
            aria-label="Change photo"
          >
            <Camera size={15} />
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png"
            style={{ display: "none" }}
            onChange={handlePhotoPick}
          />
        </div>
        <p className={styles.photoCaption} style={{ textAlign: "center", maxWidth: "none" }}>
          Upload a high-resolution JPG or PNG. Max size 2MB.
        </p>
        <span className={styles.staffIdLabel}>Admission No.</span>
        <span className={styles.staffIdPill}>{props.admissionNo}</span>
      </div>

      <div className={styles.drawerSection}>
        <h3 className={styles.drawerSectionTitleIcon}><UserRound size={16} /> Personal Information</h3>
        <div className={styles.drawerGrid2Col}>
          <div className={styles.drawerField}>
            <label className={styles.drawerLabel}>First Name</label>
            <input className={styles.drawerInput} type="text" value={firstName} onChange={e => setFirstName(e.target.value)} />
          </div>
          <div className={styles.drawerField}>
            <label className={styles.drawerLabel}>Last Name</label>
            <input className={styles.drawerInput} type="text" value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>
        </div>
        <div className={styles.drawerGrid2Col}>
          <div className={styles.drawerField}>
            <label className={styles.drawerLabel}>Gender</label>
            <select className={styles.drawerSelect} value={editGender} onChange={e => setEditGender(e.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div className={styles.drawerField}>
            <label className={styles.drawerLabel}>Date of Birth</label>
            <input className={styles.drawerInput} type="date" value={editDob} onChange={e => setEditDob(e.target.value)} />
          </div>
        </div>
        <div className={styles.drawerField}>
          <label className={styles.drawerLabel}>Residential Address</label>
          <input className={styles.drawerInput} type="text" value={editAddress} onChange={e => setEditAddress(e.target.value)} />
        </div>
      </div>

      <div className={styles.drawerSection}>
        <h3 className={styles.drawerSectionTitleIcon}><GraduationCap size={16} /> Academic Details</h3>
        <div className={styles.drawerGrid2Col}>
          <div className={styles.drawerField}>
            <label className={styles.drawerLabel}>Class</label>
            <select className={styles.drawerSelect} value={editClassId} onChange={e => setEditClassId(e.target.value)}>
              {editClasses.length > 0
                ? editClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                : <option value={props.classId}>{props.className}</option>}
            </select>
          </div>
          <div className={styles.drawerField}>
            <label className={styles.drawerLabel}>Admission Date</label>
            <input
              className={styles.drawerInput}
              value={new Date(props.admissionDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              disabled
              readOnly
            />
          </div>
        </div>
      </div>

      <div className={styles.drawerSection}>
        <h3 className={styles.drawerSectionTitleIcon}><UsersRound size={16} /> Guardian Information</h3>
        {primaryGuardian ? (
          <>
            <div className={styles.drawerGrid2Col}>
              <div className={styles.drawerField}>
                <label className={styles.drawerLabel}>Guardian Name</label>
                <input className={styles.drawerInput} type="text" value={editGuardianName} onChange={e => setEditGuardianName(e.target.value)} />
              </div>
              <div className={styles.drawerField}>
                <label className={styles.drawerLabel}>Relationship</label>
                <input className={styles.drawerInput} type="text" value={editGuardianRelation} onChange={e => setEditGuardianRelation(e.target.value)} />
              </div>
            </div>
            <div className={styles.drawerGrid2Col}>
              <div className={styles.drawerField}>
                <label className={styles.drawerLabel}>Phone Number</label>
                <input className={styles.drawerInput} type="text" value={editGuardianPhone} onChange={e => setEditGuardianPhone(e.target.value)} />
              </div>
              <div className={styles.drawerField}>
                <label className={styles.drawerLabel}>Email Address</label>
                <input className={styles.drawerInput} type="email" value={editGuardianEmail} onChange={e => setEditGuardianEmail(e.target.value)} />
              </div>
            </div>
          </>
        ) : (
          <p className={styles.emptyText}>No guardian on record. Add one from the profile once saved.</p>
        )}
      </div>

      <div className={styles.drawerSection}>
        <h3 className={styles.drawerSectionTitleIcon}><Stethoscope size={16} /> Medical Alerts</h3>
        <div className={styles.drawerField}>
          <label className={styles.drawerLabel}>Notes</label>
          <textarea
            className={styles.drawerTextarea}
            rows={3}
            placeholder="Allergies, medications, special requirements..."
            value={medNotes}
            onChange={e => setMedNotes(e.target.value)}
          />
        </div>
      </div>

      {editError && <p className={styles.dangerSub} style={{ color: "#cb4d5b" }}>{editError}</p>}
    </div>
  );

  const editFooter = (
    <>
      <button className={styles.drawerCancelBtn} onClick={closeEdit} disabled={saving}>Cancel</button>
      <button className={styles.drawerSaveBtn} onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </>
  );

  function closeGuardianModal() {
    if (gSaving) return;
    setGOpen(false);
    if (gStep === "created") router.refresh();
  }

  const guardianFooter = gStep === "form" ? (
    <>
      <button className={styles.drawerCancelBtn} onClick={() => setGOpen(false)} disabled={gSaving}>Cancel</button>
      <button className={styles.drawerSaveBtn} onClick={submitGuardian} disabled={gSaving}>
        {gSaving ? "Saving…" : "Save Guardian"}
      </button>
    </>
  ) : (
    <button className={styles.drawerSaveBtn} onClick={() => { setGOpen(false); router.refresh(); }}>Done</button>
  );

  const guardianBody = (
    <>
      {gStep === "form" && (
        <div className={styles.drawerSection} style={{ marginTop: 0 }}>
          <div className={styles.drawerGrid2Col}>
            <div className={styles.drawerField}>
              <label className={styles.drawerLabel}>Full Name *</label>
              <input className={styles.drawerInput} value={gName} onChange={e => setGName(e.target.value)} placeholder="e.g. Kofi Mensah" />
            </div>
            <div className={styles.drawerField}>
              <label className={styles.drawerLabel}>Relation *</label>
              <select className={styles.drawerSelect} value={gRelation} onChange={e => setGRelation(e.target.value)}>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
                <option value="Uncle">Uncle</option>
                <option value="Aunt">Aunt</option>
                <option value="Sibling">Sibling</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className={styles.drawerField}>
            <label className={styles.drawerLabel}>Phone Number *</label>
            <input className={styles.drawerInput} value={gPhone} onChange={e => setGPhone(e.target.value)} placeholder="e.g. 0244000000" />
          </div>
          <div className={styles.drawerField}>
            <label className={styles.drawerLabel}>Email Address</label>
            <input className={styles.drawerInput} type="email" value={gEmail} onChange={e => setGEmail(e.target.value)} placeholder="optional" />
          </div>
          <label className={styles.gModalCheckRow}>
            <input type="checkbox" checked={gCreateLogin} onChange={e => setGCreateLogin(e.target.checked)} />
            <div>
              <span className={styles.gModalCheckLabel}>Create parent portal login</span>
              <span className={styles.gModalCheckSub}>Guardian will receive a one-time password to access the parent portal. Email is required.</span>
            </div>
          </label>
          {gCreateLogin && (
            <p className={styles.gModalNotice}>A temporary password will be shown once after saving. Make sure to copy it before closing.</p>
          )}
          {gError && <p className={styles.dangerSub} style={{ color: "#cb4d5b" }}>{gError}</p>}
        </div>
      )}

      {gStep === "created" && gCreds && (
        <div className={styles.drawerSection} style={{ marginTop: 0 }}>
          <p className={styles.gModalSuccess}>Guardian profile created with portal login.</p>
          <p className={styles.gModalCheckSub} style={{ marginBottom: 4 }}>Share these credentials with the guardian. They can change the password after first login.</p>
          <div className={styles.gCredBox}>
            <div className={styles.gCredRow}>
              <span className={styles.gCredLabel}>Email</span>
              <span className={styles.gCredValue}>{gCreds.email}</span>
              <button className={styles.gCopyBtn} onClick={() => navigator.clipboard.writeText(gCreds!.email)} title="Copy email"><Copy size={13} /></button>
            </div>
            <div className={styles.gCredRow}>
              <span className={styles.gCredLabel}>Password</span>
              <span className={styles.gCredValue}>{gCreds.password}</span>
              <button className={styles.gCopyBtn} onClick={() => navigator.clipboard.writeText(gCreds!.password)} title="Copy password"><Copy size={13} /></button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (editing) {
    return (
      <DesktopFormModal
        open
        inline={!!props.isModal}
        title="Edit Student Profile"
        eyebrow={props.isModal ? undefined : "Student Directory"}
        width={640}
        canClose={!saving}
        onClose={closeEdit}
        footer={editFooter}
      >
        {editBody}
      </DesktopFormModal>
    );
  }

  if (gOpen && props.isModal) {
    return (
      <DesktopFormModal
        open
        inline
        title={gStep === "form" ? "Add Guardian" : "Guardian Created"}
        width={560}
        canClose={!gSaving}
        onClose={closeGuardianModal}
        footer={guardianFooter}
      >
        {guardianBody}
      </DesktopFormModal>
    );
  }

  return (
    <div className={styles.root}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/students" className={styles.breadcrumbLink}>Students</Link>
        <span className={styles.breadcrumbSep}>›</span>
        <span className={styles.breadcrumbCurrent}>{fullName}</span>
      </nav>

      {/* Header card */}
      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <div className={styles.photoWrapper}>
            {props.photoUrl ? (
              <img src={props.photoUrl} alt={fullName} className={styles.photo} />
            ) : (
              <div className={styles.photoFallback}>{initials}</div>
            )}
          </div>
          <div>
            <div className={styles.headerNameRow}>
              <h1 className={styles.headerName}>{fullName}</h1>
              <span className={styles.activeBadge}>Active</span>
            </div>
            <div className={styles.headerMeta}>
              <span className={styles.metaItem}>
                <span className={styles.metaIcon}>ID</span> {props.admissionNo}
              </span>
              <span className={styles.metaDot} />
              <span className={styles.metaItem}>
                <span className={styles.metaIcon}>Class</span> {props.className}
              </span>
              {props.house && (
                <>
                  <span className={styles.metaDot} />
                  <span className={styles.metaItem}>
                    <span className={styles.metaIcon}>House</span> {props.house}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          {props.canEdit && (
            <button className={styles.actionOutlineBtn} onClick={openEdit}>
              <Edit2 size={16} /> Edit Profile
            </button>
          )}
          <button className={styles.actionOutlineBtn}>
              <CalendarDays size={16} /> Record Attendance
          </button>
          <Link className={styles.actionPrimaryBtn} href={recentPaymentHref}>
            <CreditCard size={16} /> Record Payment
          </Link>
          <span className={styles.actionDivider} aria-hidden />
          <button className={styles.actionIconBtn} title="More options">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabBar}>
        {(["overview", "academics", "attendance", "financials"] as Tab[]).map(t => (
          <button
            key={t}
            className={`${styles.tabBtn} ${tab === t ? styles.tabBtnActive : ""}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          {/* KPI cards */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <CalendarDays size={22} className={styles.kpiIconGreen} />
              <div className={styles.kpiCopy}>
                <span className={styles.kpiLabel}>Attendance YTD</span>
                <span className={styles.kpiValue}>{props.attendancePct}%</span>
              </div>
            </div>
            <div className={styles.kpiCard}>
              <FileText size={22} className={styles.kpiIconPrimary} />
              <div className={styles.kpiCopy}>
                <span className={styles.kpiLabel}>Avg. Grade</span>
                <span className={styles.kpiValue}>
                  {props.avgGrade !== null ? `${props.avgGrade}%` : "—"}
                </span>
              </div>
            </div>
            <div className={`${styles.kpiCard} ${props.outstandingBalance > 0 ? styles.kpiCardError : ""}`}>
              <DollarSign size={22} className={props.outstandingBalance > 0 ? styles.kpiIconError : styles.kpiIconPrimary} />
              <div className={styles.kpiCopy}>
                <span className={`${styles.kpiLabel} ${props.outstandingBalance > 0 ? styles.kpiLabelError : ""}`}>
                  Outstanding Balance
                </span>
                <span className={`${styles.kpiValue} ${props.outstandingBalance > 0 ? styles.kpiValueError : ""}`}>
                  GHS {props.outstandingBalance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Two-column workspace */}
          <div className={styles.bentoGrid}>
            {/* Left: Profile Details accordion */}
            <aside className={styles.colLeft}>
              <div className={styles.accordionCard}>
                <div className={styles.accordionHead}>Profile Details</div>
                <div className={styles.accordionList}>
                  <AccordionSection id="personal" label="Personal Information" open={openSections.has("personal")} onToggle={toggleSection}>
                    <FieldRow label="Date of Birth" value={dob.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} />
                    <FieldRow label="Age" value={String(age)} />
                    <FieldRow label="Gender" value={props.gender} capitalize />
                    <FieldRow label="Home Address" value={props.address || "—"} />
                  </AccordionSection>

                  <AccordionSection id="academic" label="Academic Details" open={openSections.has("academic")} onToggle={toggleSection}>
                    <FieldRow label="Class" value={props.className} />
                    <FieldRow label="Admission Date" value={new Date(props.admissionDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} />
                  </AccordionSection>

                  <AccordionSection id="guardian" label="Guardian Information" open={openSections.has("guardian")} onToggle={toggleSection}>
                    {props.guardians.length === 0 ? (
                      <p className={styles.emptyText} style={{ padding: 0 }}>No guardian records.</p>
                    ) : (
                      <div className={styles.guardianList}>
                        {props.guardians.map(g => (
                          <div key={g.id} className={styles.guardianItem}>
                            <div className={styles.guardianHeader}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <p className={styles.guardianName}>{g.name}</p>
                                  {g.hasLogin && (
                                    <span className={styles.guardianLoginBadge}>
                                      <Key size={10} style={{ marginRight: 3 }} />Portal
                                    </span>
                                  )}
                                </div>
                                <p className={styles.guardianRel} style={{ textTransform: "capitalize" }}>
                                  {g.relation}{g === props.guardians[0] && " • Primary"}
                                </p>
                              </div>
                              {props.canManageGuardians && (
                                <button className={styles.guardianDeleteBtn} onClick={() => deleteGuardian(g.id)} disabled={gDeleting === g.id} title="Remove guardian">
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                            <div className={styles.guardianContact}>
                              <p><Phone size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />{g.phone}</p>
                              {g.email && <p><Mail size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />{g.email}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {props.canManageGuardians && (
                      <button className={styles.btnFullOutline} style={{ marginTop: 4 }} onClick={openGuardianModal}>
                        <Plus size={13} style={{ marginRight: 5 }} />Add Guardian
                      </button>
                    )}
                  </AccordionSection>

                  <AccordionSection id="medical" label="Medical Alerts" open={openSections.has("medical")} onToggle={toggleSection}>
                    <FieldRow label="Blood Group" value={props.health?.bloodGroup || "Not recorded"} />
                    <FieldRow label="Allergies" value={props.health?.allergies || "None recorded"} />
                  </AccordionSection>

                  <AccordionSection id="documents" label="Documents" badge={docs.length || undefined} open={openSections.has("documents")} onToggle={toggleSection}>
                    <input
                      ref={docInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.gif,.webp"
                      style={{ display: "none" }}
                      onChange={handleDocFiles}
                    />
                    {docs.length === 0 ? (
                      <div className={styles.docEmpty}>
                        <Paperclip size={24} className={styles.docEmptyIcon} />
                        <p className={styles.docEmptyText}>No documents uploaded yet.</p>
                        {props.canEdit && (
                          <button className={styles.docEmptyBtn} onClick={() => docInputRef.current?.click()}>
                            <Upload size={13} style={{ marginRight: 5 }} />Upload a document
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className={styles.docList}>
                        {docs.map((d, i) => (
                          <div key={i} className={styles.docItem}>
                            <div className={styles.docItemIcon}>{docIcon(d.type)}</div>
                            <div className={styles.docItemInfo}>
                              <p className={styles.docItemName}>{d.name}</p>
                              <p className={styles.docItemMeta}>{formatBytes(d.size)} · {d.addedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                            </div>
                            {props.canEdit && (
                              <button className={styles.docDeleteBtn} onClick={() => removeDoc(i)} title="Remove document">
                                <X size={13} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </AccordionSection>
                </div>
              </div>
            </aside>

            {/* Right: Recent Invoice + Recent Activity */}
            <main className={styles.colCenter}>
              {props.recentInvoice && (
                <div className={`${styles.card} ${styles.invoiceCard}`}>
                  <div className={`${styles.cardTitleRowBetween} ${styles.cardTitleBand}`}>
                    <h3 className={styles.cardTitle}>Recent Invoice</h3>
                    <Link href={studentFeesHref} className={styles.viewAllLink}>View All</Link>
                  </div>
                  <div className={styles.invoiceRow}>
                    <div className={styles.invoiceInfo}>
                      <p className={styles.invoiceDesc}>{props.recentInvoice.description}</p>
                      <p className={styles.invoiceSub}>{props.recentInvoice.invoiceRef}</p>
                      {scholarshipLabel(props.recentInvoice.scholarship, props.recentInvoice.discountApplied) && (
                        <span className={styles.scholarshipBadge}>
                          <Award size={11} /> {scholarshipLabel(props.recentInvoice.scholarship, props.recentInvoice.discountApplied)}
                        </span>
                      )}
                    </div>
                    <div className={styles.invoiceRight}>
                      <p className={styles.invoiceAmount}>
                        GHS {props.recentInvoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <span className={styles.invoiceStatusBadge}>
                        {props.recentInvoice.status === "paid" && props.recentInvoice.scholarship && props.recentInvoice.amount === 0
                          ? "Paid (Scholarship)"
                          : props.recentInvoice.status}
                      </span>
                    </div>
                    <Link href={recentInvoiceHref} className={styles.invoiceAction} aria-label="Open invoice">
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              )}

              <div className={styles.card}>
                <div className={`${styles.cardTitleRow} ${styles.cardTitleBand}`}>
                  <h3 className={styles.cardTitle}>Recent Activity</h3>
                </div>
                {props.recentActivity.length === 0 ? (
                  <p className={styles.emptyText}>No recent activity.</p>
                ) : (
                  <div className={styles.timeline}>
                    {props.recentActivity.map((item, i) => (
                      <div key={i} className={styles.timelineItem}>
                        <div className={styles.timelineDot}>
                          {item.type === "attendance" && <CheckCircle size={13} />}
                          {item.type === "grade" && <FileText size={13} />}
                          {item.type === "fee" && <DollarSign size={13} />}
                        </div>
                        <div>
                          <div className={styles.timelineTopRow}>
                            <p className={styles.timelineTitle}>{item.label}</p>
                          </div>
                          <p className={styles.timelineSub}>{fmtActivityDate(item.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </main>
          </div>
        </>
      )}

      {tab === "academics" && (
        <div className={styles.card}>
          <div className={styles.cardTitleRowBetween}>
            <h3 className={styles.cardTitle}>Academic Grades</h3>
            <Link className={styles.feeLinkBtn} href={`/report-cards/${props.id}`}>View full report card</Link>
          </div>
          {props.grades.length === 0 ? (
            <p className={styles.emptyText}>No grades recorded.</p>
          ) : (
            <table className={styles.simpleTable}>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Term</th>
                  <th className={styles.thRight}>Score</th>
                </tr>
              </thead>
              <tbody>
                {props.grades.map((g, i) => {
                  const letter = gradeFromScore(g.score, 100, props.gradingScale);
                  const badgeClass = ["A1"].includes(letter) ? styles.gradeA
                    : ["B2", "B3"].includes(letter) ? styles.gradeB
                    : styles.gradeC;
                  return (
                    <tr key={i}>
                      <td className={styles.tdBold}>{g.subject}</td>
                      <td className={styles.tdMuted}>{g.term}</td>
                      <td className={styles.thRight}>
                        <span className={`${styles.gradeBadge} ${badgeClass}`}>
                          {g.score}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "attendance" && (
        <div className={styles.card}>
          <div className={styles.cardTitleRowBetween}>
            <h3 className={styles.cardTitle}>Attendance Record</h3>
            <span className={`${styles.attPctBadge} ${props.attendancePct >= props.minAttendanceRate ? styles.attGood : styles.attBad}`}>
              {props.attendancePct}%
            </span>
          </div>
          {props.attendanceRecords.length === 0 ? (
            <p className={styles.emptyText}>No attendance records.</p>
          ) : (
            <div className={styles.attList}>
              {props.attendanceRecords.map((a, i) => (
                <div key={i} className={styles.attItem}>
                  <div className={styles.attLeft}>
                    <span className={`${styles.attDot} ${styles[`attDot_${a.status}`]}`} />
                    <span className={styles.attStatus} style={{ textTransform: "capitalize" }}>{a.status}</span>
                    {a.note && <span className={styles.attNote}>· {a.note}</span>}
                  </div>
                  <span className={styles.attDate}>
                    {new Date(a.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "financials" && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Fee Records</h3>
          {props.feeRecords.length === 0 ? (
            <p className={styles.emptyText}>No fee records.</p>
          ) : (
            <div className={styles.feeList}>
              {props.feeRecords.map((f) => {
                const schLabel = scholarshipLabel(f.scholarship, f.discountApplied);
                const paidByScholarship = f.status === "paid" && f.amountPaid === 0 && f.discountApplied > 0;
                return (
                  <div key={f.id} className={styles.feeItem}>
                    <div className={styles.feeTitleRow}>
                      <p className={styles.feeDesc}>{f.description}</p>
                      <span className={`${styles.feeBadge} ${f.status === "paid" ? styles.feePaid : f.status === "partial" ? styles.feePartial : styles.feeUnpaid}`}>
                        {paidByScholarship ? "Paid (Scholarship)" : f.status}
                      </span>
                    </div>
                    <p className={styles.feeSub}>{f.term}</p>
                    {schLabel && (
                      <span className={styles.scholarshipBadge}>
                        <Award size={11} /> {schLabel} (GHS {f.discountApplied.toLocaleString()} deducted)
                      </span>
                    )}
                    <div className={styles.feeAmounts}>
                      <span>Due: <strong>GHS {f.amountDue.toLocaleString()}</strong></span>
                      <span className={styles.feePaidAmt}>Paid: <strong>GHS {f.amountPaid.toLocaleString()}</strong></span>
                    </div>
                    <div className={styles.feeActions}>
                      <Link className={styles.feeLinkBtn} href={`/fees?studentId=${props.id}&feeRecordId=${f.id}`}>View invoice</Link>
                      <Link className={styles.feeLinkBtnPrimary} href={`/fees?studentId=${props.id}&feeRecordId=${f.id}&recordPayment=1`}>Record payment</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Guardian modal (plain-page fallback; the isModal case swaps content in-place above) */}
      <DesktopFormModal
        open={gOpen}
        title={gStep === "form" ? "Add Guardian" : "Guardian Created"}
        eyebrow="Student Directory"
        width={560}
        canClose={!gSaving}
        onClose={closeGuardianModal}
        footer={guardianFooter}
      >
        {guardianBody}
      </DesktopFormModal>
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

function FieldRow({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className={styles.fieldRow}>
      <label className={styles.drawerLabel}>{label}</label>
      <p className={styles.fieldRowValue} style={{ textTransform: capitalize ? "capitalize" : undefined }}>{value}</p>
    </div>
  );
}
