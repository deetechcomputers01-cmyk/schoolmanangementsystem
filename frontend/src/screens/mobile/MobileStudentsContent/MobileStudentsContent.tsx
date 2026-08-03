"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, CheckCircle2, CalendarDays, MoreVertical, User, Edit2, Receipt, UserPlus, Archive, X } from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { SwipeRow } from "@/components/mobile/ui/SwipeRow/SwipeRow";
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
  const [gender, setGender] = useState("Male");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!dob) { setError("Date of birth is required."); return; }
    setSaving(true); setError(null);
    try {
      const [firstName, ...rest] = fullName.trim().split(" ");
      const lastName = rest.join(" ") || firstName;
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, gender, dateOfBirth: dob, address, classId: classId || undefined }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(payload?.message ?? payload?.error ?? "Failed to save. Please check all fields.");
        setSaving(false);
        return;
      }
      setAddOpen(false);
      setSaving(false);
      setFullName(""); setDob(""); setAddress("");
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

      <button type="button" className={styles.addBtn} onClick={() => setAddOpen(true)}>
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

      {addOpen && (
        <div className={styles.sheetBackdrop} onClick={() => !saving && setAddOpen(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHeader}>
              <h3 className={styles.sheetTitle}>Add Student</h3>
              <button type="button" className={styles.sheetClose} onClick={() => setAddOpen(false)} aria-label="Close"><X size={20} /></button>
            </div>
            <div className={styles.sheetBody}>
              {error && <p className={styles.errorText}>{error}</p>}
              <div className={styles.field}>
                <label>Full Name *</label>
                <input className={styles.input} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Akosua Asare" />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Gender *</label>
                  <select className={styles.input} value={gender} onChange={(e) => setGender(e.target.value)}>
                    {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Date of Birth *</label>
                  <input className={styles.input} type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                </div>
              </div>
              <div className={styles.field}>
                <label>Class</label>
                <select className={styles.input} value={classId} onChange={(e) => setClassId(e.target.value)}>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label>Address</label>
                <input className={styles.input} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Home address" />
              </div>
            </div>
            <div className={styles.sheetFooter}>
              <button type="button" className={styles.btnOutline} onClick={() => setAddOpen(false)} disabled={saving}>Cancel</button>
              <button type="button" className={styles.btnPrimary} onClick={submitAddStudent} disabled={saving}>{saving ? "Saving…" : "Save Student"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
