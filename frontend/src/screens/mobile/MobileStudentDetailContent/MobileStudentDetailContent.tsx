"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Edit2, CreditCard, ChevronDown, X, CheckCircle, FileText, DollarSign,
  Phone, Mail, Plus, Key, Copy, Trash2, Upload, File, FileImage, FileSpreadsheet,
  Paperclip, Camera, Award, ArrowRight,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import { gradeFromScore } from "@backend/utils";
import type { StudentProps } from "@/screens/desktop/StudentDetailScreen/StudentDetailContent";
import styles from "./MobileStudentDetailContent.module.css";

type Tab = "overview" | "academics" | "attendance" | "financials";
const TABS: { key: Tab; label: string }[] = [
  { key: "overview",    label: "Overview" },
  { key: "academics",   label: "Academics" },
  { key: "attendance",  label: "Attendance" },
  { key: "financials",  label: "Financials" },
];

function fmtActivityDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function scholarshipLabel(scholarship: { type: "percent" | "fixed"; value: number; reason: string | null } | null, discountApplied: number) {
  if (!scholarship || discountApplied <= 0) return null;
  const off = scholarship.type === "percent" ? `${scholarship.value}% off` : `GHS ${scholarship.value.toLocaleString()} off`;
  return scholarship.reason ? `${off} · ${scholarship.reason}` : off;
}

