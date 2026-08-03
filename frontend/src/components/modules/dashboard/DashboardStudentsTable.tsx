"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditCard, Eye, Filter, Search, X } from "lucide-react";
import css from "@/screens/desktop/DashboardScreen/DashboardScreen.module.css";

export type DashboardStudentRow = {
  id: string;
  name: string;
  initials: string;
  photoUrl: string | null;
  admissionNo: string;
  className: string;
  guardianName: string;
  feeStatus: "Paid" | "Partial" | "Unpaid" | "None";
};

type FeeFilter = "all" | "Paid" | "Partial" | "Unpaid" | "None";

const PAGE_SIZE = 8;

export function DashboardStudentsTable({ rows, total }: { rows: DashboardStudentRow[]; total: number }) {
  const [query, setQuery] = useState("");
  const [feeFilter, setFeeFilter] = useState<FeeFilter>("all");
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredRows = rows.filter((row) => {
    const matchesQuery = !normalizedQuery || [row.name, row.admissionNo, row.className, row.guardianName]
      .some((value) => value.toLowerCase().includes(normalizedQuery));
    const matchesFee = feeFilter === "all" || row.feeStatus === feeFilter;
    return matchesQuery && matchesFee;
  });
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const from = filteredRows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, filteredRows.length);

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function updateFeeFilter(value: FeeFilter) {
    setFeeFilter(value);
    setPage(1);
    setFilterOpen(false);
  }

  return (
    <div className={css.studentTableBody}>
      <div className={css.studentTableToolbar}>
        <label className={css.tableSearch}>
          <Search size={14} aria-hidden />
          <input
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Search students"
            aria-label="Search students"
          />
          {query && <button type="button" onClick={() => updateQuery("")} aria-label="Clear search"><X size={13} /></button>}
        </label>
        <div className={css.tableFilterWrap}>
          <button
            type="button"
            className={`${css.tableFilterButton} ${feeFilter !== "all" ? css.tableFilterActive : ""}`}
            onClick={() => setFilterOpen((open) => !open)}
            aria-expanded={filterOpen}
          >
            <Filter size={14} aria-hidden />
            Filter
          </button>
          {filterOpen && (
            <div className={css.filterMenu} role="menu">
              <span>Fee status</span>
              {(["all", "Paid", "Partial", "Unpaid", "None"] as FeeFilter[]).map((value) => (
                <button key={value} type="button" onClick={() => updateFeeFilter(value)} role="menuitem">
                  {value === "all" ? "All students" : value === "None" ? "No fee record" : value}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={css.studentTableScroll}>
        <table className={css.studentTable}>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Admission No.</th>
              <th>Class</th>
              <th>Guardian</th>
              <th>Fee Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((student) => (
              <tr key={student.id}>
                <td>
                  <Link href={`/students/${student.id}`} className={css.studentNameCell}>
                    {student.photoUrl ? (
                      <img src={student.photoUrl} alt="" className={css.studentPhoto} />
                    ) : (
                      <span className={css.studentInitials}>{student.initials}</span>
                    )}
                    <span>{student.name}</span>
                  </Link>
                </td>
                <td className={css.mutedCell}>{student.admissionNo}</td>
                <td>{student.className}</td>
                <td className={css.mutedCell}>{student.guardianName}</td>
                <td><FeeStatus status={student.feeStatus} /></td>
                <td>
                  <div className={css.tableActions}>
                    <Link href={`/students/${student.id}`} className={css.tableAction} aria-label={`View ${student.name}`}>
                      <Eye size={14} />
                    </Link>
                    <Link href={`/fees?studentId=${student.id}`} className={css.tableAction} aria-label={`View fees for ${student.name}`}>
                      <CreditCard size={14} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {visibleRows.length === 0 && (
              <tr><td colSpan={6} className={css.emptyState}>No students match this search.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={css.studentTableFooter}>
        <span>Showing {from} to {to} of {total.toLocaleString()} students</span>
        <div className={css.pagination}>
          <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} aria-label="Previous page">‹</button>
          <span>{currentPage}</span>
          <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount} aria-label="Next page">›</button>
        </div>
      </div>
    </div>
  );
}

function FeeStatus({ status }: { status: DashboardStudentRow["feeStatus"] }) {
  const className = status === "Paid" ? css.tableStatusPaid : status === "Partial" ? css.tableStatusPartial : status === "Unpaid" ? css.tableStatusUnpaid : css.tableStatusNone;
  return <span className={`${css.tableStatus} ${className}`}>{status === "None" ? "No record" : status}</span>;
}
