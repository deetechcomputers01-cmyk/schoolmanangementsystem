"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Save,
  CheckCircle,
  X,
  AlertTriangle,
  Check,
  Clock,
  BarChart2,
  CalendarPlus,
} from "lucide-react";
import { DesktopPageFrame } from "@/components/desktop/layout/DesktopPageFrame/DesktopPageFrame";
import { MarkAttendanceModal } from "@/components/desktop/modules/dashboard/MarkAttendanceModal";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import styles from "./AttendanceScreen.module.css";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface AttendanceMarkingProps {
  classes: { id: string; name: string }[];
  students: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNo: string;
    classId: string;
    photoUrl: string | null;
    lastSeen: string | null;
  }[];
  existingAttendance: {
    studentId: string;
    classId: string;
    date: string;
    status: AttendanceStatus;
    note: string;
  }[];
  subjects: { id: string; name: string; classId: string; staffId: string | null }[];
  staffList: { id: string; name: string }[];
  canEdit: boolean;
}

type Mark = { status: AttendanceStatus | null; note: string };
const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  excused: "Excused",
};

function formatLastSeen(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) {
    return `Today, ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export function AttendanceMarkingContent(props: AttendanceMarkingProps) {
  const { classes, students, existingAttendance, subjects, staffList, canEdit } = props;
  const router = useRouter();
  const [recordModalOpen, setRecordModalOpen] = useState(false);

  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id ?? "");
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [session, setSession] = useState("Morning");
  const [marks, setMarks] = useState<Record<string, Mark>>(() => {
    const initial: Record<string, Mark> = {};
    existingAttendance
      .filter((attendance) => attendance.classId === (classes[0]?.id ?? "") && attendance.date === todayISO())
      .forEach((attendance) => {
        initial[attendance.studentId] = { status: attendance.status, note: attendance.note };
      });
    return initial;
  });
  const [focusedRow, setFocusedRow] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const [showError, setShowError] = useState(false);
  const [savingStudentId, setSavingStudentId] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState("Synced");
  const { enqueue } = useOfflineSync();

  const filteredStudents = useMemo(
    () => students.filter((student) => student.classId === selectedClassId),
    [selectedClassId, students],
  );

  const classSubjects = useMemo(
    () => subjects.filter((subject) => subject.classId === selectedClassId),
    [selectedClassId, subjects],
  );

  const counts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    filteredStudents.forEach((student) => {
      const status = marks[student.id]?.status;
      if (status === "present") present += 1;
      else if (status === "absent") absent += 1;
      else if (status === "late") late += 1;
      else if (status === "excused") excused += 1;
    });

    return { present, absent, late, excused };
  }, [filteredStudents, marks]);

  const hydrateMarks = useCallback((classId: string, date: string) => {
    const next: Record<string, Mark> = {};
    existingAttendance
      .filter((attendance) => attendance.classId === classId && attendance.date === date)
      .forEach((attendance) => {
        next[attendance.studentId] = { status: attendance.status, note: attendance.note };
      });
    setMarks(next);
  }, [existingAttendance]);

  const handleClassChange = useCallback((classId: string) => {
    setSelectedClassId(classId);
    setSelectedSubjectId("");
    setSelectedTeacherId("");
    hydrateMarks(classId, selectedDate);
  }, [hydrateMarks, selectedDate]);

  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
    hydrateMarks(selectedClassId, date);
  }, [hydrateMarks, selectedClassId]);

  const setStatus = useCallback((studentId: string, status: AttendanceStatus) => {
    setMarks((current) => ({
      ...current,
      [studentId]: {
        status: current[studentId]?.status === status ? null : status,
        note: current[studentId]?.note ?? "",
      },
    }));
  }, []);

  const setNote = useCallback((studentId: string, note: string) => {
    setMarks((current) => ({
      ...current,
      [studentId]: { status: current[studentId]?.status ?? null, note },
    }));
  }, []);

  const saveStudentAttendance = useCallback(async (
    studentId: string,
    nextStatus: AttendanceStatus | null,
    nextNote?: string,
  ) => {
    if (!selectedClassId || !nextStatus) return;

    setSavingStudentId(studentId);
    setSyncMessage("Syncing...");
    setShowError(false);

    try {
      const result = await enqueue("/api/attendance", {
        classId: selectedClassId,
        date: selectedDate,
        records: [{
          studentId,
          status: nextStatus,
          note: nextNote ?? marks[studentId]?.note ?? "",
        }],
      });

      setSyncMessage(result ? "Synced" : "Queued — will sync when back online");
      showToast(`Attendance updated for ${selectedClass?.name}`);
    } catch {
      setShowError(true);
      setSyncMessage("Sync failed");
    } finally {
      setSavingStudentId(null);
    }
  }, [enqueue, marks, selectedClassId, selectedDate]);

  const saveCurrentNote = useCallback(async (studentId: string) => {
    const current = marks[studentId];
    if (!current?.status) return;
    await saveStudentAttendance(studentId, current.status, current.note);
  }, [marks, saveStudentAttendance]);

  const markAllPresent = useCallback(() => {
    const next: Record<string, Mark> = { ...marks };
    filteredStudents.forEach((student) => {
      next[student.id] = { status: "present", note: next[student.id]?.note ?? "" };
      void saveStudentAttendance(student.id, "present", next[student.id].note);
    });
    setMarks(next);
  }, [filteredStudents, marks, saveStudentAttendance]);

  const clearAll = useCallback(() => {
    const next: Record<string, Mark> = { ...marks };
    filteredStudents.forEach((student) => {
      next[student.id] = { status: null, note: "" };
    });
    setMarks(next);
    setSyncMessage("Cleared locally");
  }, [filteredStudents, marks]);

  const handleSave = useCallback(async () => {
    if (!selectedClassId) {
      setShowError(true);
      return;
    }

    setShowError(false);
    setSaving(true);
    setSyncMessage("Syncing...");

    try {
      const records = filteredStudents
        .filter((student) => marks[student.id]?.status)
        .map((student) => ({
          studentId: student.id,
          status: marks[student.id].status!,
          note: marks[student.id].note ?? "",
        }));

      const result = await enqueue("/api/attendance", { classId: selectedClassId, date: selectedDate, records });

      setSyncMessage(result ? "Synced" : "Queued — will sync when back online");
      showToast(`Attendance updated for ${selectedClass?.name}`);
    } finally {
      setSaving(false);
    }
  }, [enqueue, filteredStudents, marks, selectedClassId, selectedDate]);

  const selectedClass = classes.find((schoolClass) => schoolClass.id === selectedClassId);
  const markedCount = filteredStudents.filter((student) => marks[student.id]?.status).length;

  return (
    <DesktopPageFrame
      title="Attendance"
      subtitle="Select a class and date to begin recording attendance."
      variant="standard"
      action={
        canEdit ? (
          <button className={styles.saveBtn} type="button" onClick={() => setRecordModalOpen(true)}>
            <CalendarPlus size={15} />
            Record Attendance
          </button>
        ) : null
      }
    >
      <MarkAttendanceModal
        open={recordModalOpen}
        onClose={() => {
          setRecordModalOpen(false);
          router.refresh();
        }}
      />
      <div className={styles.root}>
      {showError && (
        <div className={styles.errorBanner}>
          <AlertTriangle size={18} className={styles.errorIcon} />
          <span className={styles.errorText}>Attendance update failed. Please try again.</span>
          <button className={styles.errorClose} onClick={() => setShowError(false)} type="button">
            <X size={18} />
          </button>
        </div>
      )}

      <div className={styles.cardsRow}>
        <div className={styles.setupCard}>
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Select Class</label>
            <select
              className={styles.controlSelect}
              value={selectedClassId}
              onChange={(event) => handleClassChange(event.target.value)}
            >
              {classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Attendance Date</label>
            <div className={styles.inputWrapper}>
              <Calendar size={15} className={styles.inputIcon} />
              <input
                type="date"
                className={styles.dateInput}
                value={selectedDate}
                onChange={(event) => handleDateChange(event.target.value)}
              />
            </div>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Session</label>
            <select className={styles.controlSelect} value={session} onChange={(event) => setSession(event.target.value)}>
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Evening">Evening</option>
            </select>
          </div>

          <div className={styles.controlActions}>
            <button className={styles.btnOutline} type="button">
              <BarChart2 size={15} />
              View Reports
            </button>
            <button className={styles.saveBtn} type="button" onClick={() => hydrateMarks(selectedClassId, selectedDate)}>
              Load List
            </button>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryTopRow}>
            <span className={styles.summaryLabel}>Total Students</span>
            <span className={styles.summaryMeta}>{filteredStudents.length}</span>
          </div>
          <div className={styles.summaryProgressTrack}>
            <div
              className={styles.summaryProgressFill}
              style={{ width: `${filteredStudents.length ? (markedCount / filteredStudents.length) * 100 : 0}%` }}
            />
          </div>
          <div className={styles.summaryBottomRow}>
            <span className={styles.summaryLabel}>Marked</span>
            <span className={styles.summaryMeta}>{markedCount}/{filteredStudents.length}</span>
          </div>
        </div>
      </div>

      <div className={styles.secondaryFilters}>
        <div className={styles.inlineField}>
          <span className={styles.inlineLabel}>Subject</span>
          <select
            className={styles.inlineSelect}
            value={selectedSubjectId}
            onChange={(event) => {
              setSelectedSubjectId(event.target.value);
              const subject = subjects.find((item) => item.id === event.target.value);
              if (subject?.staffId) setSelectedTeacherId(subject.staffId);
            }}
          >
            <option value="">All Subjects</option>
            {classSubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>
        </div>
        <div className={styles.inlineField}>
          <span className={styles.inlineLabel}>Teacher</span>
          <select
            className={styles.inlineSelect}
            value={selectedTeacherId}
            onChange={(event) => setSelectedTeacherId(event.target.value)}
          >
            <option value="">All Teachers</option>
            {staffList.map((staffMember) => (
              <option key={staffMember.id} value={staffMember.id}>{staffMember.name}</option>
            ))}
          </select>
        </div>
        <div className={styles.syncBadge}>
          <CheckCircle size={15} />
          <span>{syncMessage}</span>
        </div>
      </div>

      <div className={styles.workspace}>
        <div className={styles.toolbar}>
          <span className={styles.rosterTitle}>{selectedClass?.name ?? "Class"} Roster</span>
          <div className={styles.toolbarLeft}>
            <button className={styles.toolbarPrimary} onClick={markAllPresent} type="button">
              <Check size={15} />
              Mark all present
            </button>
            <button
              className={styles.toolbarNeutral}
              onClick={() => {
                const next: Record<string, Mark> = { ...marks };
                filteredStudents.forEach((student) => {
                  next[student.id] = { status: "late", note: next[student.id]?.note ?? "" };
                  void saveStudentAttendance(student.id, "late", next[student.id].note);
                });
                setMarks(next);
              }}
              type="button"
            >
              Mark all late
            </button>
            <button className={styles.toolbarNeutral} onClick={clearAll} type="button">Clear notes</button>
          </div>
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.thead}>
                <th className={styles.thIndex}>#</th>
                <th className={styles.thStudent}>Student</th>
                <th className={styles.thAdm}>Admission No.</th>
                <th className={styles.thStatus}>Status</th>
                <th className={styles.thNote}>Note</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>
                    <div className={styles.emptyState}>
                      <p className={styles.emptyTitle}>No students in {selectedClass?.name ?? "this class"}</p>
                      <p className={styles.emptyHint}>There are currently no students registered for this class.</p>
                    </div>
                  </td>
                </tr>
              )}

              {filteredStudents.map((student, index) => {
                const mark = marks[student.id];
                const status = mark?.status ?? null;
                const isFocused = focusedRow === student.id;
                const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
                const isConsecutiveAbsent = status === "absent";

                const rowClass = [
                  styles.tr,
                  status === "absent" ? styles.trAbsent : "",
                  status === "late" ? styles.trLate : "",
                  isFocused ? styles.trFocused : "",
                ].filter(Boolean).join(" ");

                return (
                  <tr key={student.id} className={rowClass}>
                    <td className={styles.tdIndex}>{index + 1}</td>
                    <td className={styles.tdStudent}>
                      {isFocused && <div className={styles.focusBorder} />}
                      <div className={styles.studentCell}>
                        <div className={styles.avatar}>
                          {student.photoUrl
                            ? <img src={student.photoUrl} alt={initials} className={styles.avatarImg} />
                            : <span className={styles.avatarInitials}>{initials}</span>}
                        </div>
                        <div>
                          <p className={styles.studentName}>
                            {student.firstName} {student.lastName}
                            {isConsecutiveAbsent && (
                              <span className={styles.warningIcon} title="Consecutive Absence">
                                <AlertTriangle size={14} />
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className={styles.tdAdm}>
                      {student.admissionNo}
                    </td>

                    <td className={styles.tdStatus}>
                      <div className={`${styles.toggleGroup} ${status === "absent" ? styles.toggleGroupAbsent : status === "late" ? styles.toggleGroupLate : ""}`}>
                        {(["present", "absent", "late", "excused"] as AttendanceStatus[]).map((itemStatus) => {
                          const isActive = status === itemStatus;
                          return (
                            <button
                              key={itemStatus}
                              disabled={!canEdit}
                              className={[
                                styles.toggleBtn,
                                isActive ? styles[`toggleActive_${itemStatus}`] : styles.toggleInactive,
                              ].join(" ")}
                              onClick={() => {
                                const nextStatus = status === itemStatus ? null : itemStatus;
                                setStatus(student.id, itemStatus);
                                void saveStudentAttendance(student.id, nextStatus, mark?.note ?? "");
                              }}
                              type="button"
                            >
                              {itemStatus === "present" && isActive && <Check size={13} />}
                              {itemStatus === "absent" && isActive && <X size={13} />}
                              {itemStatus === "late" && isActive && <Clock size={13} />}
                              {STATUS_LABELS[itemStatus]}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    <td className={styles.tdNote}>
                      {isFocused ? (
                        <div className={styles.noteInputWrapper}>
                          <input
                            type="text"
                            className={styles.noteInputFocused}
                            value={mark?.note ?? ""}
                            onChange={(event) => setNote(student.id, event.target.value)}
                            onBlur={() => {
                              setFocusedRow(null);
                              void saveCurrentNote(student.id);
                            }}
                            placeholder="Add note..."
                            autoFocus
                            readOnly={!canEdit}
                          />
                          <div className={styles.noteGlow} />
                        </div>
                      ) : (
                        <input
                          type="text"
                          className={styles.noteInput}
                          value={mark?.note ?? ""}
                          onFocus={() => setFocusedRow(student.id)}
                          onChange={(event) => setNote(student.id, event.target.value)}
                          placeholder="Add note..."
                          readOnly={!canEdit}
                        />
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className={styles.tableFooter}>
          <span className={styles.footerCount}>{markedCount} / {filteredStudents.length} marked</span>
          {canEdit && (
            <div className={styles.footerActions}>
              <button className={styles.footerCancel} type="button" onClick={clearAll}>Cancel</button>
              <button className={styles.footerSave} onClick={handleSave} disabled={saving} type="button">
                <Save size={15} />
                {saving ? "Saving..." : "Save Attendance"}
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </DesktopPageFrame>
  );
}
