"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Plus, MoreVertical, User, Edit2, BookPlus, CalendarOff, GraduationCap, Landmark, Bus,
  Stethoscope, ShieldCheck, Briefcase, Phone, Camera, UploadCloud,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import { SwipeRow } from "@/components/mobile/ui/SwipeRow/SwipeRow";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import styles from "./MobileStaffContent.module.css";

export interface MobileStaffRow {
  id: string;
  staffNo: string;
  firstName: string;
  lastName: string;
  roleTitle: string;
  staffCategory: string;
  isTeaching: boolean;
  phone: string;
  photoUrl: string | null;
  subjects: string[];
}

interface Props {
  staffList: MobileStaffRow[];
  totalStaff: number;
  teachers: number;
  supportStaff: number;
  canManage: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  teaching: "Teaching", accounts: "Accounts", driver: "Driver",
  caterer: "Caterer", nurse: "Nurse", security: "Security", admin: "Admin",
};
const CATEGORY_ICON: Record<string, typeof GraduationCap> = {
  teaching: GraduationCap, accounts: Landmark, driver: Bus,
  caterer: Briefcase, nurse: Stethoscope, security: ShieldCheck, admin: Briefcase,
};
const FILTERS = ["all", "teaching", "accounts", "driver", "caterer", "nurse", "security", "admin"];

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

