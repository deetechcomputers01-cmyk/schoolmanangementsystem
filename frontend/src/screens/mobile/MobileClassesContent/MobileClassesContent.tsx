"use client";

/**
 * MobileClassesContent — bespoke mobile view for Classes & Subjects.
 *
 * Every field/action here traces back to ClassesContent.tsx (the real desktop
 * component), ClassesScreen.tsx (the server data-fetch wrapper), and the real
 * /api/classes endpoints:
 *   - class list, stats, Create/Edit Class forms -> same fields/POST+PATCH
 *     /api/classes[/:id] as desktop's saveClass()/saveEdit()
 *   - "Subject Assignments" sub-list -> real per-class subjects (ClassRow.subjects)
 *     and the full subjects prop (teacherName/status), matched by class name
 *   - read-only "{class} Overview" sheet -> same readiness checklist logic as
 *     desktop's row-click detail modal
 *
 * The Stitch mockup's "Add Subject" action has NO real backing anywhere —
 * there is no /api/subjects route at all (subjects are seed/import-only;
 * desktop's own "Import Subjects" button has no onClick handler either) — so
 * it is intentionally NOT reproduced. "Assign Teacher" is real only at the
 * class-teacher level (Class.classTeacherId via PATCH /api/classes/:id), so
 * that action opens the same Edit Class sheet used for "Edit Class" (desktop
 * has no separate per-subject teacher-assignment flow either). "View
 * Students" links to the real /students page; it does not deep-link into a
 * pre-filtered list because the Students screens (desktop and mobile) only
 * filter by class via local component state, not a URL/query param.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, Users, BookOpen, DoorOpen, AlertTriangle, CheckCircle2, Check,
  ChevronDown, ChevronUp, UserPlus, Eye, Edit2, Info,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import styles from "./MobileClassesContent.module.css";

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

type TabKey = "classes" | "subjects" | "assignments";
type ModalMode = "none" | "detail" | "create" | "edit";
type LevelFilter = "all" | "KG" | "Primary" | "JHS" | "SHS" | "assigned" | "unassigned";

const LEVELS = ["KG", "Primary", "JHS", "SHS"];
const CLASS_FILTERS: { key: LevelFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "KG", label: "KG" },
  { key: "Primary", label: "Primary" },
  { key: "JHS", label: "JHS" },
  { key: "SHS", label: "SHS" },
  { key: "assigned", label: "Assigned" },
  { key: "unassigned", label: "Unassigned" },
];

function statusLabel(status: ClassStatus) {
  return status === "active" ? "Active" : status === "full" ? "Full" : status === "inactive" ? "Inactive" : "Pending";
}

export function MobileClassesContent({ classes, subjects, staff, stats }: Props) {
  const router = useRouter();
  const { showToast } = useToast();

  const [tab, setTab] = useState<TabKey>("classes");
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Exactly one modal can be open at a time.
  const [modalMode, setModalMode] = useState<ModalMode>("none");
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
  const teachersAssignedCount = useMemo(() => subjects.filter((s) => s.status === "assigned").length, [subjects]);

  function closeModal() {
    if (saving) return;
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

  function openCreate() {
    setMName(""); setMLevel("Primary"); setMRoom(""); setMCapacity("40"); setMTeacherId("");
    setModalMode("create");
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

  function openDetail(c: ClassRow) {
    setActiveClassId(c.id);
    setModalMode("detail");
  }

  async function saveClass() {
    if (!mName.trim()) { showToast("Class name is required.", "error"); return; }
    warnIfTeacherAlreadyAssigned(mTeacherId, null);
    setSaving(true);
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
      if (!res.ok) { showToast("Failed to create class.", "error"); return; }
      showToast("Class created successfully");
      closeModal();
      router.refresh();
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    if (!detailClass || !eName.trim()) return;
    warnIfTeacherAlreadyAssigned(eTeacherId, detailClass.id);
    setSaving(true);
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
      if (!res.ok) { showToast("Failed to update class.", "error"); return; }
      showToast("Class updated successfully");
      closeModal();
      router.refresh();
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  function subjectsForClass(c: ClassRow): SubjectRow[] {
    return subjects.filter((s) => s.className === c.name);
  }

  const filteredClasses = useMemo(() => classes.filter((c) => {
    if (LEVELS.includes(levelFilter) && c.level !== levelFilter) return false;
    if (levelFilter === "assigned" && !c.teacherId) return false;
    if (levelFilter === "unassigned" && c.teacherId) return false;
    const q = search.trim().toLowerCase();
    if (q && !c.name.toLowerCase().includes(q) && !(c.room ?? "").toLowerCase().includes(q) && !(c.teacher ?? "").toLowerCase().includes(q)) return false;
    return true;
  }), [classes, levelFilter, search]);

  const filteredSubjects = useMemo(() => subjects.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.className.toLowerCase().includes(q) || (s.teacherName ?? "").toLowerCase().includes(q);
  }), [subjects, search]);

  const assignmentGroups = useMemo(() => {
    const map = new Map<string, SubjectRow[]>();
    for (const s of filteredSubjects) {
      const list = map.get(s.className) ?? [];
      list.push(s);
      map.set(s.className, list);
    }
    return Array.from(map.entries())
      .map(([className, list]) => ({ className, list, unassignedCount: list.filter((s) => s.status === "unassigned").length }))
      .sort((a, b) => b.unassignedCount - a.unassignedCount || a.className.localeCompare(b.className));
  }, [filteredSubjects]);

  return (
    <div className={styles.root}>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Classes</span>
          <strong className={styles.kpiValue}>{stats.activeClasses}</strong>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Subjects</span>
          <strong className={styles.kpiValue}>{stats.totalSubjects}</strong>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Teachers Assigned</span>
          <strong className={`${styles.kpiValue} ${styles.kpiValueGood}`}>{teachersAssignedCount}</strong>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Unassigned</span>
          <div className={styles.kpiWarnRow}>
            {stats.unassigned > 0 && <AlertTriangle size={15} />}
            <strong className={`${styles.kpiValue} ${stats.unassigned > 0 ? styles.kpiValueBad : ""}`}>{stats.unassigned}</strong>
          </div>
        </div>
      </div>

      <div className={kit.segmented}>
        {(["classes", "subjects", "assignments"] as TabKey[]).map((k) => (
          <button
            key={k}
            type="button"
            className={`${kit.segBtn} ${tab === k ? kit.segBtnActive : ""}`}
            onClick={() => setTab(k)}
          >
            {k === "classes" ? "Classes" : k === "subjects" ? "Subjects" : "Assignments"}
          </button>
        ))}
      </div>

      <label className={kit.searchWrap}>
        <Search size={16} className={kit.searchIcon} />
        <input
          className={`${kit.input} ${kit.searchInput}`}
          placeholder={tab === "classes" ? "Search class, room, or teacher" : "Search class, subject, or teacher"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      {tab === "classes" && (
        <div className={styles.chipRow}>
          {CLASS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`${styles.chip} ${levelFilter === f.key ? styles.chipActive : ""}`}
              onClick={() => setLevelFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {tab === "classes" && (
        <button type="button" className={styles.addBtn} onClick={openCreate}>
          <Plus size={18} /> Add Class
        </button>
      )}

      {tab === "classes" && (
        <div className={styles.list}>
          {filteredClasses.length === 0 ? (
            <p className={kit.emptyText}>No classes match your search.</p>
          ) : filteredClasses.map((c) => {
            const isOpen = expandedId === c.id;
            const classSubjects = subjectsForClass(c);
            return (
              <article key={c.id} className={`${styles.card} ${isOpen ? styles.cardOpen : ""}`}>
                <button type="button" className={styles.cardTop} onClick={() => setExpandedId(isOpen ? null : c.id)}>
                  <div className={styles.cardTopLeft}>
                    <div className={styles.cardTitleRow}>
                      <h4 className={styles.className}>{c.name}</h4>
                      <span className={`${styles.statusBadge} ${styles[`status_${c.status}`]}`}>{statusLabel(c.status)}</span>
                    </div>
                    <p className={styles.teacherLine}>{c.teacher ?? "No teacher assigned"}</p>
                  </div>
                  {isOpen ? <ChevronUp size={18} className={styles.chevron} /> : <ChevronDown size={18} className={styles.chevron} />}
                </button>

                <div className={styles.metaRow}>
                  <span><Users size={14} /> {c.enrolled} Students</span>
                  <span><BookOpen size={14} /> {classSubjects.length} Subjects</span>
                  <span><DoorOpen size={14} /> {c.room ?? "No room"}</span>
                </div>

                {isOpen && (
                  <>
                    <div className={styles.subjectBlock}>
                      <h5 className={styles.subjectBlockTitle}>Subject Assignments</h5>
                      {classSubjects.length === 0 ? (
                        <p className={kit.emptyText}>No subjects assigned to this class yet.</p>
                      ) : (
                        <ul className={styles.subjectUl}>
                          {classSubjects.map((s) => (
                            <li key={s.id} className={`${styles.subjectRow} ${s.status === "unassigned" ? styles.subjectRowWarn : ""}`}>
                              <div className={styles.subjectIcon}><BookOpen size={14} /></div>
                              <div className={styles.subjectInfo}>
                                <p className={styles.subjectName}>{s.name}</p>
                                <p className={s.status === "unassigned" ? styles.subjectTeacherWarn : styles.subjectTeacher}>
                                  {s.teacherName ?? "Unassigned"}
                                </p>
                              </div>
                              {s.status === "assigned"
                                ? <CheckCircle2 size={18} className={styles.iconGood} />
                                : <AlertTriangle size={18} className={styles.iconWarn} />}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className={styles.actionGrid}>
                      <button type="button" className={styles.actionBtn} onClick={() => router.push("/students")}>
                        <Eye size={16} /> View Students
                      </button>
                      <button type="button" className={styles.actionBtn} onClick={() => openEditModal(c)}>
                        <UserPlus size={16} /> Assign Teacher
                      </button>
                      <button type="button" className={styles.actionBtn} onClick={() => openDetail(c)}>
                        <Info size={16} /> Overview
                      </button>
                      <button type="button" className={styles.actionBtnPrimary} onClick={() => openEditModal(c)}>
                        <Edit2 size={16} /> Edit Class
                      </button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}

      {tab === "subjects" && (
        <div className={styles.list}>
          {filteredSubjects.length === 0 ? (
            <p className={kit.emptyText}>No subjects match your search.</p>
          ) : filteredSubjects.map((s) => (
            <div key={s.id} className={styles.subjectCard}>
              <div className={styles.subjectCardTop}>
                <div>
                  <h4 className={styles.subjectCardName}>{s.name}</h4>
                  <p className={styles.subjectCardMeta}>{s.code} • {s.className}</p>
                </div>
                <span className={`${styles.statusBadge} ${s.status === "assigned" ? styles.status_active : styles.status_pending}`}>
                  {s.status === "assigned" ? "Assigned" : "Unassigned"}
                </span>
              </div>
              <p className={s.teacherName ? styles.subjectTeacher : styles.subjectTeacherWarn}>
                {s.teacherName ?? "No teacher assigned"}
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === "assignments" && (
        <div className={styles.list}>
          {assignmentGroups.length === 0 ? (
            <p className={kit.emptyText}>No assignment data matches your search.</p>
          ) : assignmentGroups.map((g) => (
            <div key={g.className} className={styles.groupCard}>
              <div className={styles.groupHeader}>
                <h4 className={styles.groupTitle}>{g.className}</h4>
                <span className={g.unassignedCount > 0 ? styles.groupBadgeWarn : styles.groupBadgeGood}>
                  {g.list.length - g.unassignedCount}/{g.list.length} assigned
                </span>
              </div>
              <ul className={styles.subjectUl}>
                {g.list.map((s) => (
                  <li key={s.id} className={`${styles.subjectRow} ${s.status === "unassigned" ? styles.subjectRowWarn : ""}`}>
                    <div className={styles.subjectIcon}><BookOpen size={14} /></div>
                    <div className={styles.subjectInfo}>
                      <p className={styles.subjectName}>{s.name}</p>
                      <p className={s.status === "unassigned" ? styles.subjectTeacherWarn : styles.subjectTeacher}>
                        {s.teacherName ?? "Unassigned"}
                      </p>
                    </div>
                    {s.status === "assigned"
                      ? <CheckCircle2 size={18} className={styles.iconGood} />
                      : <AlertTriangle size={18} className={styles.iconWarn} />}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Read-only class Overview sheet */}
      <MobileSheet
        open={modalMode === "detail" && !!detailClass}
        onClose={closeModal}
        title={detailClass ? `${detailClass.name} Overview` : ""}
        headerExtra={detailClass && (
          <button type="button" className={styles.headerEditBtn} onClick={() => openEditModal(detailClass)} aria-label="Edit class">
            <Edit2 size={15} />
          </button>
        )}
      >
        {detailClass && (
          <>
            {!detailClass.isActive && (
              <div className={`${kit.banner} ${kit.bannerWarn}`}>Inactive — hidden from class pickers app-wide</div>
            )}
            <div className={styles.teacherBlock}>
              <div className={styles.teacherAvatar}>
                {detailClass.teacher ? detailClass.teacher.split(" ").map((n) => n[0]).join("").slice(0, 2) : "?"}
              </div>
              <div>
                <p className={styles.teacherName}>{detailClass.teacher ?? "No teacher assigned"}</p>
                <p className={styles.teacherRole}>Class Teacher</p>
              </div>
            </div>

            <h5 className={styles.subjectBlockTitle}>Assigned Subjects</h5>
            <div className={styles.checklist}>
              {detailClass.subjects.length === 0 ? (
                <p className={kit.emptyText}>No subjects assigned to this class yet.</p>
              ) : detailClass.subjects.map((s) => (
                <div key={s.id} className={styles.checklistRow}>
                  <span className={!s.assigned ? styles.subjectTeacherWarn : styles.subjectName}>{s.name}</span>
                  {s.assigned
                    ? <Check size={14} className={styles.iconGood} />
                    : <AlertTriangle size={14} className={styles.iconWarn} />}
                </div>
              ))}
            </div>

            <h5 className={styles.subjectBlockTitle}>Readiness Checklist</h5>
            <ul className={styles.checklist}>
              <li className={styles.checklistRow}>
                {detailClass.teacher ? <CheckCircle2 size={16} className={styles.iconGood} /> : <div className={styles.checkEmpty} />}
                <span>Class teacher assigned</span>
              </li>
              <li className={styles.checklistRow}>
                {detailClass.room ? <CheckCircle2 size={16} className={styles.iconGood} /> : <div className={styles.checkEmpty} />}
                <span>Room allocated</span>
              </li>
              <li className={styles.checklistRow}>
                {detailClass.ready ? <CheckCircle2 size={16} className={styles.iconGood} /> : <div className={styles.checkEmpty} />}
                <span>Core subjects staffed</span>
              </li>
            </ul>
          </>
        )}
      </MobileSheet>

      {/* Create/Edit Class sheet — reuses the exact real POST/PATCH /api/classes shapes */}
      <MobileSheet
        open={modalMode === "create" || modalMode === "edit"}
        onClose={closeModal}
        title={modalMode === "edit" && detailClass ? `Edit ${detailClass.name}` : "Create New Class"}
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={closeModal} disabled={saving}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={modalMode === "edit" ? saveEdit : saveClass} disabled={saving}>
            {saving ? "Saving…" : modalMode === "edit" ? "Save Changes" : "Create Class"}
          </button>
        </>}
      >
        <div className={kit.field}>
          <label>Level *</label>
          <select
            className={kit.select}
            value={modalMode === "edit" ? eLevel : mLevel}
            onChange={(e) => modalMode === "edit" ? setELevel(e.target.value) : setMLevel(e.target.value)}
          >
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className={kit.field}>
          <label>Class Name *</label>
          <input
            className={kit.input}
            type="text"
            placeholder="e.g. Form 1C"
            value={modalMode === "edit" ? eName : mName}
            onChange={(e) => modalMode === "edit" ? setEName(e.target.value) : setMName(e.target.value)}
          />
        </div>
        <div className={kit.fieldRow}>
          <div className={kit.field}>
            <label>Room</label>
            <input
              className={kit.input}
              type="text"
              value={modalMode === "edit" ? eRoom : mRoom}
              onChange={(e) => modalMode === "edit" ? setERoom(e.target.value) : setMRoom(e.target.value)}
            />
          </div>
          <div className={kit.field}>
            <label>Capacity</label>
            <input
              className={kit.input}
              type="number"
              value={modalMode === "edit" ? eCapacity : mCapacity}
              onChange={(e) => modalMode === "edit" ? setECapacity(e.target.value) : setMCapacity(e.target.value)}
            />
          </div>
        </div>
        <div className={kit.field}>
          <label>Class Teacher</label>
          <select
            className={kit.select}
            value={modalMode === "edit" ? eTeacherId : mTeacherId}
            onChange={(e) => modalMode === "edit" ? setETeacherId(e.target.value) : setMTeacherId(e.target.value)}
          >
            <option value="">No teacher assigned</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        {modalMode === "edit" && (
          <>
            <div className={kit.field}>
              <label>Promotion Order</label>
              <input className={kit.input} type="number" value={eOrder} onChange={(e) => setEOrder(e.target.value)} placeholder="e.g. 6" />
              <p className={kit.helperText}>Used to resolve next class on promotion.</p>
            </div>
            <label className={kit.checkboxRow}>
              <input type="checkbox" checked={eActive} onChange={(e) => setEActive(e.target.checked)} />
              <span className={kit.checkboxLabel}>Active (visible and selectable across the app)</span>
            </label>
          </>
        )}
      </MobileSheet>
    </div>
  );
}