export function MobileStudentDetailContent(props: StudentProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const studentFeesHref = `/fees?studentId=${props.id}`;
  const recentInvoiceHref = props.recentInvoice ? `/fees?studentId=${props.id}&feeRecordId=${props.recentInvoice.id}` : studentFeesHref;
  const recentPaymentHref = props.recentInvoice ? `${recentInvoiceHref}&recordPayment=1` : `${studentFeesHref}&recordPayment=1`;

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

  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["personal"]));
  function toggleSection(key: string) {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  // Guardian add modal
  const [gOpen, setGOpen] = useState(false);
  const [gStep, setGStep] = useState<"form" | "created">("form");
  const [gName, setGName] = useState("");
  const [gRelation, setGRelation] = useState("Father");
  const [gPhone, setGPhone] = useState("");
  const [gEmail, setGEmail] = useState("");
  const [gCreateLogin, setGCreateLogin] = useState(false);
  const [gSaving, setGSaving] = useState(false);
  const [gError, setGError] = useState("");
  const [gCreds, setGCreds] = useState<{ email: string; password: string } | null>(null);
  const [gDeleting, setGDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) return;
    fetch("/api/classes").then(r => r.json()).then(d => setEditClasses(Array.isArray(d) ? d : (d.classes ?? []))).catch(() => {});
  }, [editing]);

  const docInputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<{ name: string; size: number; type: string; addedAt: Date; file: File }[]>([]);

  function handleDocFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setDocs(prev => [...files.map(f => ({ name: f.name, size: f.size, type: f.type, addedAt: new Date(), file: f })), ...prev]);
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
    if (gCreateLogin && !gEmail.trim()) { setGError("Email is required to create a login."); return; }
    setGSaving(true); setGError("");
    try {
      const res = await fetch(`/api/students/${props.id}/guardians`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: gName.trim(), relation: gRelation, phone: gPhone.trim(), email: gEmail.trim() || undefined, createLogin: gCreateLogin }),
      });
      const data = await res.json();
      if (!res.ok) { setGError(data.error ?? "Failed to save."); return; }
      if (data.tempPassword) { setGCreds({ email: gEmail.trim(), password: data.tempPassword }); setGStep("created"); }
      else { setGOpen(false); router.refresh(); }
    } catch { setGError("Network error. Please try again."); }
    finally { setGSaving(false); }
  }

  function closeGuardianModal() {
    if (gSaving) return;
    setGOpen(false);
    if (gStep === "created") router.refresh();
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
      docs.forEach(d => fd.append("documents", d.file));

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
          body: JSON.stringify({ name: editGuardianName, relation: editGuardianRelation, phone: editGuardianPhone, email: editGuardianEmail }),
        });
        if (!gRes.ok) {
          const data = await gRes.json().catch(() => ({}));
          setEditError(data?.error ?? "Student details saved, but the guardian update failed. Please try again.");
          return;
        }
      }

      setDocs([]);
      showToast("Student profile saved");
      router.refresh();
      if (props.isModal) router.back();
      else setEditing(false);
    } catch {
      setEditError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const guardianBody = (
    <>
      {gStep === "form" && (
        <div className={styles.editSection}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Full Name *</label>
            <input className={styles.input} value={gName} onChange={e => setGName(e.target.value)} placeholder="e.g. Kofi Mensah" />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Relation *</label>
            <select className={styles.select} value={gRelation} onChange={e => setGRelation(e.target.value)}>
              {["Father", "Mother", "Guardian", "Uncle", "Aunt", "Sibling", "Other"].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Phone Number *</label>
            <input className={styles.input} value={gPhone} onChange={e => setGPhone(e.target.value)} placeholder="e.g. 0244000000" />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Email Address</label>
            <input className={styles.input} type="email" value={gEmail} onChange={e => setGEmail(e.target.value)} placeholder="optional" />
          </div>
          <label className={styles.checkRow}>
            <input type="checkbox" checked={gCreateLogin} onChange={e => setGCreateLogin(e.target.checked)} />
            <span>
              <span className={styles.checkLabel}>Create parent portal login</span>
              <span className={styles.checkSub}>Guardian gets a one-time password for the parent portal. Email required.</span>
            </span>
          </label>
          {gCreateLogin && <p className={styles.hintText}>A temporary password will be shown once after saving.</p>}
          {gError && <p className={styles.errorText}>{gError}</p>}
        </div>
      )}
      {gStep === "created" && gCreds && (
        <div className={styles.editSection}>
          <p className={styles.successText}>Guardian profile created with portal login.</p>
          <p className={styles.hintText}>Share these credentials — they won&apos;t be shown again.</p>
          <div className={styles.credBox}>
            <div className={styles.credRow}><span className={styles.credLabel}>Email</span><span className={styles.credValue}>{gCreds.email}</span>
              <button className={styles.resetCopyBtn} onClick={() => navigator.clipboard.writeText(gCreds!.email)} type="button"><Copy size={13} /></button>
            </div>
            <div className={styles.credRow}><span className={styles.credLabel}>Password</span><span className={styles.credValue}>{gCreds.password}</span>
              <button className={styles.resetCopyBtn} onClick={() => navigator.clipboard.writeText(gCreds!.password)} type="button"><Copy size={13} /></button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const guardianFooter = gStep === "form" ? (
    <div className={styles.editFooter}>
      <button className={styles.btnOutline} onClick={() => setGOpen(false)} disabled={gSaving} type="button">Cancel</button>
      <button className={styles.btnPrimary} onClick={submitGuardian} disabled={gSaving} type="button">{gSaving ? "Saving…" : "Save Guardian"}</button>
    </div>
  ) : (
    <div className={styles.editFooter}>
      <button className={styles.btnPrimary} onClick={() => { setGOpen(false); router.refresh(); }} type="button">Done</button>
    </div>
  );

  if (gOpen) {
    const body = <>{guardianBody}{guardianFooter}</>;
    if (props.isModal) {
      return (
        <div className={styles.editInline}>
          <h2 className={styles.editInlineTitle}>{gStep === "form" ? "Add Guardian" : "Guardian Created"}</h2>
          {body}
        </div>
      );
    }
    return (
      <div className={styles.sheetBackdrop} onClick={closeGuardianModal}>
        <div className={styles.sheet} onClick={e => e.stopPropagation()}>
          <div className={styles.sheetHandle} />
          <div className={styles.sheetHeaderRow}>
            <h2 className={styles.editInlineTitle}>{gStep === "form" ? "Add Guardian" : "Guardian Created"}</h2>
            <button className={styles.sheetClose} onClick={closeGuardianModal} aria-label="Close" type="button"><X size={18} /></button>
          </div>
          {body}
        </div>
      </div>
    );
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
          <input ref={photoInputRef} type="file" accept="image/jpeg,image/png" style={{ display: "none" }} onChange={handlePhotoPick} />
        </div>
        <p className={styles.uploadHint}>Upload a high-resolution JPG or PNG. Max 2MB.</p>
        <span className={styles.idPill}>{props.admissionNo}</span>
      </div>

      <section className={styles.editSection}>
        <h3 className={styles.editSectionTitle}>Personal Information</h3>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>First Name</label>
          <input className={styles.input} type="text" value={firstName} onChange={e => setFirstName(e.target.value)} />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Last Name</label>
          <input className={styles.input} type="text" value={lastName} onChange={e => setLastName(e.target.value)} />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Gender</label>
          <select className={styles.select} value={editGender} onChange={e => setEditGender(e.target.value)}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Date of Birth</label>
          <input className={styles.input} type="date" value={editDob} onChange={e => setEditDob(e.target.value)} />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Residential Address</label>
          <textarea className={styles.textarea} rows={2} value={editAddress} onChange={e => setEditAddress(e.target.value)} />
        </div>
      </section>

      <section className={styles.editSection}>
        <h3 className={styles.editSectionTitle}>Academic Details</h3>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Class</label>
          <select className={styles.select} value={editClassId} onChange={e => setEditClassId(e.target.value)}>
            {editClasses.length > 0
              ? editClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
              : <option value={props.classId}>{props.className}</option>}
          </select>
        </div>
        <div className={styles.staticRow}>
          <span>Admission Date</span>
          <strong>{new Date(props.admissionDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</strong>
        </div>
      </section>

      <section className={styles.editSection}>
        <h3 className={styles.editSectionTitle}>Guardian Information</h3>
        {primaryGuardian ? (
          <>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Guardian Name</label>
              <input className={styles.input} type="text" value={editGuardianName} onChange={e => setEditGuardianName(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Relationship</label>
              <input className={styles.input} type="text" value={editGuardianRelation} onChange={e => setEditGuardianRelation(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Phone Number</label>
              <input className={styles.input} type="text" value={editGuardianPhone} onChange={e => setEditGuardianPhone(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Email Address</label>
              <input className={styles.input} type="email" value={editGuardianEmail} onChange={e => setEditGuardianEmail(e.target.value)} />
            </div>
          </>
        ) : (
          <p className={styles.emptyText}>No guardian on record. Add one from the profile once saved.</p>
        )}
        {props.canManageGuardians && (
          <button className={styles.addGuardianBtn} onClick={openGuardianModal} type="button">
            <Plus size={15} /> Add Guardian
          </button>
        )}
      </section>

      {editError && <p className={styles.errorText}>{editError}</p>}
    </div>
  );

  const editFooter = (
    <div className={styles.editFooter}>
      <button className={styles.btnPrimary} onClick={handleSave} disabled={saving} type="button">{saving ? "Saving…" : "Save Changes"}</button>
      <button className={styles.btnOutline} onClick={closeEdit} disabled={saving} type="button">Cancel</button>
    </div>
  );

  if (editing) {
    const body = <>{editBody}{editFooter}</>;
    if (props.isModal) {
      return (
        <div className={styles.editInline}>
          <h2 className={styles.editInlineTitle}>Edit Student Profile</h2>
          {body}
        </div>
      );
    }
    return (
      <div className={styles.sheetBackdrop} onClick={closeEdit}>
        <div className={styles.sheet} onClick={e => e.stopPropagation()}>
          <div className={styles.sheetHandle} />
          <div className={styles.sheetHeaderRow}>
            <h2 className={styles.editInlineTitle}>Edit Student Profile</h2>
            <button className={styles.sheetClose} onClick={closeEdit} aria-label="Close" type="button"><X size={18} /></button>
          </div>
          {body}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <header className={styles.profileHeader}>
        <div className={styles.avatarWrap}>
          {props.photoUrl ? <img src={props.photoUrl} alt={fullName} className={styles.avatarImg} /> : <div className={styles.avatar}>{initials}</div>}
        </div>
        <div className={styles.profileInfo}>
          <div className={styles.nameRow}>
            <h1 className={styles.name}>{fullName}</h1>
            <span className={styles.badgeActive}>Active</span>
          </div>
          <p className={styles.metaLine}>{props.admissionNo} · {props.className}{props.house ? ` · ${props.house}` : ""}</p>
        </div>
      </header>

      <div className={styles.actionCol}>
        <Link className={styles.btnPrimaryLink} href={recentPaymentHref}>
          <CreditCard size={14} /> Record Payment
        </Link>
        {props.canEdit && (
          <button className={styles.btnOutline} onClick={openEdit} type="button">
            <Edit2 size={14} /> Edit Profile
          </button>
        )}
      </div>

      <div className={styles.tabRow}>
        {TABS.map(t => (
          <button key={t.key} className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`} onClick={() => setTab(t.key)} type="button">
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className={styles.kpiGrid3}>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Attendance</span>
              <span className={styles.kpiValue}>{props.attendancePct}%</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Avg Grade</span>
              <span className={styles.kpiValue}>{props.avgGrade !== null ? `${props.avgGrade}%` : "—"}</span>
            </div>
            <div className={`${styles.kpiCard} ${props.outstandingBalance > 0 ? styles.kpiCardWarn : ""}`}>
              <span className={styles.kpiLabel}>Balance</span>
              <span className={`${styles.kpiValue} ${props.outstandingBalance > 0 ? styles.kpiValueWarn : ""}`}>GHS {props.outstandingBalance.toLocaleString()}</span>
            </div>
          </div>

          <div className={styles.accordionCard}>
            <AccordionSection id="personal" label="Personal Information" open={openSections.has("personal")} onToggle={toggleSection}>
              <FieldRow label="Date of Birth" value={dob.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} />
              <FieldRow label="Age" value={String(age)} />
              <FieldRow label="Gender" value={props.gender} capitalize />
              <FieldRow label="Address" value={props.address || "—"} />
            </AccordionSection>

            <AccordionSection id="academic" label="Academic Details" open={openSections.has("academic")} onToggle={toggleSection}>
              <FieldRow label="Class" value={props.className} />
              <FieldRow label="Admission Date" value={new Date(props.admissionDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} />
            </AccordionSection>

            <AccordionSection id="guardian" label="Guardian Information" open={openSections.has("guardian")} onToggle={toggleSection}>
              {props.guardians.length === 0 ? (
                <p className={styles.emptyText}>No guardian records.</p>
              ) : (
                <div className={styles.guardianList}>
                  {props.guardians.map((g, i) => (
                    <div key={g.id} className={styles.guardianItem}>
                      <div className={styles.guardianTop}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className={styles.guardianNameRow}>
                            <span className={styles.guardianName}>{g.name}</span>
                            {g.hasLogin && <span className={styles.portalBadge}><Key size={10} /> Portal</span>}
                          </div>
                          <p className={styles.guardianRel}>{g.relation}{i === 0 && " · Primary"}</p>
                        </div>
                        {props.canManageGuardians && (
                          <button className={styles.iconDeleteBtn} onClick={() => deleteGuardian(g.id)} disabled={gDeleting === g.id} type="button" aria-label="Remove guardian">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <p className={styles.guardianContact}><Phone size={12} /> {g.phone}</p>
                      {g.email && <p className={styles.guardianContact}><Mail size={12} /> {g.email}</p>}
                    </div>
                  ))}
                </div>
              )}
              {props.canManageGuardians && (
                <button className={styles.btnFullOutline} onClick={openGuardianModal} type="button">
                  <Plus size={13} /> Add Guardian
                </button>
              )}
            </AccordionSection>

            <AccordionSection id="medical" label="Medical Alerts" open={openSections.has("medical")} onToggle={toggleSection}>
              <FieldRow label="Blood Group" value={props.health?.bloodGroup || "Not recorded"} />
              <FieldRow label="Allergies" value={props.health?.allergies || "None recorded"} />
            </AccordionSection>

            <AccordionSection id="documents" label="Documents" badge={docs.length || undefined} open={openSections.has("documents")} onToggle={toggleSection}>
              <input ref={docInputRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.gif,.webp" style={{ display: "none" }} onChange={handleDocFiles} />
              {docs.length === 0 ? (
                <div className={styles.docEmpty}>
                  <Paperclip size={22} />
                  <p>No documents uploaded yet.</p>
                  {props.canEdit && (
                    <button className={styles.btnFullOutline} onClick={() => docInputRef.current?.click()} type="button">
                      <Upload size={13} /> Upload a document
                    </button>
                  )}
                </div>
              ) : (
                <div className={styles.fileList}>
                  {docs.map((d, i) => (
                    <div key={i} className={styles.fileItem}>
                      {docIcon(d.type)}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className={styles.fileItemName}>{d.name}</p>
                        <p className={styles.fileItemMeta}>{formatBytes(d.size)} · {d.addedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                      </div>
                      {props.canEdit && (
                        <button className={styles.fileItemDelete} onClick={() => removeDoc(i)} type="button" aria-label="Remove document"><X size={13} /></button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </AccordionSection>
          </div>

          {props.recentInvoice && (
            <section className={styles.section}>
              <div className={styles.sectionHeaderRow}>
                <h3 className={styles.sectionTitle}>Recent Invoice</h3>
                <Link href={studentFeesHref} className={styles.viewAllLink}>View All</Link>
              </div>
              <div className={styles.invoiceCard}>
                <div className={styles.invoiceIcon}><FileText size={18} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className={styles.invoiceDesc}>{props.recentInvoice.invoiceRef}</p>
                  <p className={styles.invoiceSub}>{props.recentInvoice.description}</p>
                  {scholarshipLabel(props.recentInvoice.scholarship, props.recentInvoice.discountApplied) && (
                    <span className={styles.scholarshipBadge}><Award size={10} /> {scholarshipLabel(props.recentInvoice.scholarship, props.recentInvoice.discountApplied)}</span>
                  )}
                </div>
                <div className={styles.invoiceRight}>
                  <p className={styles.invoiceAmount}>GHS {props.recentInvoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  <span className={`${styles.invoiceStatus} ${props.recentInvoice.status === "paid" ? styles.invoiceStatusPaid : ""}`}>
                    {props.recentInvoice.status === "paid" && props.recentInvoice.scholarship && props.recentInvoice.amount === 0 ? "Paid (Scholarship)" : props.recentInvoice.status}
                  </span>
                </div>
                <Link href={recentInvoiceHref} className={styles.invoiceArrow} aria-label="Open invoice"><ArrowRight size={16} /></Link>
              </div>
            </section>
          )}

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Recent Activity</h3>
            {props.recentActivity.length === 0 ? (
              <p className={styles.emptyText}>No recent activity.</p>
            ) : (
              <div className={styles.timeline}>
                {props.recentActivity.map((item, i) => (
                  <div key={i} className={styles.timelineItem}>
                    <div className={styles.timelineIconDot}>
                      {item.type === "attendance" && <CheckCircle size={13} />}
                      {item.type === "grade" && <FileText size={13} />}
                      {item.type === "fee" && <DollarSign size={13} />}
                    </div>
                    <div className={styles.timelineBody}>
                      <p className={styles.timelineTitle}>{item.label}</p>
                      <p className={styles.timelineSub}>{fmtActivityDate(item.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {tab === "academics" && (
        <section className={styles.section}>
          <div className={styles.sectionHeaderRow}>
            <h3 className={styles.sectionTitle}>Academic Grades</h3>
            <Link className={styles.viewAllLink} href={`/report-cards/${props.id}`}>Report Card</Link>
          </div>
          {props.grades.length === 0 ? (
            <p className={styles.emptyText}>No grades recorded.</p>
          ) : (
            <div className={styles.gradeList}>
              {props.grades.map((g, i) => {
                const letter = gradeFromScore(g.score, 100, props.gradingScale);
                return (
                  <div key={i} className={styles.gradeRow}>
                    <div>
                      <p className={styles.gradeSubject}>{g.subject}</p>
                      <p className={styles.gradeTerm}>{g.term}</p>
                    </div>
                    <span className={styles.gradeBadge}>{g.score}% · {letter}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {tab === "attendance" && (
        <section className={styles.section}>
          <div className={styles.sectionHeaderRow}>
            <h3 className={styles.sectionTitle}>Attendance Record</h3>
            <span className={`${styles.attBadge} ${props.attendancePct >= props.minAttendanceRate ? styles.attGood : styles.attBad}`}>{props.attendancePct}%</span>
          </div>
          {props.attendanceRecords.length === 0 ? (
            <p className={styles.emptyText}>No attendance records.</p>
          ) : (
            <div className={styles.attList}>
              {props.attendanceRecords.map((a, i) => (
                <div key={i} className={styles.attItem}>
                  <div className={styles.attLeft}>
                    <span className={`${styles.attDot} ${a.status === "present" ? styles.attDotPresent : a.status === "late" ? styles.attDotLate : styles.attDotAbsent}`} />
                    <span className={styles.attStatus}>{a.status}</span>
                    {a.note && <span className={styles.attNote}>· {a.note}</span>}
                  </div>
                  <span className={styles.attDate}>{new Date(a.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "financials" && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Fee Records</h3>
          {props.feeRecords.length === 0 ? (
            <p className={styles.emptyText}>No fee records.</p>
          ) : (
            <div className={styles.feeList}>
              {props.feeRecords.map(f => {
                const schLabel = scholarshipLabel(f.scholarship, f.discountApplied);
                const paidByScholarship = f.status === "paid" && f.amountPaid === 0 && f.discountApplied > 0;
                return (
                  <div key={f.id} className={styles.feeCard}>
                    <div className={styles.feeTop}>
                      <p className={styles.feeDesc}>{f.description}</p>
                      <span className={`${styles.feeBadge} ${f.status === "paid" ? styles.feePaid : f.status === "partial" ? styles.feePartial : styles.feeUnpaid}`}>
                        {paidByScholarship ? "Paid (Scholarship)" : f.status}
                      </span>
                    </div>
                    <p className={styles.feeSub}>{f.term}</p>
                    {schLabel && <span className={styles.scholarshipBadge}><Award size={10} /> {schLabel}</span>}
                    <div className={styles.feeAmounts}>
                      <span>Due: <strong>GHS {f.amountDue.toLocaleString()}</strong></span>
                      <span>Paid: <strong>GHS {f.amountPaid.toLocaleString()}</strong></span>
                    </div>
                    <div className={styles.feeActionsRow}>
                      <Link className={styles.feeLinkBtn} href={`/fees?studentId=${props.id}&feeRecordId=${f.id}`}>View invoice</Link>
                      <Link className={styles.feeLinkBtnPrimary} href={`/fees?studentId=${props.id}&feeRecordId=${f.id}&recordPayment=1`}>Record payment</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function AccordionSection({
  id, label, badge, open, onToggle, children,
}: { id: string; label: string; badge?: number; open: boolean; onToggle: (id: string) => void; children: React.ReactNode }) {
  return (
    <div className={styles.accordionItem}>
      <button type="button" className={styles.accordionBtn} onClick={() => onToggle(id)}>
        <span className={styles.accordionLabel}>
          {label}
          {badge !== undefined && <span className={styles.badgeCount}>{badge}</span>}
        </span>
        <ChevronDown size={16} className={`${styles.accordionChevron} ${open ? styles.accordionChevronOpen : ""}`} />
      </button>
      {open && <div className={styles.accordionContent}>{children}</div>}
    </div>
  );
}

function FieldRow({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className={styles.fieldRowView}>
      <span className={styles.fieldRowLabel}>{label}</span>
      <span className={styles.fieldRowValue} style={{ textTransform: capitalize ? "capitalize" : undefined }}>{value}</span>
    </div>
  );
}
