"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./AttendanceEntryScreen.module.css";

type AttendanceStatus = "present" | "absent" | "late" | "excused";
type SessionType = "Morning" | "Afternoon";

interface AttendanceEntryScreenProps {
  classes: { id: string; name: string }[];
  students: { id: string; firstName: string; lastName: string; admissionNo: string; classId: string }[];
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function initialMarks(students: AttendanceEntryScreenProps["students"]) {
  return Object.fromEntries(
    students.map((student) => [student.id, { status: "present" as AttendanceStatus, note: "" }]),
  );
}

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function AttendanceEntryScreen({ classes, students }: AttendanceEntryScreenProps) {
  const router = useRouter();
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id ?? "");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [session, setSession] = useState<SessionType>("Morning");
  const [marks, setMarks] = useState<Record<string, { status: AttendanceStatus; note: string }>>(() => initialMarks(students));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredStudents = useMemo(
    () => students.filter((student) => student.classId === selectedClassId),
    [selectedClassId, students],
  );

  const selectedClassName = classes.find((item) => item.id === selectedClassId)?.name ?? "Selected Class";

  const summary = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, excused: 0 };
    filteredStudents.forEach((student) => {
      counts[marks[student.id]?.status ?? "present"] += 1;
    });
    return counts;
  }, [filteredStudents, marks]);

  function updateStatus(studentId: string, status: AttendanceStatus) {
    setMarks((current) => ({
      ...current,
      [studentId]: { status, note: current[studentId]?.note ?? "" },
    }));
  }

  function updateNote(studentId: string, note: string) {
    setMarks((current) => ({
      ...current,
      [studentId]: { status: current[studentId]?.status ?? "present", note },
    }));
  }

  function markEveryone(status: AttendanceStatus) {
    setMarks((current) => {
      const next = { ...current };
      filteredStudents.forEach((student) => {
        next[student.id] = { status, note: next[student.id]?.note ?? "" };
      });
      return next;
    });
  }

  function clearNotes() {
    setMarks((current) => {
      const next = { ...current };
      filteredStudents.forEach((student) => {
        next[student.id] = { status: next[student.id]?.status ?? "present", note: "" };
      });
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedClassId || filteredStudents.length === 0) {
      setError("Choose a class with students before saving attendance.");
      setSuccess("");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClassId,
          date: selectedDate,
          records: filteredStudents.map((student) => ({
            studentId: student.id,
            status: marks[student.id]?.status ?? "present",
            note: marks[student.id]?.note ?? "",
          })),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.message ?? payload?.error ?? "Unable to save attendance right now.");
        setBusy(false);
        return;
      }

      setSuccess("Attendance saved successfully.");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumbs}>
        <Link className={styles.breadcrumbLink} href="/attendance">Attendance</Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>Record Attendance</span>
      </div>

      <div className={styles.pageIntro}>
        <h1 className={styles.title}>Record Attendance</h1>
        <p className={styles.subtitle}>Select a class and date to begin recording attendance.</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.topGrid}>
          <div className={styles.setupCard}>
            <div className={styles.setupRow}>
              <label className={styles.field}>
                <span className={styles.label}>Select Class</span>
                <select
                  className={styles.select}
                  value={selectedClassId}
                  onChange={(event) => setSelectedClassId(event.target.value)}
                >
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Attendance Date</span>
                <input
                  className={styles.input}
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Session</span>
                <select className={styles.select} value={session} onChange={(event) => setSession(event.target.value as SessionType)}>
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                </select>
              </label>

              <div className={styles.loadCell}>
                <button className={styles.loadButton} type="button">Load List</button>
              </div>
            </div>
          </div>

          <aside className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Total Students</span>
            <span className={styles.summaryValue}>{filteredStudents.length}</span>
            <p className={styles.summaryMeta}>Marked</p>
            <p className={styles.summaryCount}>{summary.present + summary.absent + summary.late + summary.excused}/{filteredStudents.length}</p>
          </aside>
        </section>

        {error ? <div className={styles.alert}>{error}</div> : null}
        {success ? <div className={styles.success}>{success}</div> : null}

        <section className={styles.rosterCard}>
          <div className={styles.rosterHeader}>
            <h2 className={styles.rosterTitle}>{selectedClassName} Roster</h2>
            <div className={styles.rosterActions}>
              <button className={styles.actionBlue} onClick={() => markEveryone("present")} type="button">Mark All Present</button>
              <button className={styles.actionAmber} onClick={() => markEveryone("late")} type="button">Mark All Late</button>
              <button className={styles.actionClear} onClick={clearNotes} type="button">Clear Notes</button>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No students in this class</p>
              <p className={styles.emptyText}>This class currently has no student records to mark attendance for.</p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead className={styles.thead}>
                  <tr>
                    <th className={styles.thIndex}>#</th>
                    <th className={styles.th}>Student Name</th>
                    <th className={styles.th}>Admission No.</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => {
                    const currentStatus = marks[student.id]?.status ?? "present";

                    return (
                      <tr key={student.id} className={styles.tr}>
                        <td className={styles.tdIndex}>{index + 1}</td>
                        <td className={styles.td}>
                          <div className={styles.studentCell}>
                            <span className={styles.avatar}>{initials(student.firstName, student.lastName)}</span>
                            <span className={styles.studentName}>{student.firstName} {student.lastName}</span>
                          </div>
                        </td>
                        <td className={styles.tdMeta}>{student.admissionNo}</td>
                        <td className={styles.tdStatus}>
                          <div className={styles.statusButtons}>
                            {(["present", "absent", "late", "excused"] as AttendanceStatus[]).map((status) => (
                              <button
                                key={status}
                                className={`${styles.statusButton} ${currentStatus === status ? styles[`status_${status}`] : ""}`}
                                onClick={() => updateStatus(student.id, status)}
                                type="button"
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className={styles.tdNote}>
                          <input
                            className={styles.noteInput}
                            value={marks[student.id]?.note ?? ""}
                            onChange={(event) => updateNote(student.id, event.target.value)}
                            placeholder="Optional note"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className={styles.footerActions}>
          <button className={styles.cancelButton} onClick={() => router.push("/attendance")} type="button">Cancel</button>
          <button className={styles.saveButton} disabled={busy} type="submit">
            {busy ? "Saving Attendance..." : "Save Attendance"}
          </button>
        </div>
      </form>
    </div>
  );
}
