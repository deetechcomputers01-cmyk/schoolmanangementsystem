"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FileText, GraduationCap, Search, Download, Printer, SlidersHorizontal,
  ChevronDown, Users, Eye, Layers,
} from "lucide-react";
import styles from "./ReportCardsScreen.module.css";

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  termAverages: Record<string, number>;
};
type ClassData = { id: string; name: string; students: Student[] };
type Term = { id: string; name: string };
type Year = { id: string; name: string; terms: Term[] };

type Props = {
  classes: ClassData[];
  years: Year[];
  currentYearId: string | null;
  currentTermName: string | null;
  academicContext: string;
};

const AVATAR_PALETTE = [
  { bg: "var(--clr-app-accent-soft)", fg: "var(--clr-app-accent-hover)" },
  { bg: "var(--clr-info-bg)", fg: "var(--clr-info)" },
  { bg: "var(--clr-success-bg)", fg: "var(--clr-success)" },
  { bg: "var(--clr-warning-bg)", fg: "var(--clr-warning)" },
];

function initialsOf(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

const PREVIEW_COUNT = 5;

function ClassSection({ cls, term }: { cls: ClassData; term: string | null }) {
  const [open, setOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? cls.students : cls.students.slice(0, PREVIEW_COUNT);

  return (
    <div className={styles.section}>
      <button className={styles.sectionHeader} onClick={() => setOpen((o) => !o)} type="button">
        <div className={styles.sectionHeaderLeft}>
          <span className={styles.sectionName}>{cls.name}</span>
          <span className={styles.sectionCount}>{cls.students.length} students</span>
        </div>
        <ChevronDown size={18} className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`} />
      </button>
      {open && (
        cls.students.length === 0 ? (
          <p className={styles.emptyState}>No students in this class.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th} style={{ width: 44 }}></th>
                  <th className={styles.th}>Student Name</th>
                  <th className={styles.th}>Admission No</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Term Average</th>
                  <th className={`${styles.th} ${styles.thCenter}`}>Status</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((student, i) => {
                  const palette = AVATAR_PALETTE[i % AVATAR_PALETTE.length];
                  const average = term ? student.termAverages[term] : undefined;
                  const published = average !== undefined;
                  return (
                    <tr key={student.id} className={styles.tr}>
                      <td className={styles.td}>
                        <div className={styles.avatar} style={{ background: palette.bg, color: palette.fg }}>
                          {initialsOf(student.firstName, student.lastName)}
                        </div>
                      </td>
                      <td className={styles.td} style={{ fontWeight: 600 }}>{student.firstName} {student.lastName}</td>
                      <td className={`${styles.td} ${styles.tdMuted}`}>{student.admissionNo}</td>
                      <td className={`${styles.td} ${styles.tdRight}`} style={{ fontWeight: 700 }}>
                        {published ? `${average}%` : "—"}
                      </td>
                      <td className={`${styles.td} ${styles.tdCenter}`}>
                        <span className={`${styles.statusBadge} ${published ? styles.statusPublished : styles.statusDraft}`}>
                          {published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className={`${styles.td} ${styles.tdRight}`}>
                        <div className={styles.actionsCell}>
                          <Link href={`/report-cards/${student.id}`} className={styles.viewBtn}>View</Link>
                          <Link href={`/report-cards/${student.id}`} target="_blank" className={styles.printBtn} title="Print">
                            <Printer size={15} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {cls.students.length > PREVIEW_COUNT && (
              <div className={styles.expandRow}>
                <button className={styles.expandBtn} onClick={() => setShowAll((s) => !s)} type="button">
                  {showAll ? "Show less" : `View all ${cls.students.length} students`}
                </button>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}

export function ReportCardsClient({ classes, years, currentYearId, currentTermName, academicContext }: Props) {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("__all__");
  const [yearId, setYearId] = useState(currentYearId ?? years[0]?.id ?? "");
  const selectedYear = years.find((y) => y.id === yearId) ?? years[0];
  const [termName, setTermName] = useState(currentTermName ?? selectedYear?.terms[0]?.name ?? "");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return classes
      .filter((cls) => classFilter === "__all__" || cls.id === classFilter)
      .map((cls) => ({
        ...cls,
        students: q
          ? cls.students.filter(
              (s) =>
                `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
                s.admissionNo.toLowerCase().includes(q)
            )
          : cls.students,
      }))
      .filter((cls) => cls.students.length > 0);
  }, [classes, search, classFilter]);

  const totalStudents = classes.reduce((n, c) => n + c.students.length, 0);
  const showingCount = filtered.reduce((n, c) => n + c.students.length, 0);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Report Cards</h1>
          <p className={styles.subtitle}>Generate and print term report cards by class. {academicContext}</p>
        </div>
        <div className={styles.headerActions}>
          <Link
            href={`/report-cards/print/${classFilter === "__all__" ? "all" : classFilter}`}
            target="_blank"
            className={styles.btn}
          >
            <Printer size={14} /> Print All (Class)
          </Link>
          <Link
            href={`/report-cards/print/${classFilter === "__all__" ? "all" : classFilter}`}
            target="_blank"
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            <Download size={14} /> Bulk Export PDF
          </Link>
        </div>
      </div>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterField}>
          <label className={styles.filterLabel}>Academic Year</label>
          <div className={styles.selectWrap}>
            <select className={styles.select} value={yearId} onChange={(e) => {
              setYearId(e.target.value);
              const y = years.find((yr) => yr.id === e.target.value);
              setTermName(y?.terms[0]?.name ?? "");
            }}>
              {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
            <ChevronDown size={16} className={styles.selectChevron} />
          </div>
        </div>
        <div className={styles.filterField}>
          <label className={styles.filterLabel}>Term</label>
          <div className={styles.selectWrap}>
            <select className={styles.select} value={termName} onChange={(e) => setTermName(e.target.value)}>
              {(selectedYear?.terms ?? []).map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
            <ChevronDown size={16} className={styles.selectChevron} />
          </div>
        </div>
        <div className={styles.filterField}>
          <label className={styles.filterLabel}>Class</label>
          <div className={styles.selectWrap}>
            <select className={styles.select} value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
              <option value="__all__">All Classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={16} className={styles.selectChevron} />
          </div>
        </div>
        <div className={styles.filterSpacer} />
        <button className={styles.advancedBtn} type="button" title="Search and class filters below already narrow the roster">
          <SlidersHorizontal size={16} /> Advanced filters
        </button>
      </div>

      {/* Stat cards */}
      <div className={styles.statRow}>
        <div className={styles.statCard}>
          <div><p className={styles.statLabel}>Total Classes</p><p className={styles.statValue}>{classes.length}</p></div>
          <div className={styles.statIcon}><Layers size={18} /></div>
        </div>
        <div className={styles.statCard}>
          <div><p className={styles.statLabel}>Total Students</p><p className={styles.statValue}>{totalStudents}</p></div>
          <div className={styles.statIcon}><Users size={18} /></div>
        </div>
        <div className={styles.statCard}>
          <div><p className={styles.statLabel}>Showing</p><p className={styles.statValue}>{showingCount}</p></div>
          <div className={styles.statIcon}><Eye size={18} /></div>
        </div>
      </div>

      {/* Roster */}
      <div className={styles.rosterCard}>
        <div className={styles.rosterToolbar}>
          <h3 className={styles.rosterTitle}>Class Roster</h3>
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student..."
            />
          </div>
        </div>

        {filtered.length === 0 && (
          <div className={styles.emptyState}>
            <FileText size={28} style={{ margin: "0 auto 8px", opacity: 0.4, display: "block" }} />
            No students match your search.
          </div>
        )}

        {filtered.map((cls) => (
          <ClassSection key={cls.id} cls={cls} term={termName || null} />
        ))}
      </div>
    </div>
  );
}
