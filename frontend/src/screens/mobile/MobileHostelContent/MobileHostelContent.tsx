"use client";

/**
 * MobileHostelContent — bespoke mobile view for the Hostel screen.
 *
 * Every field/action traces back to HostelContent.tsx (the real desktop
 * component) and the real /api/hostel endpoints — same allocate/vacate/
 * logIncident handlers.
 *
 * Deviations from the Stitch mockup (mobile_hostel_indigo_refined), because
 * the mockup depicts data this app doesn't track:
 *   - No "Block" or "Term" dimension exists on the Hostel/Room model —
 *     omitted the Block/Term dropdowns entirely.
 *   - No gender field on Hostel — omitted the "Boys"/"Girls" filter chips.
 *     Kept "All", per-hostel chips, and a real "Vacant" chip (rooms with
 *     free beds).
 *   - There is no exeat/leave/permission model anywhere in the hostel
 *     service — the mockup's "Weekend exeat request" permission card is
 *     entirely fabricated and has been omitted.
 *   - "Report Maint." on a room card opens the real Log Incident sheet with
 *     that room pre-attached (the API already accepts an optional roomId —
 *     desktop just never exposed it in its UI), rather than a separate
 *     fake maintenance-ticket flow.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, DoorOpen, BedDouble, AlertTriangle, Plus, Search,
  ChevronDown, ChevronUp, LogOut, UserPlus, Wrench,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import { initials } from "@/screens/desktop/HostelScreen/HostelContent";
import type { HostelContentProps, FlatRoom } from "@/screens/desktop/HostelScreen/HostelContent";
import styles from "./MobileHostelContent.module.css";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

type Tab = "rooms" | "incidents";

export function MobileHostelContent({ hostels, incidents, unallocatedStudents }: HostelContentProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [tab, setTab] = useState<Tab>("rooms");
  const [search, setSearch] = useState("");
  const [hostelFilter, setHostelFilter] = useState("");
  const [vacantOnly, setVacantOnly] = useState(false);
  const [openRoomId, setOpenRoomId] = useState<string | null>(null);

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
    if (vacantOnly && f.room.occupants.length >= f.room.capacity) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return f.hostelName.toLowerCase().includes(q) || f.room.name.toLowerCase().includes(q);
  });

  // ── Room sheet: view occupants, vacate, allocate ──────────────────────
  const [roomSheetOpen, setRoomSheetOpen] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [bedNumber, setBedNumber] = useState("1");
  const [savingAlloc, setSavingAlloc] = useState(false);
  const [vacatingId, setVacatingId] = useState<string | null>(null);

  const selectedRoom = flatRooms.find((f) => f.room.id === roomId);
  const hasSpace = selectedRoom ? selectedRoom.room.occupants.length < selectedRoom.room.capacity : false;

  const filteredStudents = useMemo(() => {
    const q = studentSearch.toLowerCase();
    if (!q) return unallocatedStudents;
    return unallocatedStudents.filter((s) => s.name.toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q));
  }, [unallocatedStudents, studentSearch]);

  function selectRoom(id: string) {
    setRoomId(id);
    setSelectedStudentId("");
    setStudentSearch("");
    const room = flatRooms.find((f) => f.room.id === id)?.room;
    const taken = new Set(room?.occupants.map((o) => o.bedNumber) ?? []);
    let bed = 1;
    while (taken.has(bed)) bed++;
    setBedNumber(String(bed));
  }

  function openRoomSheet(initialRoomId?: string) {
    setSelectedStudentId("");
    setStudentSearch("");
    if (initialRoomId) selectRoom(initialRoomId);
    else { setRoomId(""); setBedNumber("1"); }
    setRoomSheetOpen(true);
  }

  async function submitAllocate() {
    if (!selectedRoom || !selectedStudentId) { showToast("Select a student.", "error"); return; }
    setSavingAlloc(true);
    try {
      const res = await fetch("/api/hostel/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudentId, roomId: selectedRoom.room.id, bedNumber: Number(bedNumber) }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast("Student allocated");
      router.refresh();
      setRoomSheetOpen(false);
    } catch {
      showToast("Failed to allocate student", "error");
    } finally {
      setSavingAlloc(false);
    }
  }

  async function vacate(studentId: string) {
    const sure = await confirm({ message: "Vacate this student from their bed?", confirmLabel: "Vacate" });
    if (!sure) return;
    setVacatingId(studentId);
    try {
      const res = await fetch(`/api/hostel/allocations?studentId=${studentId}`, { method: "DELETE" });
      if (res.ok) { showToast("Student vacated"); router.refresh(); } else { showToast("Failed to vacate student", "error"); }
    } finally {
      setVacatingId(null);
    }
  }

  // ── Create room sheet ──────────────────────────────────────────────
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [newHostelId, setNewHostelId] = useState(hostels[0]?.id ?? "");
  const [newHostelMode, setNewHostelMode] = useState(hostels.length === 0);
  const [newHostelName, setNewHostelName] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomCapacity, setNewRoomCapacity] = useState("2");
  const [savingRoom, setSavingRoom] = useState(false);

  function openCreateRoom() {
    setNewHostelId(hostels[0]?.id ?? "");
    setNewHostelMode(hostels.length === 0);
    setNewHostelName("");
    setNewRoomName("");
    setNewRoomCapacity("2");
    setCreateRoomOpen(true);
  }

  async function submitCreateRoom() {
    if (newHostelMode && !newHostelName.trim()) { showToast("Hostel name is required.", "error"); return; }
    if (!newHostelMode && !newHostelId) { showToast("Select a hostel.", "error"); return; }
    if (!newRoomName.trim()) { showToast("Room name is required.", "error"); return; }
    const cap = Number(newRoomCapacity);
    if (!Number.isFinite(cap) || cap <= 0) { showToast("Enter a valid capacity.", "error"); return; }

    setSavingRoom(true);
    try {
      let targetHostelId = newHostelId;
      if (newHostelMode) {
        const hRes = await fetch("/api/hostel/hostels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newHostelName.trim() }),
        });
        if (!hRes.ok) throw new Error("Failed to create hostel");
        const hData = await hRes.json();
        targetHostelId = hData.data?.id ?? hData.id;
      }
      const res = await fetch("/api/hostel/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostelId: targetHostelId, name: newRoomName.trim(), capacity: cap }),
      });
      if (!res.ok) throw new Error("Failed to create room");
      showToast("Room created");
      router.refresh();
      setCreateRoomOpen(false);
    } catch {
      showToast("Failed to create room", "error");
    } finally {
      setSavingRoom(false);
    }
  }

  // ── Incident sheet ─────────────────────────────────────────────────
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [incidentRoomId, setIncidentRoomId] = useState<string | null>(null);
  const [incidentRoomLabel, setIncidentRoomLabel] = useState<string | null>(null);
  const [desc, setDesc] = useState("");
  const [savingIncident, setSavingIncident] = useState(false);

  function openIncident(roomId?: string, roomLabel?: string) {
    setDesc("");
    setIncidentRoomId(roomId ?? null);
    setIncidentRoomLabel(roomLabel ?? null);
    setIncidentOpen(true);
  }

  async function submitIncident() {
    if (!desc.trim()) { showToast("Description is required.", "error"); return; }
    setSavingIncident(true);
    try {
      const res = await fetch("/api/hostel/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc.trim(), roomId: incidentRoomId ?? undefined }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast("Incident logged");
      router.refresh();
      setIncidentOpen(false);
    } catch {
      showToast("Failed to log incident", "error");
    } finally {
      setSavingIncident(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Hostels</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValue}>{hostels.length}</strong><Building2 size={18} className={styles.kpiIcon} /></div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Rooms</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValue}>{totalRooms}</strong><DoorOpen size={18} className={styles.kpiIcon} /></div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Occupancy</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValue}>{occupancyPct}%</strong><BedDouble size={18} className={styles.kpiIcon} /></div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Incidents</span>
          <div className={styles.kpiBottom}><strong className={incidents.length > 0 ? styles.kpiValueAlert : styles.kpiValue}>{incidents.length}</strong><AlertTriangle size={18} className={styles.kpiIcon} /></div>
        </div>
      </div>

      <div className={styles.actionRow}>
        <button type="button" className={styles.btnOutline} onClick={() => openIncident()}><AlertTriangle size={14} /> Log Incident</button>
        <button type="button" className={styles.btnOutline} onClick={openCreateRoom}><DoorOpen size={14} /> New Room</button>
        <button type="button" className={styles.btnPrimary} onClick={() => openRoomSheet()}><Plus size={14} /> Allocate Room</button>
      </div>

      <div className={kit.segmented}>
        <button type="button" className={`${kit.segBtn} ${tab === "rooms" ? kit.segBtnActive : ""}`} onClick={() => setTab("rooms")}>Rooms</button>
        <button type="button" className={`${kit.segBtn} ${tab === "incidents" ? kit.segBtnActive : ""}`} onClick={() => setTab("incidents")}>
          Incidents {incidents.length > 0 ? `(${incidents.length})` : ""}
        </button>
      </div>

      {tab === "rooms" ? (
        <>
          <label className={kit.searchWrap}>
            <Search size={16} className={kit.searchIcon} />
            <input className={`${kit.input} ${kit.searchInput}`} placeholder="Search rooms or hostels" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>

          <div className={styles.chipRow}>
            <button type="button" className={`${styles.chip} ${!hostelFilter && !vacantOnly ? styles.chipActive : ""}`} onClick={() => { setHostelFilter(""); setVacantOnly(false); }}>All</button>
            {hostels.map((h) => (
              <button key={h.id} type="button" className={`${styles.chip} ${hostelFilter === h.id ? styles.chipActive : ""}`} onClick={() => setHostelFilter(hostelFilter === h.id ? "" : h.id)}>{h.name}</button>
            ))}
            <button type="button" className={`${styles.chip} ${vacantOnly ? styles.chipActive : ""}`} onClick={() => setVacantOnly((v) => !v)}>Vacant</button>
          </div>

          <div className={styles.list}>
            {filteredRooms.length === 0 ? (
              <p className={kit.emptyText}>{flatRooms.length === 0 ? "No hostels configured yet." : "No rooms match your search."}</p>
            ) : filteredRooms.map((f) => {
              const occ = f.room.occupants.length;
              const full = occ >= f.room.capacity;
              const isOpen = openRoomId === f.room.id;
              return (
                <article key={f.room.id} className={styles.card}>
                  <button type="button" className={styles.cardHeader} onClick={() => setOpenRoomId(isOpen ? null : f.room.id)}>
                    <div className={styles.cardHeaderText}>
                      <span className={styles.roomTitle}>{f.room.name}</span>
                      <span className={styles.roomMeta}>{f.hostelName}</span>
                    </div>
                    <span className={`${styles.occPill} ${full ? styles.occPillFull : ""}`}>{full ? "Full" : `${occ}/${f.room.capacity}`}</span>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {isOpen && (
                    <div className={styles.roomDetail}>
                      {f.room.occupants.length === 0 ? (
                        <p className={kit.emptyText}>No occupants yet.</p>
                      ) : (
                        <div className={styles.occupantList}>
                          {f.room.occupants.map((o) => (
                            <div key={o.allocationId} className={styles.occupantRow}>
                              <span className={kit.pickAvatar}>{initials(o.name)}</span>
                              <div className={styles.occupantInfo}>
                                <p className={styles.occupantName}>Bed {o.bedNumber} · {o.name}</p>
                                <p className={styles.occupantMeta}>{o.admissionNo} · {o.className}</p>
                              </div>
                              <button type="button" className={styles.vacateBtn} onClick={() => vacate(o.studentId)} disabled={vacatingId === o.studentId}>
                                <LogOut size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className={styles.actionRow}>
                        <button type="button" className={styles.actionBtn} onClick={() => openRoomSheet(f.room.id)}><UserPlus size={13} /> {full ? "Manage" : "Assign Student"}</button>
                        <button type="button" className={styles.actionBtn} onClick={() => openIncident(f.room.id, `${f.hostelName} · ${f.room.name}`)}><Wrench size={13} /> Report Maint.</button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <div className={styles.list}>
          {incidents.length === 0 ? (
            <p className={kit.emptyText}>No incidents logged yet.</p>
          ) : incidents.map((i) => (
            <article key={i.id} className={styles.incidentCard}>
              <div className={styles.incidentTop}>
                <AlertTriangle size={14} className={styles.incidentIcon} />
                <span className={styles.incidentDesc}>{i.description}</span>
              </div>
              <div className={styles.incidentMeta}>
                <span>{fmtDate(i.createdAt)}</span>
                {i.studentName && <span>• {i.studentName}</span>}
                {i.roomLabel && <span>• {i.roomLabel}</span>}
              </div>
              <div className={styles.incidentReporter}>Reported by {i.reportedByName}</div>
            </article>
          ))}
        </div>
      )}

      {/* Manage Room sheet */}
      <MobileSheet
        open={roomSheetOpen}
        onClose={() => !savingAlloc && setRoomSheetOpen(false)}
        title="Manage Room"
        subtitle="View occupants, vacate beds, or allocate a student."
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => setRoomSheetOpen(false)} disabled={savingAlloc}>Close</button>
          {selectedRoom && hasSpace && (
            <button type="button" className={kit.btnPrimary} onClick={submitAllocate} disabled={savingAlloc || !selectedStudentId}>
              {savingAlloc ? "Allocating…" : "Allocate"}
            </button>
          )}
        </>}
      >
        <div className={kit.field}>
          <label>Room</label>
          <select className={kit.select} value={roomId} onChange={(e) => selectRoom(e.target.value)}>
            <option value="">Select a room…</option>
            {flatRooms.map((f) => (
              <option key={f.room.id} value={f.room.id}>{f.hostelName} · {f.room.name} ({f.room.occupants.length}/{f.room.capacity})</option>
            ))}
          </select>
        </div>

        {selectedRoom && (
          <>
            <p className={kit.pickCount}>{selectedRoom.hostelName} · {selectedRoom.room.name} — {selectedRoom.room.occupants.length}/{selectedRoom.room.capacity} occupied</p>

            <div className={kit.field}>
              <label>Current Occupants</label>
              <div className={kit.pickList}>
                {selectedRoom.room.occupants.length === 0 && <p className={kit.emptyText}>No occupants yet.</p>}
                {selectedRoom.room.occupants.map((o) => (
                  <div key={o.allocationId} className={kit.pickRow}>
                    <div className={kit.pickAvatar}>{initials(o.name)}</div>
                    <div className={kit.pickInfo}>
                      <p className={kit.pickName}>Bed {o.bedNumber} · {o.name}</p>
                      <p className={kit.pickSub}>{o.admissionNo} · {o.className}</p>
                    </div>
                    <button type="button" className={styles.vacateBtnSm} onClick={() => vacate(o.studentId)} disabled={vacatingId === o.studentId}>
                      {vacatingId === o.studentId ? "…" : "Vacate"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {hasSpace && (
              <>
                <div className={kit.field}>
                  <label>Allocate Student</label>
                  <div className={kit.searchWrap}>
                    <Search size={14} className={kit.searchIcon} />
                    <input className={`${kit.input} ${kit.searchInput}`} placeholder="Search unallocated students…" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
                  </div>
                </div>
                <div className={kit.pickList}>
                  {filteredStudents.map((s) => (
                    <div key={s.id} className={`${kit.pickRow} ${selectedStudentId === s.id ? kit.pickRowActive : ""}`} onClick={() => setSelectedStudentId(s.id)}>
                      <div className={kit.pickAvatar}>{initials(s.name)}</div>
                      <div className={kit.pickInfo}>
                        <p className={kit.pickName}>{s.name}</p>
                        <p className={kit.pickSub}>{s.admissionNo} · {s.className}</p>
                      </div>
                    </div>
                  ))}
                  {filteredStudents.length === 0 && <p className={kit.emptyText}>No unallocated students match.</p>}
                </div>
                <div className={kit.field}>
                  <label>Bed Number</label>
                  <input className={kit.input} type="number" min={1} value={bedNumber} onChange={(e) => setBedNumber(e.target.value)} />
                </div>
              </>
            )}
          </>
        )}
      </MobileSheet>

      {/* Log Incident sheet */}
      <MobileSheet
        open={incidentOpen}
        onClose={() => !savingIncident && setIncidentOpen(false)}
        title="Log Maintenance Incident"
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => setIncidentOpen(false)} disabled={savingIncident}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={submitIncident} disabled={savingIncident}>{savingIncident ? "Saving…" : "Log Incident"}</button>
        </>}
      >
        {incidentRoomLabel && <p className={kit.helperText}>Room: {incidentRoomLabel}</p>}
        <div className={kit.field}>
          <label>Description *</label>
          <textarea className={kit.textarea} rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What happened?" />
        </div>
      </MobileSheet>

      {/* New Room sheet */}
      <MobileSheet
        open={createRoomOpen}
        onClose={() => !savingRoom && setCreateRoomOpen(false)}
        title="New Room"
        subtitle="Add a room to an existing hostel, or create a new hostel first."
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => setCreateRoomOpen(false)} disabled={savingRoom}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={submitCreateRoom} disabled={savingRoom}>{savingRoom ? "Creating…" : "Create Room"}</button>
        </>}
      >
        {hostels.length > 0 && (
          <div className={kit.field}>
            <label>Hostel</label>
            {!newHostelMode ? (
              <select className={kit.select} value={newHostelId} onChange={(e) => setNewHostelId(e.target.value)}>
                {hostels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            ) : (
              <input className={kit.input} placeholder="New hostel name" value={newHostelName} onChange={(e) => setNewHostelName(e.target.value)} />
            )}
            <button type="button" className={styles.linkBtn} onClick={() => setNewHostelMode((v) => !v)}>
              {newHostelMode ? "Choose an existing hostel instead" : "+ Create a new hostel instead"}
            </button>
          </div>
        )}
        {hostels.length === 0 && (
          <div className={kit.field}>
            <label>Hostel Name *</label>
            <input className={kit.input} placeholder="e.g. Unity Hall" value={newHostelName} onChange={(e) => setNewHostelName(e.target.value)} />
          </div>
        )}
        <div className={kit.field}>
          <label>Room Name *</label>
          <input className={kit.input} placeholder="e.g. Room 12" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} />
        </div>
        <div className={kit.field}>
          <label>Capacity (beds) *</label>
          <input className={kit.input} type="number" min={1} value={newRoomCapacity} onChange={(e) => setNewRoomCapacity(e.target.value)} />
        </div>
      </MobileSheet>
    </div>
  );
}
