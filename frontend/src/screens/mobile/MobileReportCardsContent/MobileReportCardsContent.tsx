"use client";

/**
 * MobileReportCardsContent — bespoke mobile view for Report Cards.
 *
 * Every field here traces back to ReportCardsClient.tsx (the real desktop
 * component): a student's status is simply "Published" if `termAverages`
 * has an entry for the selected term, "Draft" otherwise — there is no
 * position/rank, attendance %, per-subject grade summary, conduct/remark
 * text, async "generating" progress bar, or "Send to Guardian" action
 * anywhere in the data or service layer, so those parts of the Stitch
 * mockup are intentionally not reproduced here. View/Print both link to
 * the same real routes desktop uses (`/report-cards/{id}`,
 * `/report-cards/print/{classId|all}`).
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Printer, Download, FileText, ChevronDown, Layers, Users, Eye } from "lucide-react";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import styles from "./MobileReportCardsContent.module.css";

type Student = { id: string; firstName: string; lastName: string; admissionNo: string; termAverages: Record<string, number> };
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

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

export function MobileReportCardsContent({ classes, years, currentYearId, currentTermName, academicContext }: Props) {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("__all__");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [yearId, setYearId] = useState(currentYearId ?? years[0]?.id ?? "");
  const selectedYear = years.find((y) => y.id === yearId) ?? years[0];
  const [termName, setTermName] = useState(currentTermName ?? selectedYear?.terms[0]?.name ?? "");
  const [openClassIds, setOpenClassIds] = useState<Set<string>>(() => new Set(classes.map((c) => c.id)));

  function toggleClass(id: string) {
    setOpenClassIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classes
      .filter((cls) => classFilter === "__all__" || cls.id === classFilter)
      .map((cls) => ({
        ...cls,
        students: cls.students.filter((s) => {
          if (q && !`${s.firstName} ${s.lastName}`.toLowerCase().includes(q) && !s.admissionNo.toLowerCase().includes(q)) return false;
          const published = termName ? s.termAverages[termName] !== undefined : false;
          if (statusFilter === "published" && !published) return false;
          if (statusFilter === "draft" && published) return false;
          return true;
        }),
      }))
      .filter((cls) => cls.students.length > 0);
  }, [classes, search, classFilter, statusFilter, termName]);

  const totalStudents = classes.reduce((n, c) => n + c.students.length, 0);
  const showingCount = filtered.reduce((n, c) => n + c.students.length, 0);
  const readyCount = classes.reduce((n, c) => n + c.students.filter((s) => termName && s.termAverages[termName] !== undefined).length, 0);
  const draftCount = totalStudents - readyCount;

  return (
    <div className={styles.root}>
      <p className={styles.contextLine}>{academicContext}</p>

      <div className={styles.statsRow}>
        <div className={styles.statPill}>
          <strong className={`${styles.statValue} ${styles.statValueGood}`}>{readyCount}</strong>
          <span className={styles.statLabel}>Ready</span>
        </div>
        <div className={styles.statPill}>
          <strong className={styles.statValue}>{draftCount}</strong>
          <span className={styles.statLabel}>Draft</span>
        </div>
        <div className={styles.statPill}>
          <strong className={styles.statValue}>{totalStudents}</strong>
          <span className={styles.statLabel}>Total</span>
        </div>
      </div>

      <div className={styles.filterCard}>
        <div className={styles.filterRow}>
          <div className={kit.field}>
            <label>Academic Year</label>
            <select
              className={kit.select}
              value={yearId}
              onChange={(e) => {
                setYearId(e.target.value);
                const y = years.find((yr) => yr.id === e.target.value);
                setTermName(y?.terms[0]?.name ?? "");
              }}
            >
              {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
          <div className={kit.field}>
            <label>Term</label>
            <select className={kit.select} value={termName} onChange={(e) => setTermName(e.target.value)}>
              {(selectedYear?.terms ?? []).map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div className={kit.field}>
          <label>Class</label>
          <select className={kit.select} value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="__all__">All Classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <label className={kit.searchWrap}>
        <Search size={16} className={kit.searchIcon} />
        <input className={`${kit.input} ${kit.searchInput}`} placeholder="Search student or admission no." value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>

      <div className={styles.chipRow}>
        {(["all", "published", "draft"] as const).map((s) => (
          <button key={s} type="button" className={`${styles.chip} ${statusFilter === s ? styles.chipActive : ""}`} onClick={() => setStatusFilter(s)}>
            {s === "all" ? "All" : s === "published" ? "Ready" : "Draft"}
          </button>
        ))}
      </div>

      <div className={styles.actionRow}>
        <Link href={`/report-cards/print/${classFilter === "__all__" ? "all" : classFilter}`} target="_blank" className={styles.btnOutline}>
          <Printer size={15} /> Print All
        </Link>
        <Link href={`/report-cards/print/${classFilter === "__all__" ? "all" : classFilter}`} target="_blank" className={styles.btnPrimary}>
          <Download size={15} /> Bulk Export
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <FileText size={28} className={styles.emptyIcon} />
          <p className={kit.emptyText}>No students match your search.</p>
        </div>
      ) : (
        filtered.map((cls) => {
          const open = openClassIds.has(cls.id);
          return (
            <section key={cls.id} className={styles.classSection}>
              <button type="button" className={styles.classHeader} onClick={() => toggleClass(cls.id)}>
                <span className={styles.classHeaderLeft}>
                  <span className={styles.className}>{cls.name}</span>
                  <span className={styles.classCount}>{cls.students.length} students</span>
                </span>
                <ChevronDown size={18} className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`} />
              </button>
              {open && (
                <div className={styles.studentList}>
                  {cls.students.map((s, i) => {
                    const average = termName ? s.termAverages[termName] : undefined;
                    const published = average !== undefined;
                    return (
                      <div key={s.id} className={styles.studentCard}>
                        <span className={styles.avatar}>{initials(s.firstName, s.lastName)}</span>
                        <div className={styles.studentInfo}>
                          <p className={styles.studentName}>{s.firstName} {s.lastName}</p>
                          <p className={styles.studentAdm}>{s.admissionNo}</p>
                        </div>
                        <div className={styles.studentRight}>
                          <span className={`${styles.statusBadge} ${published ? styles.statusPublished : styles.statusDraft}`}>
                            {published ? "Ready" : "Draft"}
                          </span>
                          <span className={styles.averageValue}>{published ? `${average}%` : "—"}</span>
                        </div>
                        <div className={styles.studentActions}>
                          <Link href={`/report-cards/${s.id}`} className={styles.viewBtn}><Eye size={14} /> View</Link>
                          <Link href={`/report-cards/${s.id}`} target="_blank" className={styles.printIconBtn} aria-label="Print"><Printer size={14} /></Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })
      )}

      <div className={styles.footerStats}>
        <span><Layers size={13} /> {classes.length} classes</span>
        <span><Users size={13} /> {totalStudents} students</span>
        <span><Eye size={13} /> {showingCount} showing</span>
      </div>
    </div>
  );
}
