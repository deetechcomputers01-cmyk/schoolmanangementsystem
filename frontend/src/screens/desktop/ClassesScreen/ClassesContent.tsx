"use client";

import { useMemo, useState } from "react";
import {
  Upload, Plus, Users, BookOpen, PieChart, AlertTriangle, CheckCircle2,
  X, Check, Edit2, ChevronRight, ChevronLeft, Search, SlidersHorizontal, MoreVertical,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import styles from "./ClassesScreen.module.css";

// ── Types ──────────────────────────────────────────────────────────────────────
type ClassStatus = "active" | "full" | "pending" | "inactive";
type SubjectStatus = "assigned" | "unassigned";

interface ClassRow {
  id: string;
  name: string;
  level: string;
  isActive: boolean;
  order: number | null;
  teacher: string | null;
  teacherId: string | null;
  room: string | null;
  enrolled: number;
  capacity: number | null;
  status: ClassStatus;
  ready: boolean;
  subjects: { id: string; name: string; assigned: boolean }[];
}

interface SubjectRow {
  id: string;
  name: string;
  code: string;
  className: string;
  teacherName: string | null;
  status: SubjectStatus;
}

interface StaffRow { id: string; name: string; role: string }

interface Stats {
  activeClasses: number;
  totalSubjects: number;
  unassigned: number;
  readyPct: number;
}

interface Props {
  classes: ClassRow[];
  subjects: SubjectRow[];
  staff: StaffRow[];
  stats: Stats;
}

type TabKey = "classes" | "subjects";

const LEVELS = ["KG", "Primary", "JHS", "SHS"];
const PAGE_SIZE = 6;

function levelPillClass(level: string): string {
  const l = level.toLowerCase();
  if (l.includes("kg") || l.includes("pre")) return styles.levelKG;
  if (l.includes("jhs") || l.includes("junior")) return styles.levelJHS;
  if (l.includes("shs") || l.includes("senior")) return styles.levelSHS;
  return styles.levelBasic;
}

type ModalMode = "none" | "detail" | "create" | "edit";

export function ClassesContent({ classes, subjects, staff, stats }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("classes");
  // Exactly one modal can be open at a time — `modalMode` gates which JSX
  // block renders, so closing one can never leave another still mounted.
  const [modalMode, setModalMode] = useState<ModalMode>("none");
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const { showToast } = useToast();
  const [levelFilters, setLevelFilters] = useState<Set<string>>(new Set<string>());
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [capacityFilter, setCapFilter] = useState<"all" | "available" | "over">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [mLevel, setMLevel] = useState("Primary");
  const [mName, setMName] = useState("");
  const [mRoom, setMRoom] = useState("");
  const [mCapacity, setMCapacity] = useState("40");
  const [mTeacherId, setMTeacherId] = useState("");
  const [eName, setEName] = useState("");
  const [eLevel, setELevel] = useState("Primary");
  const [eRoom, setERoom] = useState("");
  const [eCapacity, setECapacity] = useState("");
  const [eOrder, setEOrder] = useState("");
  const [eActive, setEActive] = useState(true);
  const [eTeacherId, setETeacherId] = useState("");

  const detailClass = classes.find((c) => c.id === activeClassId) ?? null;

  function closeModal() {
    setModalMode("none");
    setActiveClassId(null);
  }

  function warnIfTeacherAlreadyAssigned(teacherId: string, currentClassId: string | null) {
    if (!teacherId) return;
    const teacher = staff.find((s) => s.id === teacherId);
    const other = classes.find((c) => c.teacherId === teacherId && c.id !== currentClassId);
    if (teacher && other) {
      showToast(`${teacher.name} is already the class teacher for ${other.name} — now also being assigned here.`, "warning");
    }
  }

  function toggleLevel(l: string) {
    setLevelFilters((prev) => {
      const n = new Set(prev);
      n.has(l) ? n.delete(l) : n.add(l);
      return n;
    });
    setPage(1);
  }

  const filteredClasses = useMemo(() => classes.filter((c) => {
    if (levelFilters.size > 0 && !levelFilters.has(c.level)) return false;
    if (capacityFilter === "available" && c.capacity !== null && c.enrolled >= c.capacity) return false;
    if (capacityFilter === "over" && (c.capacity === null || c.enrolled < c.capacity)) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !(c.room ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [classes, levelFilters, capacityFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredClasses.length / PAGE_SIZE));
  const pageClasses = filteredClasses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function saveClass() {
    if (!mName.trim()) return;
    warnIfTeacherAlreadyAssigned(mTeacherId, null);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mName.trim(),
          level: mLevel,
          room: mRoom.trim() || null,
          capacity: mCapacity.trim() ? Number(mCapacity) : null,
          classTeacherId: mTeacherId || null,
        }),
      });
      if (res.ok) {
        closeModal();
        setMName(""); setMLevel("Primary"); setMRoom(""); setMCapacity("40"); setMTeacherId("");
        showToast("Class created successfully");
        window.location.reload();
      }
    } catch {
      // network error — toast still visible
    }
  }

  function openEditModal(c: ClassRow) {
    setEName(c.name);
    setELevel(LEVELS.includes(c.level) ? c.level : "Primary");
    setERoom(c.room ?? "");
    setECapacity(c.capacity != null ? String(c.capacity) : "");
    setEOrder(c.order != null ? String(c.order) : "");
    setEActive(c.isActive);
    setETeacherId(c.teacherId ?? "");
    setActiveClassId(c.id);
    setModalMode("edit");
  }

  async function saveEdit() {
    if (!detailClass || !eName.trim()) return;
    warnIfTeacherAlreadyAssigned(eTeacherId, detailClass.id);
    try {
      const res = await fetch(`/api/classes/${detailClass.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: eName.trim(),
          level: eLevel,
          room: eRoom.trim() || null,
          capacity: eCapacity.trim() ? Number(eCapacity) : null,
          order: eOrder.trim() ? Number(eOrder) : null,
          isActive: eActive,
          classTeacherId: eTeacherId || null,
        }),
      });
      if (res.ok) {
        closeModal();
        showToast("Class updated successfully");
        window.location.reload();
      }
    } catch {
      // network error — toast still visible
    }
  }

  return (
    <div className={styles.root}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.breadcrumb}>
            <span>Academic Setup</span>
            <ChevronRight size={14} />
            <span className={styles.breadcrumbActive}>Classes &amp; Subjects</span>
          </div>
          <h1 className={styles.title}>Classes &amp; Subjects</h1>
          <p className={styles.subtitle}>Manage class assignments, capacities, and curriculum mappings.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnOutline}>
            <Upload size={15} /> Import Subjects
          </button>
          <button className={styles.btnPrimary} onClick={() => setModalMode("create")}>
            <Plus size={15} /> Add Class
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statAccent}`}>
          <div className={styles.statBlob} />
          <div className={styles.statIconBadge}><BookOpen size={18} /></div>
          <span className={styles.statLabel}>Active Classes</span>
          <span className={styles.statValue}>{stats.activeClasses}</span>
        </div>
        <div className={`${styles.statCard} ${styles.statInfo}`}>
          <div className={styles.statBlob} />
          <div className={styles.statIconBadge}><Users size={18} /></div>
          <span className={styles.statLabel}>Total Subjects</span>
          <span className={styles.statValue}>{stats.totalSubjects}</span>
        </div>
        <div className={`${styles.statCard} ${styles.statWarn}`}>
          <div className={styles.statBlob} />
          <div className={styles.statIconBadge}><PieChart size={18} /></div>
          <span className={styles.statLabel}>Ready for Timetable</span>
          <span className={styles.statValue}>{stats.readyPct}%</span>
        </div>
        <div className={`${styles.statCard} ${styles.statError}`}>
          <div className={styles.statBlob} />
          <div className={styles.statIconBadge}><AlertTriangle size={18} /></div>
          <span className={styles.statLabel}>Unassigned Subjects</span>
          <span className={`${styles.statValue} ${styles.statValueError}`}>{stats.unassigned}</span>
        </div>
      </div>

      {/* Main card */}
      <div className={styles.mainCard}>
        {/* Tabs */}
        <div className={styles.tabs}>
          {([["classes", "Classes"], ["subjects", "Subjects"]] as [TabKey, string][]).map(([k, l]) => (
            <button
              key={k}
              className={`${styles.tab} ${activeTab === k ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(k)}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder={activeTab === "classes" ? "Search classes by name or room…" : "Search subjects…"}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          {activeTab === "classes" && (
            <div className={styles.filterControls}>
              <div className={styles.selectWrap}>
                <select
                  className={styles.select}
                  value={capacityFilter}
                  onChange={(e) => { setCapFilter(e.target.value as typeof capacityFilter); setPage(1); }}
                >
                  <option value="all">All Levels</option>
                  <option value="available">Available Seats</option>
                  <option value="over">Over Capacity</option>
                </select>
                <ChevronRight size={13} className={styles.selectChevron} style={{ transform: "translateY(-50%) rotate(90deg)" }} />
              </div>
              <button className={styles.filterBtn} onClick={() => setShowMoreFilters((s) => !s)}>
                <SlidersHorizontal size={14} /> More Filters
              </button>
            </div>
          )}
        </div>

        {showMoreFilters && activeTab === "classes" && (
          <div className={styles.filterPanel}>
            {LEVELS.map((l) => (
              <label key={l} className={styles.filterChip}>
                <input
                  type="checkbox"
                  className={styles.filterCheck}
                  checked={levelFilters.has(l)}
                  onChange={() => toggleLevel(l)}
                />
                {l}
              </label>
            ))}
          </div>
        )}

        {/* Table */}
        <div className={styles.tableWrap}>
          {activeTab === "classes" && (
            <table className={styles.table}>
              <thead>
                <tr>
                  {["Class Name", "Level", "Room", "Enrolled / Capacity", "Status", "Ready", "Actions"].map((h) => (
                    <th key={h} className={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageClasses.map((c) => {
                  const pct = c.capacity ? Math.round((c.enrolled / c.capacity) * 100) : 0;
                  return (
                    <tr key={c.id} className={styles.tr} onClick={() => { setActiveClassId(c.id); setModalMode("detail"); }}>
                      <td className={`${styles.td} ${styles.tdBold}`}>
                        {c.name}
                        <span className={styles.teacherSub}>{c.teacher ?? "No teacher assigned"}</span>
                      </td>
                      <td className={styles.td}>
                        <span className={`${styles.levelPill} ${levelPillClass(c.level)}`}>{c.level}</span>
                      </td>
                      <td className={`${styles.td} ${styles.tdMuted}`}>{c.room ?? "—"}</td>
                      <td className={`${styles.td} ${styles.occCell}`}>
                        <div className={styles.occNumbers}>
                          <span className={styles.occEnrolled}>{c.enrolled}</span>
                          <span className={styles.occCapacity}>{c.capacity ?? "—"}</span>
                        </div>
                        {c.capacity !== null && (
                          <div className={styles.occBar}>
                            <div className={`${styles.occFill} ${pct >= 100 ? styles.occFillFull : ""}`} style={{ width: `${Math.min(100, pct)}%` }} />
                          </div>
                        )}
                      </td>
                      <td className={styles.td}>
                        <span className={`${styles.badge} ${c.status === "active" ? styles.badgeActive : c.status === "full" ? styles.badgeFull : c.status === "inactive" ? styles.badgeInactive : styles.badgePending}`}>
                          <span className={styles.badgeDot} />
                          {c.status === "active" ? "Active" : c.status === "full" ? "Full" : c.status === "inactive" ? "Inactive" : "Pending"}
                        </span>
                      </td>
                      <td className={styles.tdCenter}>
                        {c.ready
                          ? <CheckCircle2 size={18} className={styles.readyYes} />
                          : <AlertTriangle size={18} className={styles.readyNo} />}
                      </td>
                      <td className={styles.tdCenter} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.actionBtn} onClick={() => openEditModal(c)} title="Edit class">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeTab === "subjects" && (
            <table className={styles.table}>
              <thead>
                <tr>
                  {["Subject", "Code", "Class", "Teacher", "Status"].map((h) => (
                    <th key={h} className={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subjects.filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase())).map((s) => (
                  <tr key={s.id} className={styles.tr}>
                    <td className={`${styles.td} ${styles.tdBold}`}>{s.name}</td>
                    <td className={`${styles.td} ${styles.tdMono} ${styles.tdMuted}`}>{s.code}</td>
                    <td className={`${styles.td} ${styles.tdMuted}`}>{s.className}</td>
                    <td className={styles.td}>
                      {s.teacherName ? s.teacherName : <span className={styles.tdUnassigned}>Unassigned</span>}
                    </td>
                    <td className={styles.td}>
                      <span className={`${styles.badge} ${s.status === "assigned" ? styles.badgeActive : styles.badgePending}`}>
                        <span className={styles.badgeDot} />
                        {s.status === "assigned" ? "Assigned" : "Unassigned"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {activeTab === "classes" && filteredClasses.length > 0 && (
          <div className={styles.paginationBar}>
            <span className={styles.paginationInfo}>
              Showing <strong>{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredClasses.length)}</strong> of <strong>{filteredClasses.length}</strong> classes
            </span>
            <div className={styles.pageButtons}>
              <button className={styles.pageBtn} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`} onClick={() => setPage(p)}>
                  {p}
                </button>
              ))}
              <button className={styles.pageBtn} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Class detail modal (subjects + readiness) */}
      {modalMode === "detail" && detailClass && (
        <div className={`${styles.modalBackdrop} desktopOnly`} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalBody}>
              <div className={styles.detailHeader}>
                <h2 className={styles.detailTitle}>{detailClass.name} Overview</h2>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className={styles.editBtn} onClick={() => openEditModal(detailClass)}><Edit2 size={15} /></button>
                  <button className={styles.editBtn} onClick={closeModal}><X size={15} /></button>
                </div>
              </div>
              {!detailClass.isActive && (
                <p style={{ color: "var(--clr-error)", fontSize: "var(--text-xs)", fontWeight: 600, margin: "0 0 10px" }}>
                  Inactive — hidden from class pickers app-wide
                </p>
              )}
              <div className={styles.detailTeacher}>
                <div className={styles.teacherAvatar}>
                  {detailClass.teacher ? detailClass.teacher.split(" ").map((n) => n[0]).join("").slice(0, 2) : "?"}
                </div>
                <div>
                  <div className={styles.teacherName}>{detailClass.teacher ?? "No teacher assigned"}</div>
                  <div className={styles.teacherRole}>Class Teacher</div>
                </div>
              </div>

              <h3 className={styles.detailSectionTitle}>Assigned Subjects</h3>
              <div className={styles.subjectList}>
                {detailClass.subjects.length === 0 ? (
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--clr-app-muted)", margin: 0 }}>No subjects assigned to this class yet.</p>
                ) : detailClass.subjects.map((s) => (
                  <div key={s.id} className={styles.subjectItem}>
                    <span className={!s.assigned ? styles.subjectUnassigned : ""}>{s.name}</span>
                    {s.assigned
                      ? <Check size={14} className={styles.subjectCheckGreen} />
                      : <AlertTriangle size={14} className={styles.subjectWarn} />}
                  </div>
                ))}
              </div>

              <h3 className={`${styles.detailSectionTitle} ${styles.mt4}`}>Readiness Checklist</h3>
              <ul className={styles.checklist}>
                <li className={styles.checkItem}>
                  {detailClass.teacher
                    ? <CheckCircle2 size={16} className={styles.checkGreen} />
                    : <div className={styles.checkEmpty} />}
                  <span className={detailClass.teacher ? "" : styles.tdMuted}>Class teacher assigned</span>
                </li>
                <li className={styles.checkItem}>
                  {detailClass.room
                    ? <CheckCircle2 size={16} className={styles.checkGreen} />
                    : <div className={styles.checkEmpty} />}
                  <span className={detailClass.room ? "" : styles.tdMuted}>Room allocated</span>
                </li>
                <li className={styles.checkItem}>
                  {detailClass.ready
                    ? <CheckCircle2 size={16} className={styles.checkGreen} />
                    : <div className={styles.checkEmpty} />}
                  <span className={detailClass.ready ? "" : styles.tdMuted}>Core subjects fully staffed</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Create Class modal */}
      {modalMode === "create" && (
        <div className={`${styles.modalBackdrop} desktopOnly`} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Create New Class</h2>
              <button className={styles.modalClose} onClick={closeModal}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Level *</label>
                <select className={styles.formSelect} value={mLevel} onChange={(e) => setMLevel(e.target.value)}>
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Class Name *</label>
                <input className={styles.formInput} placeholder="e.g. Form 1C" type="text" value={mName} onChange={(e) => setMName(e.target.value)} />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Room</label>
                  <input className={styles.formInput} type="text" value={mRoom} onChange={(e) => setMRoom(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Capacity</label>
                  <input className={styles.formInput} type="number" value={mCapacity} onChange={(e) => setMCapacity(e.target.value)} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Class Teacher</label>
                <select className={styles.formSelect} value={mTeacherId} onChange={(e) => setMTeacherId(e.target.value)}>
                  <option value="">— No teacher assigned —</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={closeModal}>Cancel</button>
              <button className={styles.btnPrimary} onClick={saveClass}>Save Class</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class modal */}
      {modalMode === "edit" && detailClass && (
        <div className={`${styles.modalBackdrop} desktopOnly`} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Edit {detailClass.name}</h2>
              <button className={styles.modalClose} onClick={closeModal}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Level *</label>
                <select className={styles.formSelect} value={eLevel} onChange={(e) => setELevel(e.target.value)}>
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Class Name *</label>
                <input className={styles.formInput} type="text" value={eName} onChange={(e) => setEName(e.target.value)} />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Room</label>
                  <input className={styles.formInput} type="text" value={eRoom} onChange={(e) => setERoom(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Capacity</label>
                  <input className={styles.formInput} type="number" value={eCapacity} onChange={(e) => setECapacity(e.target.value)} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Class Teacher</label>
                <select className={styles.formSelect} value={eTeacherId} onChange={(e) => setETeacherId(e.target.value)}>
                  <option value="">— No teacher assigned —</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Promotion Order</label>
                <input className={styles.formInput} type="number" value={eOrder} onChange={(e) => setEOrder(e.target.value)} placeholder="e.g. 6 (used to resolve the 'next class' on promotion)" />
              </div>
              <label className={styles.filterChip} style={{ marginTop: 4 }}>
                <input type="checkbox" className={styles.filterCheck} checked={eActive} onChange={(e) => setEActive(e.target.checked)} />
                Active (visible and selectable across the app)
              </label>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={closeModal}>Cancel</button>
              <button className={styles.btnPrimary} onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
