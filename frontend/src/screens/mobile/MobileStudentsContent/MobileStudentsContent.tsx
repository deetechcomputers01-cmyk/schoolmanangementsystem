"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, CheckCircle2, CalendarDays, MoreVertical, User, Edit2, Receipt, UserPlus, Archive, Camera } from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { SwipeRow } from "@/components/mobile/ui/SwipeRow/SwipeRow";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import styles from "./MobileStudentsContent.module.css";

export interface MobileStudentRow {
  id: string;
  admissionNo: string;
  name: string;
  initials: string;
  photoUrl: string | null;
  classId: string;
  className: string;
  feeStatus: "Paid" | "Pending" | "None";
  attendance: string;
}

interface Props {
  students: MobileStudentRow[];
  totalStudents: number;
  genderSummary: { boys: number; girls: number };
  classes: { id: string; name: string }[];
  canManageGuardians: boolean;
}

const GENDERS = ["Male", "Female"];

export function MobileStudentsContent({ students, totalStudents, genderSummary, classes, canManageGuardians }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianRelation, setGuardianRelation] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetAddForm() {
    setFullName(""); setGender(""); setDob(""); setAddress(""); setClassId(classes[0]?.id ?? "");
    setGuardianName(""); setGuardianPhone(""); setGuardianEmail(""); setGuardianRelation("");
    setPhotoFile(null); setPhotoPreview(null); setError(null);
  }

  function handlePhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const q = search.trim().toLowerCase();
      if (q && !s.name.toLowerCase().includes(q) && !s.admissionNo.toLowerCase().includes(q)) return false;
      if (filter === "all") return true;
      if (filter === "Paid" || filter === "Pending") return s.feeStatus === filter;
      return s.classId === filter;
    });
  }, [students, search, filter]);

  async function submitAddStudent() {
    if (!fullName.trim()) { setError("Full name is required."); return; }
    setSaving(true); setError(null);
    try {
      const [firstName, ...rest] = fullName.trim().split(" ");
      const lastName = rest.join(" ") || firstName;

      let body: BodyInit;
      let headers: Record<string, string> | undefined;

      if (photoFile) {
        const formData = new FormData();
        formData.append("firstName", firstName);
        formData.append("lastName", lastName);
        formData.append("gender", gender);
        formData.append("dateOfBirth", dob);
        formData.append("address", address);
        formData.append("classId", classId);
        if (guardianName) {
          formData.append("guardianName", guardianName);
          formData.append("guardianPhone", `+233${guardianPhone}`);
          formData.append("guardianEmail", guardianEmail);
          formData.append("relation", guardianRelation.toLowerCase());
        }
        formData.append("photo", photoFile);
        body = formData;
      } else {
        headers = { "Content-Type": "application/json" };
        body = JSON.stringify({
          firstName, lastName, gender, dateOfBirth: dob, address, classId: classId || undefined,
          guardian: guardianName
            ? { name: guardianName, phone: `+233${guardianPhone}`, email: guardianEmail, relation: guardianRelation.toLowerCase() }
            : undefined,
        });
      }

      const res = await fetch("/api/students", { method: "POST", headers, body });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(payload?.message ?? payload?.error ?? "Failed to save. Please check all fields.");
        setSaving(false);
        return;
      }
      setAddOpen(false);
      setSaving(false);
      resetAddForm();
      showToast("Student added.");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className={styles.root}>
      <label className={styles.searchWrap}>
        <Search size={16} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Search by name, ID, or guardian"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      <div className={styles.chipRow}>
        <button type="button" className={`${styles.chip} ${filter === "all" ? styles.chipActive : ""}`} onClick={() => setFilter("all")}>All</button>
        {classes.map((c) => (
          <button key={c.id} type="button" className={`${styles.chip} ${filter === c.id ? styles.chipActive : ""}`} onClick={() => setFilter(c.id)}>{c.name}</button>
        ))}
        <button type="button" className={`${styles.chip} ${filter === "Paid" ? styles.chipActive : ""}`} onClick={() => setFilter("Paid")}>Paid</button>
        <button type="button" className={`${styles.chip} ${filter === "Pending" ? styles.chipActive : ""}`} onClick={() => setFilter("Pending")}>Pending</button>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Students</span>
          <strong className={styles.statValue}>{totalStudents}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Boys / Girls</span>
          <strong className={styles.statValue}>{genderSummary.boys} / {genderSummary.girls}</strong>
        </div>
      </div>

      <button type="button" className={styles.addBtn} onClick={() => { resetAddForm(); setAddOpen(true); }}>
        <Plus size={18} /> Add Student
      </button>

      <div className={styles.listHeader}>
        <h3 className={styles.listTitle}>Students ({filtered.length})</h3>
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <p className={styles.emptyText}>{search ? "No results match your search." : "No students yet."}</p>
        ) : filtered.map((s) => {
          const isOpen = openId === s.id;
          return (
            <SwipeRow
              key={s.id}
              rightActions={[
                { key: "profile", icon: User, label: "View Profile", tone: "primary", onClick: () => router.push(`/students/${s.id}`) },
                { key: "payment", icon: Receipt, label: "Record Payment", tone: "soft", onClick: () => router.push(`/fees?studentId=${s.id}&recordPayment=1`) },
              ]}
              leftActions={[
                { key: "edit", icon: Edit2, label: "Edit", onClick: () => router.push(`/students/${s.id}?edit=1`) },
                ...(canManageGuardians ? [{ key: "guardian", icon: UserPlus, label: "Add Guardian", onClick: () => router.push(`/students/${s.id}`) }] : []),
                { key: "archive", icon: Archive, label: "Archive", tone: "danger" as const, onClick: () => showToast("Archive is not available yet.") },
              ]}
            >
            <div className={`${styles.card} ${isOpen ? styles.cardOpen : ""}`}>
              <div className={styles.cardTop}>
                <div className={styles.cardLeft}>
                  {s.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.photoUrl} alt="" className={styles.avatarImg} />
                  ) : (
                    <span className={styles.avatar}>{s.initials}</span>
                  )}
                  <div className={styles.cardInfo}>
                    <h4 className={styles.cardName}>{s.name}</h4>
                    <p className={styles.cardSub}>{s.admissionNo} • {s.className}</p>
                    <div className={styles.cardFooter}>
                      {s.feeStatus !== "None" && (
                        <span className={`${styles.footerTag} ${s.feeStatus === "Paid" ? styles.tagPaid : styles.tagPending}`}>
                          <CheckCircle2 size={13} /> {s.feeStatus}
                        </span>
                      )}
                      {s.attendance !== "—" && (
                        <span className={styles.footerTag}>
                          <CalendarDays size={13} /> {s.attendance} Att.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button type="button" className={styles.moreBtn} onClick={() => setOpenId(isOpen ? null : s.id)} aria-label="More actions">
                  <MoreVertical size={18} />
                </button>
              </div>
              {isOpen && (
                <div className={styles.actionRow}>
                  <Link href={`/students/${s.id}`} className={styles.actionBtn} onClick={() => setOpenId(null)}>
                    <User size={16} /> View Profile
                  </Link>
                  <Link href={`/students/${s.id}?edit=1`} className={styles.actionBtn} onClick={() => setOpenId(null)}>
                    <Edit2 size={16} /> Edit
                  </Link>
                  <Link href={`/fees?studentId=${s.id}&recordPayment=1`} className={styles.actionBtn} onClick={() => setOpenId(null)}>
                    <Receipt size={16} /> Record Payment
                  </Link>
                  {canManageGuardians && (
                    <Link href={`/students/${s.id}`} className={styles.actionBtn} onClick={() => setOpenId(null)}>
                      <UserPlus size={16} /> Add Guardian
                    </Link>
                  )}
                  <button type="button" className={styles.actionBtnDanger}>
                    <Archive size={16} /> Archive
                  </button>
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
        title="Add New Student"
        subtitle="Enter student details to enrol them in the system."
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => setAddOpen(false)} disabled={saving}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={submitAddStudent} disabled={saving}>{saving ? "Saving…" : "Save Student"}</button>
        </>}
      >
        {error && <p className={kit.errorText}>{error}</p>}

        <div className={kit.dropzone} onClick={() => photoRef.current?.click()}>
          {photoPreview
            ? <img src={photoPreview} alt="" style={{ width: 64, height: 64, borderRadius: "var(--radius-sm)", objectFit: "cover" }} />
            : <Camera size={20} color="var(--clr-app-muted)" />}
          <p className={kit.dropzoneText}>{photoPreview ? "Tap to change photo" : "Upload a photo (optional)"}</p>
        </div>
        <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handlePhotoPick} />
        <p className={kit.helperText}>Admission number is generated automatically on save.</p>

        <p className={kit.helperText} style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--clr-app-text)" }}>Personal Information</p>
        <div className={kit.field}>
          <label>Full Name *</label>
          <input className={kit.input} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Akosua Asare" />
        </div>
        <div className={kit.fieldRow}>
          <div className={kit.field}>
            <label>Gender</label>
            <select className={kit.select} value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select gender</option>
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className={kit.field}>
            <label>Date of Birth</label>
            <input className={kit.input} type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>
        </div>
        <div className={kit.field}>
          <label>Residential Address</label>
          <textarea className={kit.textarea} rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street name, City, Region..." />
        </div>

        <p className={kit.helperText} style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--clr-app-text)" }}>Academic Details</p>
        <div className={kit.field}>
          <label>Class / Grade</label>
          <select className={kit.select} value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Select Grade</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <p className={kit.helperText} style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--clr-app-text)" }}>Guardian Information</p>
        <div className={kit.field}>
          <label>Guardian Name</label>
          <input className={kit.input} value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="Full name of parent or guardian" />
        </div>
        <div className={kit.field}>
          <label>Guardian Phone Number</label>
          <div style={{ display: "flex", gap: 8 }}>
            <span className={kit.chip} style={{ cursor: "default" }}>+233</span>
            <input className={kit.input} style={{ flex: 1 }} value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} placeholder="24 123 4567" />
          </div>
        </div>
        <div className={kit.field}>
          <label>Guardian Email Address</label>
          <input className={kit.input} type="email" value={guardianEmail} onChange={(e) => setGuardianEmail(e.target.value)} placeholder="guardian@example.com" />
        </div>
        <div className={kit.field}>
          <label>Relationship to Student</label>
          <select className={kit.select} value={guardianRelation} onChange={(e) => setGuardianRelation(e.target.value)}>
            <option value="">Select Relationship</option>
            <option value="Mother">Mother</option>
            <option value="Father">Father</option>
            <option value="Uncle">Uncle</option>
            <option value="Aunt">Aunt</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </MobileSheet>
    </div>
  );
}
