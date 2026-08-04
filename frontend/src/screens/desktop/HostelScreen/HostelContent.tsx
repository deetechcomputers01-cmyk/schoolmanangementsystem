"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  DoorOpen,
  BedDouble,
  AlertTriangle,
  Plus,
  X,
  Search,
  ChevronDown,
  LogOut,
  Download,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import styles from "./HostelScreen.module.css";

export interface Occupant {
  allocationId: string;
  studentId: string;
  name: string;
  admissionNo: string;
  className: string;
  bedNumber: number;
}
export interface RoomRow { id: string; name: string; capacity: number; occupants: Occupant[] }
export interface HostelRow { id: string; name: string; rooms: RoomRow[] }
export interface IncidentRow {
  id: string;
  description: string;
  studentName: string | null;
  roomLabel: string | null;
  reportedByName: string;
  createdAt: string;
}
export interface StudentOption { id: string; name: string; admissionNo: string; className: string }

export interface HostelContentProps {
  hostels: HostelRow[];
  incidents: IncidentRow[];
  unallocatedStudents: StudentOption[];
}
type Props = HostelContentProps;

type Tab = "rooms" | "incidents";

export interface FlatRoom { hostelId: string; hostelName: string; room: RoomRow }

export function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Room modal: view occupants, vacate, and allocate into free beds ────────
interface RoomModalProps {
  flatRooms: FlatRoom[];
  unallocatedStudents: StudentOption[];
  initialRoomId?: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

function RoomModal({ flatRooms, unallocatedStudents, initialRoomId, onClose, onSuccess, onError }: RoomModalProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [roomId, setRoomId] = useState(initialRoomId ?? "");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [bedNumber, setBedNumber] = useState("1");
  const [saving, setSaving] = useState(false);
  const [vacatingId, setVacatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const selected = flatRooms.find((f) => f.room.id === roomId);
  const hasSpace = selected ? selected.room.occupants.length < selected.room.capacity : false;

  const filteredStudents = useMemo(() => {
    const q = studentSearch.toLowerCase();
    if (!q) return unallocatedStudents;
    return unallocatedStudents.filter((s) => s.name.toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q));
  }, [unallocatedStudents, studentSearch]);

  function selectRoom(id: string) {
    setRoomId(id);
    setSelectedStudentId("");
    setStudentSearch("");
    setError("");
    const room = flatRooms.find((f) => f.room.id === id)?.room;
    const taken = new Set(room?.occupants.map((o) => o.bedNumber) ?? []);
    let bed = 1;
    while (taken.has(bed)) bed++;
    setBedNumber(String(bed));
  }

  async function submitAllocate() {
    if (!selected || !selectedStudentId) { setError("Select a student."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/hostel/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudentId, roomId: selected.room.id, bedNumber: Number(bedNumber) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setError(err?.error?.message ?? err?.message ?? "Failed to allocate.");
        return;
      }
      onSuccess("Student allocated successfully");
      router.refresh();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function vacate(studentId: string) {
    if (!(await confirm({ message: "Vacate this student from their bed?", confirmLabel: "Vacate" }))) return;
    setVacatingId(studentId);
    try {
      const res = await fetch(`/api/hostel/allocations?studentId=${studentId}`, { method: "DELETE" });
      if (res.ok) {
        onSuccess("Student vacated");
        router.refresh();
      } else {
        onError("Failed to vacate student");
      }
    } finally {
      setVacatingId(null);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={() => !saving && onClose()}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Manage Room</h2>
            <p className={styles.modalSub}>View occupants, vacate beds, or allocate a student.</p>
          </div>
          <button className={styles.modalClose} onClick={onClose}><X size={18} /></button>
        </div>
        <div className={styles.modalBody}>
          {error && <p className={styles.errorText}>{error}</p>}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Room</label>
            <div className={styles.selectWrap}>
              <select className={styles.formSelect} value={roomId} onChange={(e) => selectRoom(e.target.value)}>
                <option value="">Select a room…</option>
                {flatRooms.map((f) => (
                  <option key={f.room.id} value={f.room.id}>
                    {f.hostelName} · {f.room.name} ({f.room.occupants.length}/{f.room.capacity})
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className={styles.selectChevron} />
            </div>
          </div>

          {selected && (
            <>
              <div className={styles.roomSummary}>
                <span className={styles.roomSummaryName}>{selected.hostelName} · {selected.room.name}</span>
                <span className={styles.roomSummaryOcc}>{selected.room.occupants.length}/{selected.room.capacity} occupied</span>
              </div>

              <div className={styles.occupantList}>
                {selected.room.occupants.length === 0 && <p className={styles.noStudentsHint}>No occupants yet.</p>}
                {selected.room.occupants.map((o) => (
                  <div key={o.allocationId} className={styles.occupantRow}>
                    <div>
                      <div className={styles.occupantName}>Bed {o.bedNumber} · {o.name}</div>
                      <div className={styles.occupantMeta}>{o.admissionNo} · {o.className}</div>
                    </div>
                    <button className={styles.vacateBtn} onClick={() => vacate(o.studentId)} disabled={vacatingId === o.studentId} title="Vacate">
                      <LogOut size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {hasSpace && (
                <div className={styles.addOccupantBox}>
                  <span className={styles.sectionLabel}>Allocate Student</span>
                  <div className={styles.searchWrap} style={{ width: "100%" }}>
                    <Search size={14} className={styles.searchIcon} />
                    <input className={styles.searchInput} placeholder="Search unallocated students…" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
                  </div>
                  <div className={styles.studentList}>
                    {filteredStudents.map((s) => (
                      <label key={s.id} className={styles.studentItem}>
                        <input type="radio" name="student" checked={selectedStudentId === s.id} onChange={() => setSelectedStudentId(s.id)} />
                        <span>{s.name}</span>
                        <span className={styles.studentItemMeta}>{s.admissionNo} · {s.className}</span>
                      </label>
                    ))}
                    {filteredStudents.length === 0 && <p className={styles.noStudentsHint}>No unallocated students match.</p>}
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Bed Number</label>
                    <input className={styles.formInput} type="number" min={1} value={bedNumber} onChange={(e) => setBedNumber(e.target.value)} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnCancel} onClick={onClose} disabled={saving}>Close</button>
          {selected && hasSpace && (
            <button className={styles.btnPrimary} onClick={submitAllocate} disabled={saving || !selectedStudentId}>
              {saving ? "Allocating…" : "Allocate"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Log incident modal ──────────────────────────────────────────────────────
function IncidentModal({ onClose, onSuccess, onError }: { onClose: () => void; onSuccess: (msg: string) => void; onError: (msg: string) => void }) {
  const router = useRouter();
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!desc.trim()) { setError("Description is required."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/hostel/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc.trim() }),
      });
      if (!res.ok) { setError("Failed to log incident."); onError("Failed to log incident"); return; }
      onSuccess("Incident logged");
      router.refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={() => !saving && onClose()}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Log Maintenance Incident</h2>
          <button className={styles.modalClose} onClick={onClose}><X size={18} /></button>
        </div>
        <div className={styles.modalBody}>
          {error && <p className={styles.errorText}>{error}</p>}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Description *</label>
            <textarea className={styles.formInput} rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What happened?" />
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnCancel} onClick={onClose} disabled={saving}>Cancel</button>
          <button className={styles.btnPrimary} onClick={submit} disabled={saving}>{saving ? "Saving…" : "Log Incident"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export function HostelContent({ hostels, incidents, unallocatedStudents }: Props) {
  const [tab, setTab] = useState<Tab>("rooms");
  const [search, setSearch] = useState("");
  const [hostelFilter, setHostelFilter] = useState("");
  const { showToast } = useToast();

  type ModalState = { type: "room"; roomId?: string } | { type: "incident" } | null;
  const [modal, setModal] = useState<ModalState>(null);

  const flatRooms: FlatRoom[] = useMemo(
    () => hostels.flatMap((h) => h.rooms.map((room) => ({ hostelId: h.id, hostelName: h.name, room }))),
    [hostels]
  );

  const totalRooms = flatRooms.length;
  const totalBeds = flatRooms.reduce((s, f) => s + f.room.capacity, 0);
  const occupiedBeds = flatRooms.reduce((s, f) => s + f.room.occupants.length, 0);
  const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const filteredRooms = flatRooms.filter((f) => {
    if (hostelFilter && f.hostelId !== hostelFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return f.hostelName.toLowerCase().includes(q) || f.room.name.toLowerCase().includes(q);
  });

  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / PAGE_SIZE));
  const pageRooms = filteredRooms.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function exportCsv() {
    const rows = [
      ["Hostel", "Room", "Capacity", "Occupied", "Students"],
      ...filteredRooms.map((f) => [
        f.hostelName,
        f.room.name,
        String(f.room.capacity),
        String(f.room.occupants.length),
        f.room.occupants.map((o) => o.name).join("; "),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hostel-rooms.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Hostel Management</h1>
          <p className={styles.subtitle}>Manage institutional housing facilities, room assignments, and occupancy.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnOutline} onClick={() => setModal({ type: "incident" })}>
            <AlertTriangle size={15} /> Log Incident
          </button>
          <button className={styles.btnPrimary} onClick={() => setModal({ type: "room" })}>
            <Plus size={15} /> Allocate Room
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox}><Building2 size={20} /></div>
          <div>
            <p className={styles.statLabel}>Total Hostels</p>
            <p className={styles.statValue}>{hostels.length}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIconBox}><DoorOpen size={20} /></div>
          <div>
            <p className={styles.statLabel}>Total Rooms</p>
            <p className={styles.statValue}>{totalRooms}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIconBox}><BedDouble size={20} /></div>
          <div>
            <p className={styles.statLabel}>Occupancy Rate</p>
            <div className={styles.statValueRow}>
              <span className={styles.statValue}>{occupancyPct}%</span>
              <span className={styles.statValueSub}>({occupiedBeds} / {totalBeds})</span>
            </div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconBoxAlert}`}><AlertTriangle size={20} /></div>
          <div>
            <p className={styles.statLabel}>Incidents Logged</p>
            <p className={`${styles.statValue} ${incidents.length > 0 ? styles.statValueAlert : ""}`}>{incidents.length}</p>
          </div>
        </div>
      </div>

      <div className={styles.mainCard}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === "rooms" ? styles.tabActive : ""}`} onClick={() => setTab("rooms")}>Rooms</button>
          <button className={`${styles.tab} ${tab === "incidents" ? styles.tabActive : ""}`} onClick={() => setTab("incidents")}>
            Maintenance Incidents
            {incidents.length > 0 && <span className={styles.tabBadge}>{incidents.length}</span>}
          </button>
        </div>

        {tab === "rooms" && (
          <>
            <div className={styles.filterBar}>
              <div className={styles.searchWrap}>
                <Search size={14} className={styles.searchIcon} />
                <input className={styles.searchInput} placeholder="Search rooms or hostels…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <div className={styles.filterRight}>
                <div className={styles.selectWrap}>
                  <select className={styles.select} value={hostelFilter} onChange={(e) => { setHostelFilter(e.target.value); setPage(1); }}>
                    <option value="">All Hostels</option>
                    {hostels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                  <ChevronDown size={14} className={styles.selectChevron} />
                </div>
                <button className={styles.btnOutline} onClick={exportCsv} disabled={filteredRooms.length === 0}>
                  <Download size={15} /> Export
                </button>
              </div>
            </div>

            {pageRooms.length === 0 ? (
              <div className={styles.tabEmpty}>
                <Building2 size={32} className={styles.emptyIcon} />
                <p>{flatRooms.length === 0 ? "No hostels configured yet." : "No rooms match your search."}</p>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Hostel Name</th>
                      <th>Room</th>
                      <th className={styles.center}>Capacity</th>
                      <th>Occupancy Status</th>
                      <th>Students</th>
                      <th className={styles.right}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRooms.map((f) => {
                      const occ = f.room.occupants.length;
                      const full = occ >= f.room.capacity;
                      const pct = f.room.capacity > 0 ? Math.min(100, Math.round((occ / f.room.capacity) * 100)) : 0;
                      const shown = f.room.occupants.slice(0, 4);
                      const extra = f.room.occupants.length - shown.length;
                      return (
                        <tr key={f.room.id} className={styles.dataRow}>
                          <td className={styles.hostelName}>{f.hostelName}</td>
                          <td className={styles.roomMono}>{f.room.name}</td>
                          <td className={styles.center}>{f.room.capacity}</td>
                          <td>
                            <div className={styles.occCell}>
                              <div className={styles.occBar}>
                                <div
                                  className={`${styles.occFill} ${full ? styles.occFillFull : occ === 0 ? styles.occFillLow : ""}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className={`${styles.occLabel} ${full ? styles.occLabelFull : ""}`}>
                                {full ? "FULL" : `${occ} / ${f.room.capacity}`}
                              </span>
                            </div>
                          </td>
                          <td>
                            {f.room.occupants.length === 0 ? (
                              <span className={styles.noOccupants}>—</span>
                            ) : (
                              <div className={styles.avatarStack}>
                                {shown.map((o) => (
                                  <div key={o.allocationId} className={styles.avatarChip} title={o.name}>{initials(o.name)}</div>
                                ))}
                                {extra > 0 && <div className={styles.avatarMore}>+{extra}</div>}
                              </div>
                            )}
                          </td>
                          <td className={styles.right}>
                            <button className={styles.linkBtn} onClick={() => setModal({ type: "room", roomId: f.room.id })}>
                              {full ? "Manage" : "Allocate"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {filteredRooms.length > 0 && (
              <div className={styles.paginationBar}>
                <span className={styles.paginationInfo}>Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filteredRooms.length)} of {filteredRooms.length} rooms</span>
                <div className={styles.pageButtons}>
                  <button className={styles.pageBtn} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`} onClick={() => setPage(p)}>{p}</button>
                  ))}
                  <button className={styles.pageBtn} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "incidents" && (
          <div className={styles.tableWrap}>
            {incidents.length === 0 ? (
              <div className={styles.tabEmpty}>
                <AlertTriangle size={32} className={styles.emptyIcon} />
                <p>No incidents logged yet.</p>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Student</th>
                    <th>Room</th>
                    <th>Reported By</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((i) => (
                    <tr key={i.id} className={styles.dataRow}>
                      <td className={styles.tdMuted}>{fmtDate(i.createdAt)}</td>
                      <td>{i.description}</td>
                      <td>{i.studentName ?? "—"}</td>
                      <td className={styles.tdMuted}>{i.roomLabel ?? "—"}</td>
                      <td className={styles.tdMuted}>{i.reportedByName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {modal?.type === "room" && (
        <RoomModal
          flatRooms={flatRooms}
          unallocatedStudents={unallocatedStudents}
          initialRoomId={modal.roomId}
          onClose={() => setModal(null)}
          onSuccess={(msg) => showToast(msg, "success")}
          onError={(msg) => showToast(msg, "error")}
        />
      )}
      {modal?.type === "incident" && (
        <IncidentModal
          onClose={() => setModal(null)}
          onSuccess={(msg) => showToast(msg, "success")}
          onError={(msg) => showToast(msg, "error")}
        />
      )}
    </div>
  );
}