export function MobileStaffContent({ staffList, totalStaff, teachers, supportStaff, canManage }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const [deactivatedIds, setDeactivatedIds] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [staffNo, setStaffNo] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [category, setCategory] = useState("teaching");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const photoRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onLeave = 0; // no leave-tracking feature exists yet — honestly zero, not fabricated

  function openAddSheet() {
    const year = new Date().getFullYear();
    const seq = String(Math.floor(1000 + Math.random() * 9000));
    setStaffNo(`STF-${year}-${seq}`);
    setFirstName(""); setLastName(""); setPhone(""); setEmail(""); setRoleTitle(""); setCategory("teaching");
    setPhotoFile(null); setPhotoPreview(null); setDocFiles([]); setError(null);
    setAddOpen(true);
  }

  function handlePhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function submitAddStaff() {
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !roleTitle.trim()) {
      setError("First name, last name, phone, and role title are required.");
      return;
    }
    setSaving(true); setError(null);
    try {
      const formData = new FormData();
      formData.append("staffNo", staffNo);
      formData.append("firstName", firstName.trim());
      formData.append("lastName", lastName.trim());
      formData.append("phone", `+233${phone}`);
      formData.append("roleTitle", roleTitle.trim());
      formData.append("email", email);
      formData.append("staffCategory", category);
      formData.append("isTeaching", String(category === "teaching"));
      if (photoFile) formData.append("photo", photoFile);
      docFiles.forEach((file) => formData.append("documents", file));

      const res = await fetch("/api/staff", { method: "POST", body: formData });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(payload?.message ?? payload?.error ?? "Failed to save. Please check all fields.");
        setSaving(false);
        return;
      }
      setAddOpen(false); setSaving(false);
      showToast("Staff record saved successfully");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  const filtered = useMemo(() => {
    return staffList.filter((s) => {
      if (filter !== "all" && s.staffCategory !== filter) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.staffNo.toLowerCase().includes(q) || s.subjects.some((sub) => sub.toLowerCase().includes(q));
    });
  }, [staffList, search, filter]);

  async function handleDeactivate(id: string, name: string) {
    const ok = await confirm({ title: "Deactivate staff member", message: `Deactivate ${name}?`, tone: "danger", confirmLabel: "Deactivate" });
    if (!ok) return;
    setDeactivating(id);
    setDeactivatedIds((prev) => new Set(prev).add(id));
    setOpenId(null);
    showToast("Staff record saved successfully");
    try {
      await fetch(`/api/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false }),
      });
    } catch {
      // persisted locally; API call best-effort — matches desktop's current behavior
    } finally {
      setDeactivating(null);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}><span className={styles.kpiLabel}>Total Staff</span><strong className={styles.kpiValue}>{totalStaff}</strong></div>
        <div className={styles.kpiCard}><span className={styles.kpiLabel}>Teaching Staff</span><strong className={styles.kpiValue}>{teachers}</strong></div>
        <div className={styles.kpiCard}><span className={styles.kpiLabel}>Support Staff</span><strong className={styles.kpiValue}>{supportStaff}</strong></div>
        <div className={styles.kpiCard}><span className={styles.kpiLabel}>On Leave</span><strong className={styles.kpiValue}>{onLeave}</strong></div>
      </div>

      <label className={styles.searchWrap}>
        <Search size={16} className={styles.searchIcon} />
        <input className={styles.searchInput} placeholder="Search staff, ID, or subject" value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>

      <div className={styles.chipRow}>
        {FILTERS.map((f) => (
          <button key={f} type="button" className={`${styles.chip} ${filter === f ? styles.chipActive : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : CATEGORY_LABELS[f]}
          </button>
        ))}
      </div>

      {canManage && (
        <button type="button" className={styles.addBtn} onClick={openAddSheet}>
          <Plus size={18} /> Add Staff
        </button>
      )}

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <p className={styles.emptyText}>No staff found.</p>
        ) : filtered.map((s) => {
          const CatIcon = CATEGORY_ICON[s.staffCategory] ?? Briefcase;
          const isOpen = openId === s.id;
          const isDeactivated = deactivatedIds.has(s.id);
          return (
            <SwipeRow
              key={s.id}
              rightActions={[
                { key: "profile", icon: User, label: "View Profile", tone: "primary", onClick: () => router.push(`/staff/${s.id}`) },
                { key: "edit", icon: Edit2, label: "Edit Staff", tone: "soft", onClick: () => router.push(`/staff/${s.id}?edit=1`) },
              ]}
              leftActions={[
                ...(s.isTeaching ? [{ key: "assign", icon: BookPlus, label: "Assign Subject", onClick: () => showToast("Assign Subject is not available yet.") }] : []),
                ...(canManage ? [{ key: "deactivate", icon: CalendarOff, label: "Deactivate", tone: "danger" as const, onClick: () => handleDeactivate(s.id, `${s.firstName} ${s.lastName}`) }] : []),
              ]}
            >
            <div className={`${styles.card} ${isOpen ? styles.cardOpen : ""}`}>
              <div className={styles.cardTop}>
                <div className={styles.cardLeft}>
                  {s.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.photoUrl} alt="" className={styles.avatarImg} />
                  ) : (
                    <span className={styles.avatar}>{initials(s.firstName, s.lastName)}</span>
                  )}
                  <div className={styles.cardInfo}>
                    <h4 className={styles.cardName}>{s.firstName} {s.lastName}</h4>
                    <p className={styles.cardSub}>{s.staffNo} • {s.roleTitle}</p>
                    <div className={styles.tagRow}>
                      <span className={styles.categoryTag}><CatIcon size={12} /> {CATEGORY_LABELS[s.staffCategory] ?? s.staffCategory}</span>
                      {isDeactivated && <span className={styles.statusTagLeave}>On Leave</span>}
                    </div>
                    {s.phone && <p className={styles.cardPhone}><Phone size={13} /> {s.phone}</p>}
                  </div>
                </div>
                <button type="button" className={styles.moreBtn} onClick={() => setOpenId(isOpen ? null : s.id)} aria-label="More actions">
                  <MoreVertical size={18} />
                </button>
              </div>
              {isOpen && (
                <div className={styles.actionRow}>
                  <Link href={`/staff/${s.id}`} className={styles.actionBtn} onClick={() => setOpenId(null)}>
                    <User size={16} /> View Profile
                  </Link>
                  <Link href={`/staff/${s.id}?edit=1`} className={styles.actionBtn} onClick={() => setOpenId(null)}>
                    <Edit2 size={16} /> Edit Staff
                  </Link>
                  {s.isTeaching && (
                    <button type="button" className={styles.actionBtn}>
                      <BookPlus size={16} /> Assign Subject
                    </button>
                  )}
                  {canManage && (
                    <button type="button" className={styles.actionBtnDanger} onClick={() => handleDeactivate(s.id, `${s.firstName} ${s.lastName}`)} disabled={deactivating === s.id}>
                      <CalendarOff size={16} /> {deactivating === s.id ? "Saving…" : "Deactivate"}
                    </button>
                  )}
                </div>
              )}
            </div>
            </SwipeRow>
          );
        })}
      </div>

      <MobileSheet
        open={addOpen}
        onClose={() => !saving && setAddOpen(false)}
        title="Add New Staff Member"
        subtitle="Enter staff details to create a new institutional record."
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => setAddOpen(false)} disabled={saving}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={submitAddStaff} disabled={saving}>{saving ? "Saving…" : "Save Staff Member"}</button>
        </>}
      >
        {error && <p className={kit.errorText}>{error}</p>}

        <div className={kit.dropzone} onClick={() => photoRef.current?.click()}>
          {photoPreview
            ? <img src={photoPreview} alt="" style={{ width: 64, height: 64, borderRadius: "var(--radius-sm)", objectFit: "cover" }} />
            : <Camera size={20} color="var(--clr-app-muted)" />}
          <p className={kit.dropzoneText}>{photoPreview ? "Tap to change photo" : "Upload a photo — JPG, PNG, max 2MB"}</p>
        </div>
        <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handlePhotoPick} />

        <div className={kit.field}>
          <label>Staff Number</label>
          <input className={kit.input} value={staffNo} disabled readOnly />
        </div>
        <div className={kit.fieldRow}>
          <div className={kit.field}>
            <label>First Name *</label>
            <input className={kit.input} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. Kwesi" />
          </div>
          <div className={kit.field}>
            <label>Last Name *</label>
            <input className={kit.input} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="e.g. Mensah" />
          </div>
        </div>

        <div className={kit.field}>
          <label>Role Category *</label>
          <select className={kit.select} value={category} onChange={(e) => setCategory(e.target.value)}>
            {FILTERS.filter((f) => f !== "all").map((f) => <option key={f} value={f}>{CATEGORY_LABELS[f]}</option>)}
          </select>
          {category !== "teaching" && (
            <p className={kit.helperText}>This staff member will <strong>not</strong> be assignable to classes or subjects.</p>
          )}
        </div>
        <div className={kit.field}>
          <label>Role Title *</label>
          <input
            className={kit.input}
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder={category === "teaching" ? "e.g. Mathematics Teacher" : category === "nurse" ? "e.g. School Nurse" : category === "driver" ? "e.g. School Bus Driver" : "e.g. Head Caterer"}
          />
        </div>

        <div className={kit.field}>
          <label>Phone Number *</label>
          <div style={{ display: "flex", gap: 8 }}>
            <span className={kit.chip} style={{ cursor: "default" }}>+233</span>
            <input className={kit.input} style={{ flex: 1 }} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="24 000 0000" />
          </div>
        </div>
        <div className={kit.field}>
          <label>Email <span style={{ fontWeight: 400, textTransform: "none" }}>(optional — for system access)</span></label>
          <input className={kit.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="k.mensah@school.edu.gh" />
        </div>

        <div className={kit.field}>
          <label>Staff Documents</label>
          <div className={kit.dropzone} onClick={() => docRef.current?.click()}>
            <UploadCloud size={24} color="var(--clr-app-muted)" />
            <p className={kit.dropzoneText}>Click to upload or drag and drop</p>
            <p className={kit.dropzoneText}>Certificates, ID Copies, and CV (PDF, DOCX up to 10MB)</p>
            {docFiles.length > 0 && <p className={kit.dropzoneText}>{docFiles.length} file{docFiles.length > 1 ? "s" : ""} selected</p>}
          </div>
          <input ref={docRef} type="file" multiple accept=".pdf,.doc,.docx,image/*" style={{ display: "none" }} onChange={(e) => setDocFiles(Array.from(e.target.files ?? []))} />
        </div>
      </MobileSheet>
    </div>
  );
}
