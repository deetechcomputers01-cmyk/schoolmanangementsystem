"use client";

import { useEffect, useState, useMemo } from "react";
import { RefreshCw, StickyNote, Check, X as XIcon, Clock } from "lucide-react";
import { DesktopFormModal } from "@/components/desktop/ui/DesktopFormModal/DesktopFormModal";
import styles from "./MarkAttendanceModal.module.css";

type AttendanceStatus = "present" | "absent" | "late" | "excused";
type Mark = { status: AttendanceStatus | null; note: string };

type ClassOption = { id: string; name: string };
type StudentRow = { id: string; firstName: string; lastName: string; admissionNo: string; classId: string };
type AttendanceRecord = { studentId: string; classId: string; date: string; status: AttendanceStatus; note: string };

const STATUS_ORDER: AttendanceStatus[] = ["present", "absent", "late", "excused"];
const STATUS_LABEL: Record<AttendanceStatus, string> = { present: "P", absent: "A", late: "L", excused: "E" };

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export function MarkAttendanceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [session, setSession] = useState("Morning");
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [noteRow, setNoteRow] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch("/api/classes").then(r => r.json()),
      fetch("/api/students").then(r => r.json()),
      fetch("/api/attendance").then(r => r.json()),
    ])
      .then(([classesData, studentsData, attendanceData]) => {
        const classList: ClassOption[] = Array.isArray(classesData) ? classesData : (classesData.classes ?? []);
        const studentList: StudentRow[] = studentsData.students ?? [];
        const attendanceList: AttendanceRecord[] = (attendanceData.attendance ?? []).map((a: any) => ({
          studentId: a.studentId,
          classId: a.classId,
          date: typeof a.date === "string" ? a.date.split("T")[0] : new Date(a.date).toISOString().split("T")[0],
          status: a.status,
          note: a.note ?? "",
        }));
        setClasses(classList);
        setStudents(studentList);
        setAttendance(attendanceList);
        setSelectedClassId(classList[0]?.id ?? "");
      })
      .catch(() => setError("Failed to load attendance data."))
      .finally(() => setLoading(false));
  }, [open]);

  const filteredStudents = useMemo(
    () => students.filter(s => s.classId === selectedClassId),
    [students, selectedClassId],
  );

  function hydrateMarks(classId: string, date: string) {
    const next: Record<string, Mark> = {};
    attendance
      .filter(a => a.classId === classId && a.date === date)
      .forEach(a => { next[a.studentId] = { status: a.status, note: a.note }; });
    setMarks(next);
  }

  useEffect(() => {
    if (selectedClassId) hydrateMarks(selectedClassId, selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, selectedDate, attendance]);

  const markedCount = filteredStudents.filter(s => marks[s.id]?.status).length;

  function setStatus(studentId: string, status: AttendanceStatus) {
    setMarks(current => ({
      ...current,
      [studentId]: { status: current[studentId]?.status === status ? null : status, note: current[studentId]?.note ?? "" },
    }));
  }

  function setNote(studentId: string, note: string) {
    setMarks(current => ({ ...current, [studentId]: { status: current[studentId]?.status ?? null, note } }));
  }

  async function handleSave() {
    if (!selectedClassId) return;
    setSaving(true);
    setError(null);
    try {
      const records = filteredStudents
        .filter(s => marks[s.id]?.status)
        .map(s => ({ studentId: s.id, status: marks[s.id].status!, note: marks[s.id].note ?? "" }));

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: selectedClassId, date: selectedDate, records }),
      });
      if (!res.ok) throw new Error("Failed");
      onClose();
    } catch {
      setError("Failed to save attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DesktopFormModal
      open={open}
      title="Record Attendance"
      subtitle="Select a class and date to begin recording attendance."
      eyebrow="Attendance"
      width={760}
      canClose={!saving}
      onClose={() => { if (!saving) onClose(); }}
      footer={
        <>
          <button className={styles.cancelBtn} onClick={onClose} disabled={saving} type="button">Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving || loading} type="button">
            {saving ? "Saving…" : "Save Attendance"}
          </button>
        </>
      }
    >
      <div className={styles.bleed}>
        <section className={styles.filters}>
          <div className={styles.field}>
            <label className={styles.label}>Select Class</label>
            <select className={styles.select} value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Attendance Date</label>
            <input type="date" className={styles.select} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Session</label>
            <select className={styles.select} value={session} onChange={e => setSession(e.target.value)}>
              <option>Morning</option>
              <option>Afternoon</option>
            </select>
          </div>
          <button className={styles.loadBtn} type="button" onClick={() => hydrateMarks(selectedClassId, selectedDate)}>
            <RefreshCw size={15} /> Load List
          </button>
        </section>

        <div className={styles.summaryBar}>
          <span className={styles.summaryItem}><span className={styles.summaryLabel}>Total Students:</span> {filteredStudents.length}</span>
          <span className={styles.summaryItem}><span className={styles.summaryLabel}>Marked:</span> <span className={styles.summaryValue}>{markedCount}/{filteredStudents.length}</span></span>
          {error && <span className={styles.errorText}>{error}</span>}
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thIndex}>#</th>
                <th className={styles.th}>Student Name</th>
                <th className={styles.th}>Adm. No.</th>
                <th className={styles.thStatus}>Status</th>
                <th className={styles.thNote}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className={styles.emptyCell}>Loading roster…</td></tr>
              )}
              {!loading && filteredStudents.length === 0 && (
                <tr><td colSpan={5} className={styles.emptyCell}>No students in this class.</td></tr>
              )}
              {!loading && filteredStudents.map((student, index) => {
                const mark = marks[student.id];
                const status = mark?.status ?? null;
                const initials = `${student.firstName[0] ?? ""}${student.lastName[0] ?? ""}`.toUpperCase();
                return (
                  <tr key={student.id}>
                    <td className={styles.tdIndex}>{index + 1}</td>
                    <td className={styles.td}>
                      <div className={styles.studentCell}>
                        <span className={styles.avatar}>{initials}</span>
                        <span className={styles.studentName}>{student.firstName} {student.lastName}</span>
                      </div>
                    </td>
                    <td className={styles.tdMono}>{student.admissionNo}</td>
                    <td className={styles.td}>
                      <div className={styles.toggleGroup}>
                        {STATUS_ORDER.map(itemStatus => {
                          const isActive = status === itemStatus;
                          return (
                            <button
                              key={itemStatus}
                              type="button"
                              className={`${styles.toggleBtn} ${isActive ? styles.toggleActive : ""}`}
                              onClick={() => setStatus(student.id, itemStatus)}
                            >
                              {isActive && itemStatus === "present" && <Check size={12} />}
                              {isActive && itemStatus === "absent" && <XIcon size={12} />}
                              {isActive && itemStatus === "late" && <Clock size={12} />}
                              {STATUS_LABEL[itemStatus]}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className={styles.tdNote}>
                      {noteRow === student.id ? (
                        <input
                          autoFocus
                          className={styles.noteInput}
                          value={mark?.note ?? ""}
                          placeholder="Add note..."
                          onChange={e => setNote(student.id, e.target.value)}
                          onBlur={() => setNoteRow(null)}
                        />
                      ) : (
                        <button className={styles.noteBtn} type="button" onClick={() => setNoteRow(student.id)}>
                          <StickyNote size={16} fill={mark?.note ? "currentColor" : "none"} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DesktopFormModal>
  );
}
