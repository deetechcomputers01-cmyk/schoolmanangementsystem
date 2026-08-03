"use client";

/**
 * MobileLibraryContent — bespoke mobile view for the Library screen, built
 * from `design/MOBILE/4th 4 screens/mobile_library_indigo_refined/code.html`
 * (KPI bento grid, search+filter chips, Issue Book / Scan Barcode actions,
 * book catalog cards that expand into borrower detail when checked out).
 *
 * Every field/action traces back to LibraryContent.tsx (the real desktop
 * component) and the real /api/library endpoints:
 *   - KPIs (Total Books, Borrowed, Overdue) -> same `stats` prop as desktop;
 *     "Due Today" is computed client-side from the real `checkouts` prop
 *     (no invented numbers).
 *   - Issue Book sheet -> POST /api/library/checkouts, same
 *     { bookId, studentId, dueDate } shape as desktop's CheckoutModal.
 *   - Add Book sheet (canManage only) -> POST /api/library/books, same
 *     { title, author, isbn, category, quantity, shelfLocation } shape as
 *     desktop's AddBookModal.
 *   - Return -> PATCH /api/library/checkouts/:id, same as desktop's
 *     handleReturn().
 *   - Book Details sheet -> read-only, mirrors desktop's BookDetail panel
 *     (LIB number, stats, "Currently Checked Out To" list) from real props.
 *
 * The mockup's "Scan Barcode" action and per-checkout "Renew" / reminder
 * bell have NO real backing anywhere in the schema or service layer (no
 * barcode scanning, no renew endpoint, no BookCheckout.fine field) —
 * wired to a "not available yet" toast instead of being faked, matching
 * the pattern already used elsewhere (e.g. MobileFeesContent's Print
 * Receipt / Send Reminder). The mockup's per-checkout "Fine" amount is
 * intentionally omitted entirely since there is no fine field in the
 * schema to back it — inventing a number was not an option.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, CheckCircle2, User, AlertTriangle, RotateCcw, Bell,
  BookMarked, ScanBarcode, Eye, BookCopy, ArrowRightLeft, SearchX,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import type {
  LibraryBook,
  LibraryCheckout,
  LibraryStudent,
  LibraryStats,
} from "@/screens/desktop/LibraryScreen/LibraryContent";
import styles from "./MobileLibraryContent.module.css";

interface Props {
  books: LibraryBook[];
  checkouts: LibraryCheckout[];
  students: LibraryStudent[];
  stats: LibraryStats;
  canManage: boolean;
}

const CATEGORIES = [
  "Fiction", "Non-Fiction", "Textbook", "Reference", "Science",
  "Mathematics", "Literature", "History", "Other",
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function daysFromNow(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
function defaultDueDateStr() {
  return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
}
function libNumber(index: number) {
  return `LIB-2026-${String(index + 1).padStart(4, "0")}`;
}
function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

type Filter = "all" | "available" | "borrowed" | "overdue" | "dueToday";

export function MobileLibraryContent({ books, checkouts, students, stats, canManage }: Props) {
  const router = useRouter();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [returning, setReturning] = useState<string | null>(null);
  const [viewBook, setViewBook] = useState<LibraryBook | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ title: "", author: "", isbn: "", category: "Textbook", quantity: 1, shelfLocation: "" });
  const [addSaving, setAddSaving] = useState(false);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutBookId, setCheckoutBookId] = useState("");
  const [checkoutStudentId, setCheckoutStudentId] = useState("");
  const [checkoutDueDate, setCheckoutDueDate] = useState(defaultDueDateStr());
  const [checkoutSaving, setCheckoutSaving] = useState(false);

  const bookIndexMap = useMemo(() => new Map(books.map((b, i) => [b.id, i])), [books]);

  const checkoutsByBook = useMemo(() => {
    const map = new Map<string, LibraryCheckout[]>();
    for (const c of checkouts) {
      const list = map.get(c.bookId) ?? [];
      list.push(c);
      map.set(c.bookId, list);
    }
    return map;
  }, [checkouts]);

  const dueTodayCount = useMemo(
    () => checkouts.filter((c) => !c.isOverdue && daysFromNow(c.dueDate) === 0).length,
    [checkouts]
  );

  const availableBooks = useMemo(() => books.filter((b) => b.available > 0), [books]);

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return books.filter((b) => {
      const bookCheckouts = checkoutsByBook.get(b.id) ?? [];
      if (q) {
        const matchesBook =
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          (b.isbn ?? "").toLowerCase().includes(q);
        const matchesStudent = bookCheckouts.some(
          (c) => c.studentName.toLowerCase().includes(q) || c.admNo.toLowerCase().includes(q)
        );
        if (!matchesBook && !matchesStudent) return false;
      }
      if (filter === "available") return b.available > 0;
      if (filter === "borrowed") return bookCheckouts.length > 0;
      if (filter === "overdue") return bookCheckouts.some((c) => c.isOverdue);
      if (filter === "dueToday") return bookCheckouts.some((c) => !c.isOverdue && daysFromNow(c.dueDate) === 0);
      return true;
    });
  }, [books, checkoutsByBook, search, filter]);

  function openCheckout(bookId?: string) {
    setCheckoutBookId(bookId ?? availableBooks[0]?.id ?? "");
    setCheckoutStudentId(students[0]?.id ?? "");
    setCheckoutDueDate(defaultDueDateStr());
    setCheckoutOpen(true);
  }

  async function submitCheckout() {
    if (!checkoutBookId || !checkoutStudentId || !checkoutDueDate) {
      showToast("Fill in all required fields.", "error");
      return;
    }
    setCheckoutSaving(true);
    try {
      const res = await fetch("/api/library/checkouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: checkoutBookId,
          studentId: checkoutStudentId,
          dueDate: new Date(checkoutDueDate).toISOString(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Checkout failed");
      setCheckoutOpen(false);
      showToast("Book issued successfully");
      router.refresh();
    } catch (err: unknown) {
      showToast((err as Error).message ?? "Checkout failed", "error");
    } finally {
      setCheckoutSaving(false);
    }
  }

  function resetAddForm() {
    setAddForm({ title: "", author: "", isbn: "", category: "Textbook", quantity: 1, shelfLocation: "" });
  }

  async function submitAddBook() {
    if (!addForm.title.trim() || !addForm.author.trim()) {
      showToast("Title and author are required.", "error");
      return;
    }
    setAddSaving(true);
    try {
      const res = await fetch("/api/library/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: addForm.title.trim(),
          author: addForm.author.trim(),
          isbn: addForm.isbn.trim() || undefined,
          category: addForm.category,
          quantity: addForm.quantity,
          shelfLocation: addForm.shelfLocation.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to add book");
      }
      setAddOpen(false);
      resetAddForm();
      showToast("Book added successfully");
      router.refresh();
    } catch (err: unknown) {
      showToast((err as Error).message ?? "Failed to add book", "error");
    } finally {
      setAddSaving(false);
    }
  }

  async function handleReturn(checkoutId: string) {
    setReturning(checkoutId);
    try {
      const res = await fetch(`/api/library/checkouts/${checkoutId}`, { method: "PATCH" });
      if (!res.ok) throw new Error("Return failed");
      showToast("Book returned successfully");
      router.refresh();
    } catch {
      showToast("Failed to return book. Please try again.", "error");
    } finally {
      setReturning(null);
    }
  }

  const selectedCheckoutBook = books.find((b) => b.id === checkoutBookId) ?? null;
  const viewBookCheckouts = viewBook ? checkoutsByBook.get(viewBook.id) ?? [] : [];

  return (
    <div className={styles.root}>
      <section className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Total Books</p>
          <p className={styles.kpiValue}>{stats.totalBooks.toLocaleString()}</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Borrowed</p>
          <p className={styles.kpiValue}>{stats.checkedOut.toLocaleString()}</p>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardBad}`}>
          <p className={`${styles.kpiLabel} ${styles.kpiLabelBad}`}>Overdue</p>
          <p className={`${styles.kpiValue} ${styles.kpiValueBad}`}>{stats.overdueCount}</p>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardWarn}`}>
          <p className={`${styles.kpiLabel} ${styles.kpiLabelWarn}`}>Due Today</p>
          <p className={`${styles.kpiValue} ${styles.kpiValueWarn}`}>{dueTodayCount}</p>
        </div>
      </section>

      <label className={styles.searchWrap}>
        <Search size={16} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Search books, ISBN, or student"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      <div className={styles.chipRow}>
        {([
          ["all", "All"],
          ["available", "Available"],
          ["borrowed", "Borrowed"],
          ["overdue", "Overdue"],
          ["dueToday", "Due Today"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`${styles.chip} ${filter === key ? styles.chipActive : ""} ${key === "overdue" ? styles.chipDanger : ""} ${key === "dueToday" ? styles.chipWarn : ""}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.actionRow}>
        <button type="button" className={styles.btnPrimary} onClick={() => openCheckout()}>
          <BookMarked size={16} /> Issue Book
        </button>
        <button type="button" className={styles.btnOutline} onClick={() => showToast("Barcode scanning is not available yet.")}>
          <ScanBarcode size={16} /> Scan Barcode
        </button>
      </div>

      {canManage && (
        <button type="button" className={styles.addBtn} onClick={() => { resetAddForm(); setAddOpen(true); }}>
          <Plus size={16} /> Add Book
        </button>
      )}

      <div className={styles.list}>
        {filteredBooks.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}><SearchX size={22} /></span>
            <h4 className={styles.emptyTitle}>No books match</h4>
            <p className={styles.emptyText}>Try adjusting your search or filters.</p>
          </div>
        ) : filteredBooks.map((book) => {
          const bookCheckouts = checkoutsByBook.get(book.id) ?? [];
          const hasOverdue = bookCheckouts.some((c) => c.isOverdue);
          const status: "available" | "borrowed" | "overdue" =
            hasOverdue ? "overdue" : bookCheckouts.length > 0 ? "borrowed" : "available";

          return (
            <div key={book.id} className={`${styles.card} ${status === "overdue" ? styles.cardOverdue : ""}`}>
              {status === "overdue" && <span className={styles.overdueBar} aria-hidden />}
              <div className={styles.cardInner}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{book.title}</h3>
                  <div className={styles.cardHeaderRight}>
                    <button type="button" className={styles.detailBtn} onClick={() => setViewBook(book)} aria-label="View book details">
                      <Eye size={14} />
                    </button>
                    <span className={`${styles.badge} ${styles[`badge_${status}`]}`}>
                      {status === "available" && <CheckCircle2 size={11} />}
                      {status === "borrowed" && <User size={11} />}
                      {status === "overdue" && <AlertTriangle size={11} />}
                      {status === "available" ? "Available" : status === "borrowed" ? "Borrowed" : "Overdue"}
                    </span>
                  </div>
                </div>
                <p className={styles.cardAuthor}>Author: {book.author}</p>

                {bookCheckouts.length === 0 ? (
                  <div className={styles.cardFooter}>
                    <span className={styles.cardFooterItem}>ISBN: {book.isbn ?? "—"}</span>
                    <span className={styles.cardFooterStrong}>Shelf: {book.shelfLocation ?? "—"}</span>
                  </div>
                ) : (
                  <div className={styles.borrowerList}>
                    {bookCheckouts.map((c) => {
                      const days = daysFromNow(c.dueDate);
                      return (
                        <div key={c.id} className={styles.borrowerBlock}>
                          <div className={styles.borrowerTop}>
                            <span className={styles.borrowerAvatar}>{initials(c.studentName)}</span>
                            <div className={styles.borrowerInfo}>
                              <p className={styles.borrowerName}>{c.studentName}</p>
                              <p className={styles.borrowerClass}>{c.className}</p>
                            </div>
                            <span className={c.isOverdue ? styles.dueBad : days === 0 ? styles.dueWarn : styles.dueOk}>
                              {c.isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `Due ${fmtDate(c.dueDate)}`}
                            </span>
                          </div>
                          <div className={styles.borrowerActions}>
                            <button
                              type="button"
                              className={styles.btnReturn}
                              disabled={returning === c.id}
                              onClick={() => handleReturn(c.id)}
                            >
                              <RotateCcw size={13} /> {returning === c.id ? "…" : "Return"}
                            </button>
                            <button type="button" className={styles.btnRenew} onClick={() => showToast("Renew is not available yet.")}>
                              Renew
                            </button>
                            <button
                              type="button"
                              className={styles.btnBell}
                              onClick={() => showToast("Reminders are not available yet.")}
                              aria-label="Send reminder"
                            >
                              <Bell size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {book.available > 0 && (
                      <p className={styles.partialHint}>
                        {book.available} of {book.quantity} still available · Shelf {book.shelfLocation ?? "—"}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Book Details sheet */}
      <MobileSheet
        open={!!viewBook}
        onClose={() => setViewBook(null)}
        title="Book Details"
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => setViewBook(null)}>Close</button>
          {viewBook && (
            <button
              type="button"
              className={kit.btnPrimary}
              disabled={viewBook.available <= 0}
              onClick={() => { const id = viewBook.id; setViewBook(null); openCheckout(id); }}
            >
              <ArrowRightLeft size={14} /> Issue Book
            </button>
          )}
        </>}
      >
        {viewBook && (
          <div className={styles.detailBody}>
            <div className={styles.detailTop}>
              <div className={styles.detailIcon}><BookCopy size={32} /></div>
              <div>
                <h4 className={styles.detailTitle}>{viewBook.title}</h4>
                <p className={styles.detailAuthor}>{viewBook.author}</p>
                <p className={styles.detailLib}>
                  {libNumber(bookIndexMap.get(viewBook.id) ?? 0)}{viewBook.isbn ? ` · ISBN ${viewBook.isbn}` : ""}
                </p>
                <div className={styles.detailBadges}>
                  <span className={viewBook.available > 0 ? styles.detailBadgeAvailable : styles.detailBadgeLoan}>
                    {viewBook.available > 0 ? "Available" : "On Loan"}
                  </span>
                  <span className={styles.detailBadgeType}>{viewBook.category}</span>
                </div>
              </div>
            </div>

            {viewBook.shelfLocation && (
              <div className={styles.detailShelf}>
                <span>Shelf Location</span>
                <strong>{viewBook.shelfLocation}</strong>
              </div>
            )}

            <div className={styles.detailStats}>
              <div><span>Total</span><strong>{viewBook.quantity}</strong></div>
              <div><span>Available</span><strong style={{ color: viewBook.available > 0 ? "var(--clr-success)" : "var(--clr-error)" }}>{viewBook.available}</strong></div>
              <div><span>On Loan</span><strong>{viewBook.checkedOut}</strong></div>
            </div>

            <div className={styles.detailCheckouts}>
              <span className={styles.detailShelfLabel}>Currently Checked Out To</span>
              {viewBookCheckouts.length === 0 ? (
                <p className={kit.emptyText}>No copies currently on loan.</p>
              ) : viewBookCheckouts.map((c) => (
                <div key={c.id} className={styles.detailCheckoutRow}>
                  <div>
                    <p className={styles.detailCheckoutName}>{c.studentName}</p>
                    <p className={styles.detailCheckoutMeta}>{c.className} · {c.admNo}</p>
                  </div>
                  <span className={c.isOverdue ? styles.dueBad : styles.dueOk}>Due {fmtDate(c.dueDate)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </MobileSheet>

      {/* Issue Book sheet */}
      <MobileSheet
        open={checkoutOpen}
        onClose={() => !checkoutSaving && setCheckoutOpen(false)}
        title="Issue Book"
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => setCheckoutOpen(false)} disabled={checkoutSaving}>Cancel</button>
          <button
            type="button"
            className={kit.btnPrimary}
            onClick={submitCheckout}
            disabled={checkoutSaving || !checkoutBookId || !checkoutStudentId}
          >
            {checkoutSaving ? "Issuing…" : "Issue Book"}
          </button>
        </>}
      >
        <div className={kit.field}>
          <label>Book *</label>
          <select className={kit.select} value={checkoutBookId} onChange={(e) => setCheckoutBookId(e.target.value)}>
            <option value="">Select an available book…</option>
            {availableBooks.map((b) => (
              <option key={b.id} value={b.id}>{b.title} — {b.author} ({b.available} available)</option>
            ))}
          </select>
        </div>
        <div className={kit.field}>
          <label>Student *</label>
          <select className={kit.select} value={checkoutStudentId} onChange={(e) => setCheckoutStudentId(e.target.value)}>
            <option value="">Select student…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.admNo})</option>
            ))}
          </select>
        </div>
        <div className={kit.field}>
          <label>Due Date *</label>
          <input type="date" className={kit.input} value={checkoutDueDate} onChange={(e) => setCheckoutDueDate(e.target.value)} />
        </div>
        {selectedCheckoutBook && (
          <div className={kit.previewCard}>
            <div className={kit.previewIcon}><BookMarked size={16} /></div>
            <div className={kit.previewInfo}>
              <p className={kit.previewTitle}>{selectedCheckoutBook.title}</p>
              <p className={kit.previewSub}>{selectedCheckoutBook.author} · {selectedCheckoutBook.available} available</p>
            </div>
          </div>
        )}
      </MobileSheet>

      {/* Add Book sheet — canManage only */}
      {canManage && (
        <MobileSheet
          open={addOpen}
          onClose={() => !addSaving && setAddOpen(false)}
          title="Add Book"
          footer={<>
            <button type="button" className={kit.btnOutline} onClick={() => setAddOpen(false)} disabled={addSaving}>Cancel</button>
            <button
              type="button"
              className={kit.btnPrimary}
              onClick={submitAddBook}
              disabled={addSaving || !addForm.title.trim() || !addForm.author.trim()}
            >
              {addSaving ? "Saving…" : "Save Book"}
            </button>
          </>}
        >
          <div className={kit.field}>
            <label>Title *</label>
            <input type="text" className={kit.input} value={addForm.title} onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))} placeholder="Book title…" />
          </div>
          <div className={kit.field}>
            <label>Author *</label>
            <input type="text" className={kit.input} value={addForm.author} onChange={(e) => setAddForm((f) => ({ ...f, author: e.target.value }))} placeholder="Author name…" />
          </div>
          <div className={kit.field}>
            <label>ISBN</label>
            <input type="text" className={kit.input} value={addForm.isbn} onChange={(e) => setAddForm((f) => ({ ...f, isbn: e.target.value }))} placeholder="Optional…" />
          </div>
          <div className={kit.fieldRow}>
            <div className={kit.field}>
              <label>Quantity *</label>
              <input type="number" className={kit.input} min={1} value={addForm.quantity} onChange={(e) => setAddForm((f) => ({ ...f, quantity: parseInt(e.target.value, 10) || 1 }))} />
            </div>
            <div className={kit.field}>
              <label>Category *</label>
              <select className={kit.select} value={addForm.category} onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className={kit.field}>
            <label>Shelf Location</label>
            <input type="text" className={kit.input} value={addForm.shelfLocation} onChange={(e) => setAddForm((f) => ({ ...f, shelfLocation: e.target.value }))} placeholder="e.g. Block A, Shelf 1" />
          </div>
        </MobileSheet>
      )}
    </div>
  );
}
