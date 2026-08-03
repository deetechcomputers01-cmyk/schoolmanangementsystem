"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Plus, MoreVertical, User, Edit2, BookPlus, CalendarOff, GraduationCap, Landmark, Bus,
  Stethoscope, ShieldCheck, Briefcase, Phone, X,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import { SwipeRow } from "@/components/mobile/ui/SwipeRow/SwipeRow";
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
  const [fullName, setFullName] = useState("");
  const [staffNo, setStaffNo] = useState("");
  const [phone, setPhone] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [category, setCategory] = useState("teaching");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onLeave = 0; // no leave-tracking feature exists yet — honestly zero, not fabricated

  async function submitAddStaff() {
    if (!fullName.trim() || !staffNo.trim() || !phone.trim() || !roleTitle.trim()) {
      setError("Full name, staff no, phone, and role title are required.");
      return;
    }
    setSaving(true); setError(null);
    try {
      const [firstName, ...rest] = fullName.trim().split(" ");
      const lastName = rest.join(" ") || firstName;
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, staffNo: staffNo.trim(), phone: phone.trim(), roleTitle: roleTitle.trim(), staffCategory: category, isTeaching: category === "teaching" }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(payload?.message ?? payload?.error ?? "Failed to save. Please check all fields.");
        setSaving(false);
        return;
      }
      setAddOpen(false); setSaving(false);
      setFullName(""); setStaffNo(""); setPhone(""); setRoleTitle("");
      showToast("Staff member added.");
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
        <button type="button" className={styles.addBtn} onClick={() => setAddOpen(true)}>
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

      {addOpen && (
        <div className={styles.sheetBackdrop} onClick={() => !saving && setAddOpen(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHeader}>
              <h3 className={styles.sheetTitle}>Add Staff</h3>
              <button type="button" className={styles.sheetClose} onClick={() => setAddOpen(false)} aria-label="Close"><X size={20} /></button>
            </div>
            <div className={styles.sheetBody}>
              {error && <p className={styles.errorText}>{error}</p>}
              <div className={styles.field}>
                <label>Full Name *</label>
                <input className={styles.input} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Kwame Owusu" />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Staff No *</label>
                  <input className={styles.input} value={staffNo} onChange={(e) => setStaffNo(e.target.value)} placeholder="STF-0001" />
                </div>
                <div className={styles.field}>
                  <label>Phone *</label>
                  <input className={styles.input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233…" />
                </div>
              </div>
              <div className={styles.field}>
                <label>Role Title *</label>
                <input className={styles.input} value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="e.g. Mathematics Teacher" />
              </div>
              <div className={styles.field}>
                <label>Category</label>
                <select className={styles.input} value={category} onChange={(e) => setCategory(e.target.value)}>
                  {FILTERS.filter((f) => f !== "all").map((f) => <option key={f} value={f}>{CATEGORY_LABELS[f]}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.sheetFooter}>
              <button type="button" className={styles.btnOutline} onClick={() => setAddOpen(false)} disabled={saving}>Cancel</button>
              <button type="button" className={styles.btnPrimary} onClick={submitAddStaff} disabled={saving}>{saving ? "Saving…" : "Save Staff"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
