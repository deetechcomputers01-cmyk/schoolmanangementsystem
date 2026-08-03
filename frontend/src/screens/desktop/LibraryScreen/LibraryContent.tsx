"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Plus,
  X,
  RotateCcw,
  BookMarked,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  BookCopy,
  Search,
  Eye,
  Pencil,
  ArrowRightLeft,
  Trash2,
  LibraryBig,
  ClipboardList,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import styles from "./LibraryScreen.module.css";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  category: string;
  quantity: number;
  available: number;
  checkedOut: number;
  shelfLocation: string | null;
}

export interface LibraryCheckout {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  studentId: string;
  studentName: string;
  admNo: string;
  className: string;
  checkedOutAt: string;
  dueDate: string;
  isOverdue: boolean;
}

export interface LibraryStudent {
  id: string;
  name: string;
  admNo: string;
}

export interface LibraryStats {
  totalBooks: number;
  availableBooks: number;
  checkedOut: number;
  overdueCount: number;
}

export interface LibraryProps {
  books: LibraryBook[];
  checkouts: LibraryCheckout[];
  students: LibraryStudent[];
  stats: LibraryStats;
  canManage: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysFromNow(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function defaultDueDateStr() {
  return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
}

function libNumber(index: number) {
  return `LIB-2026-${String(index + 1).padStart(4, "0")}`;
}

// ── Add Book Modal ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Fiction",
  "Non-Fiction",
  "Textbook",
  "Reference",
  "Science",
  "Mathematics",
  "Literature",
  "History",
  "Other",
];

interface AddBookModalProps {
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

function AddBookModal({ onClose, onSuccess, onError }: AddBookModalProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title:         "",
    author:        "",
    isbn:          "",
    category:      "Textbook",
    quantity:      1,
    shelfLocation: "",
  });

  function set(field: string, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/library/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:         form.title.trim(),
          author:        form.author.trim(),
          isbn:          form.isbn.trim() || undefined,
          category:      form.category,
          quantity:      form.quantity,
          shelfLocation: form.shelfLocation.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to add book");
      }
      onSuccess("Book added successfully");
      router.refresh();
      onClose();
    } catch (err: unknown) {
      onError((err as Error).message ?? "Failed to add book");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
    <div
      className={`${styles.modalOverlay} desktopOnly`}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <BookOpen size={18} style={{ color: "var(--clr-app-accent)" }} />
            <h2 className={styles.modalTitle}>Add Book</h2>
          </div>
          <button className={styles.modalClose} onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Title *</label>
              <input
                type="text"
                className={styles.formInput}
                value={form.title}
                onChange={e => set("title", e.target.value)}
                placeholder="Book title…"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Author *</label>
              <input
                type="text"
                className={styles.formInput}
                value={form.author}
                onChange={e => set("author", e.target.value)}
                placeholder="Author name…"
                required
              />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>ISBN</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={form.isbn}
                  onChange={e => set("isbn", e.target.value)}
                  placeholder="Optional…"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Quantity *</label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={form.quantity}
                  onChange={e => set("quantity", parseInt(e.target.value, 10) || 1)}
                  min={1}
                  required
                />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category *</label>
                <select
                  className={styles.formSelect}
                  value={form.category}
                  onChange={e => set("category", e.target.value)}
                  required
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Shelf Location</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={form.shelfLocation}
                  onChange={e => set("shelfLocation", e.target.value)}
                  placeholder="e.g. Block A, Shelf 1"
                />
              </div>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={submitting || !form.title.trim() || !form.author.trim()}
            >
              {submitting ? "Adding…" : "Add Book"}
            </button>
          </div>
        </form>
      </div>
    </div>

    {/* Add Book sheet — mobile */}
    <div className="mobileOnly">
      <MobileSheet
        open
        onClose={onClose}
        title="Add Book"
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={onClose} disabled={submitting}>Cancel</button>
          <button
            type="button"
            className={kit.btnPrimary}
            onClick={() => submit({ preventDefault: () => {} } as React.FormEvent)}
            disabled={submitting || !form.title.trim() || !form.author.trim()}
          >
            {submitting ? "Saving…" : "Save Book"}
          </button>
        </>}
      >
        <div className={kit.field}>
          <label>Title *</label>
          <input type="text" className={kit.input} value={form.title} onChange={e => set("title", e.target.value)} placeholder="Book title…" />
        </div>
        <div className={kit.field}>
          <label>Author *</label>
          <input type="text" className={kit.input} value={form.author} onChange={e => set("author", e.target.value)} placeholder="Author name…" />
        </div>
        <div className={kit.field}>
          <label>ISBN</label>
          <input type="text" className={kit.input} value={form.isbn} onChange={e => set("isbn", e.target.value)} placeholder="Optional…" />
        </div>
        <div className={kit.fieldRow}>
          <div className={kit.field}>
            <label>Quantity *</label>
            <input type="number" className={kit.input} value={form.quantity} onChange={e => set("quantity", parseInt(e.target.value, 10) || 1)} min={1} />
          </div>
          <div className={kit.field}>
            <label>Category *</label>
            <select className={kit.select} value={form.category} onChange={e => set("category", e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className={kit.field}>
          <label>Shelf Location</label>
          <input type="text" className={kit.input} value={form.shelfLocation} onChange={e => set("shelfLocation", e.target.value)} placeholder="e.g. Block A, Shelf 1" />
        </div>
      </MobileSheet>
    </div>
    </>
  );
}

// ── Edit Book Modal ────────────────────────────────────────────────────────────
// Note: nearly identical to Add Book above — intentionally has no dedicated
// mobile bottom-sheet. It keeps rendering as-is (no desktopOnly/mobileOnly
// gating) so it still works as a fallback on small screens.

interface EditBookModalProps {
  book: LibraryBook;
  canManage: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

function EditBookModal({ book, canManage, onClose, onSuccess, onError }: EditBookModalProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    title: book.title,
    author: book.author,
    isbn: book.isbn ?? "",
    category: book.category,
    quantity: book.quantity,
    shelfLocation: book.shelfLocation ?? "",
  });

  function set(field: string, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/library/books/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          author: form.author.trim(),
          isbn: form.isbn.trim() || undefined,
          category: form.category,
          quantity: form.quantity,
          shelfLocation: form.shelfLocation.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to update book");
      }
      onSuccess("Book details updated");
      router.refresh();
      onClose();
    } catch (err: unknown) {
      onError((err as Error).message ?? "Failed to update book");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!(await confirm({ message: `Delete "${book.title}"? This cannot be undone.`, tone: "danger", confirmLabel: "Delete" }))) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/library/books/${book.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Failed to delete book");
      onSuccess("Book deleted");
      router.refresh();
      onClose();
    } catch (err: unknown) {
      onError((err as Error).message ?? "Failed to delete book");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <Pencil size={18} style={{ color: "var(--clr-app-accent)" }} />
            <h2 className={styles.modalTitle}>Edit Book</h2>
          </div>
          <button className={styles.modalClose} onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={submit}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Title *</label>
              <input type="text" className={styles.formInput} value={form.title} onChange={e => set("title", e.target.value)} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Author *</label>
              <input type="text" className={styles.formInput} value={form.author} onChange={e => set("author", e.target.value)} required />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>ISBN</label>
                <input type="text" className={styles.formInput} value={form.isbn} onChange={e => set("isbn", e.target.value)} placeholder="Optional…" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Quantity *</label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={form.quantity}
                  onChange={e => set("quantity", parseInt(e.target.value, 10) || 1)}
                  min={book.quantity - book.available}
                  required
                />
                <span className={styles.fieldHint}>{book.checkedOut} currently checked out — quantity can&apos;t go below that.</span>
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category *</label>
                <select className={styles.formSelect} value={form.category} onChange={e => set("category", e.target.value)} required>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Shelf Location</label>
                <input type="text" className={styles.formInput} value={form.shelfLocation} onChange={e => set("shelfLocation", e.target.value)} placeholder="e.g. Block A, Shelf 1" />
              </div>
            </div>
          </div>
          <div className={styles.modalFooter}>
            {canManage && book.checkedOut === 0 && (
              <button type="button" className={styles.btnDangerText} onClick={handleDelete} disabled={deleting}>
                <Trash2 size={13} /> {deleting ? "Deleting…" : "Delete Book"}
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button type="button" className={styles.btnCancel} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.btnPrimary} disabled={submitting || !form.title.trim() || !form.author.trim()}>
              {submitting ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Check Out Modal ────────────────────────────────────────────────────────────

interface CheckoutModalProps {
  books: LibraryBook[];
  students: LibraryStudent[];
  defaultBookId?: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

function CheckoutModal({
  books,
  students,
  defaultBookId,
  onClose,
  onSuccess,
  onError,
}: CheckoutModalProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const availableBooks = books.filter(b => b.available > 0);
  const [form, setForm] = useState({
    bookId:    defaultBookId ?? availableBooks[0]?.id ?? "",
    studentId: students[0]?.id ?? "",
    dueDate:   defaultDueDateStr(),
  });

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.bookId || !form.studentId || !form.dueDate) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/library/checkouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId:    form.bookId,
          studentId: form.studentId,
          dueDate:   new Date(form.dueDate).toISOString(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error((data as { error?: string }).error ?? "Checkout failed");
      onSuccess("Book checked out successfully");
      router.refresh();
      onClose();
    } catch (err: unknown) {
      onError((err as Error).message ?? "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedBook = books.find(b => b.id === form.bookId) ?? null;

  return (
    <>
    <div
      className={`${styles.modalOverlay} desktopOnly`}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <BookMarked size={18} style={{ color: "var(--clr-app-accent)" }} />
            <h2 className={styles.modalTitle}>Issue Book</h2>
          </div>
          <button className={styles.modalClose} onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Book *</label>
              <div className={styles.selectWrap}>
                <select
                  className={styles.formSelect}
                  value={form.bookId}
                  onChange={e => set("bookId", e.target.value)}
                  required
                >
                  <option value="">Select an available book…</option>
                  {availableBooks.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.title} — {b.author} ({b.available} available)
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className={styles.selectChevron} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Student *</label>
              <div className={styles.selectWrap}>
                <select
                  className={styles.formSelect}
                  value={form.studentId}
                  onChange={e => set("studentId", e.target.value)}
                  required
                >
                  <option value="">Select student…</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.admNo})
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className={styles.selectChevron} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Due Date *</label>
              <input
                type="date"
                className={styles.formInput}
                value={form.dueDate}
                onChange={e => set("dueDate", e.target.value)}
                required
              />
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={submitting || !form.bookId || !form.studentId}
            >
              {submitting ? "Issuing…" : "Issue Book"}
            </button>
          </div>
        </form>
      </div>
    </div>

    {/* Issue Book sheet — mobile */}
    <div className="mobileOnly">
      <MobileSheet
        open
        onClose={onClose}
        title="Issue Book"
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={onClose} disabled={submitting}>Cancel</button>
          <button
            type="button"
            className={kit.btnPrimary}
            onClick={() => submit({ preventDefault: () => {} } as React.FormEvent)}
            disabled={submitting || !form.bookId || !form.studentId}
          >
            {submitting ? "Issuing…" : "Issue Book"}
          </button>
        </>}
      >
        <div className={kit.field}>
          <label>Book *</label>
          <select className={kit.select} value={form.bookId} onChange={e => set("bookId", e.target.value)}>
            <option value="">Select an available book…</option>
            {availableBooks.map(b => (
              <option key={b.id} value={b.id}>{b.title} — {b.author} ({b.available} available)</option>
            ))}
          </select>
        </div>
        <div className={kit.field}>
          <label>Student *</label>
          <select className={kit.select} value={form.studentId} onChange={e => set("studentId", e.target.value)}>
            <option value="">Select student…</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.admNo})</option>
            ))}
          </select>
        </div>
        <div className={kit.field}>
          <label>Due Date *</label>
          <input type="date" className={kit.input} value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
        </div>
        {selectedBook && (
          <div className={kit.previewCard}>
            <div className={kit.previewIcon}><BookMarked size={16} /></div>
            <div className={kit.previewInfo}>
              <p className={kit.previewTitle}>{selectedBook.title}</p>
              <p className={kit.previewSub}>{selectedBook.author} · {selectedBook.available} available</p>
            </div>
          </div>
        )}
      </MobileSheet>
    </div>
    </>
  );
}

// ── Checkouts table ────────────────────────────────────────────────────────────

export function CheckoutsTable({
  checkouts,
  returning,
  onReturn,
  overdueView = false,
}: {
  checkouts: LibraryCheckout[];
  returning: string | null;
  onReturn: (id: string) => void;
  overdueView?: boolean;
}) {
  if (checkouts.length === 0) {
    return (
      <div className={styles.tabEmpty}>
        {overdueView ? "No overdue checkouts." : "No active checkouts."}
      </div>
    );
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Book Title</th>
            <th>Student</th>
            <th>Class</th>
            <th>Checked Out</th>
            <th>Due Date</th>
            <th className={styles.center}>Days Left</th>
            <th className={styles.right}>Return</th>
          </tr>
        </thead>
        <tbody>
          {checkouts.map(c => {
            const days = daysFromNow(c.dueDate);
            return (
              <tr key={c.id} className={styles.dataRow}>
                <td>
                  <div className={styles.bookTitle}>{c.bookTitle}</div>
                  <div className={styles.bookAuthorSm}>{c.bookAuthor}</div>
                </td>
                <td>
                  <div className={styles.studentNameCell}>{c.studentName}</div>
                  <div className={styles.monoSm}>{c.admNo}</div>
                </td>
                <td>{c.className}</td>
                <td>{fmtDate(c.checkedOutAt)}</td>
                <td>{fmtDate(c.dueDate)}</td>
                <td className={styles.center}>
                  {days < 0 ? (
                    <span className={styles.overdueChip}>
                      {Math.abs(days)}d overdue
                    </span>
                  ) : days === 0 ? (
                    <span className={styles.dueTodayChip}>Due today</span>
                  ) : (
                    <span className={days <= 2 ? styles.dueSoonChip : styles.daysOk}>
                      {days}d
                    </span>
                  )}
                </td>
                <td className={styles.right}>
                  <button
                    className={styles.btnReturn}
                    disabled={returning === c.id}
                    onClick={() => onReturn(c.id)}
                  >
                    <RotateCcw size={13} />
                    {returning === c.id ? "…" : "Return"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Book Detail panel (read-only view) ───────────────────────────────────────

function BookDetail({
  book,
  libNum,
  activeCheckouts,
}: {
  book: LibraryBook;
  libNum: string;
  activeCheckouts: LibraryCheckout[];
}) {
  const isAvailable = book.available > 0;

  return (
    <div className={styles.bookDetail}>
      <div className={styles.bookDetailTop}>
        <div className={styles.bookIconWrap}>
          <BookCopy size={40} style={{ color: "var(--clr-app-border)" }} />
        </div>
        <div className={styles.bookDetailBody}>
          <h3 className={styles.bookDetailTitle}>{book.title}</h3>
          <p className={styles.bookDetailAuthor}>{book.author}</p>
          <p className={styles.bookDetailLib}>{libNum}{book.isbn ? ` · ISBN ${book.isbn}` : ""}</p>
          <div className={styles.bookDetailBadge}>
            {isAvailable ? (
              <span className={styles.availBadge}>Available</span>
            ) : (
              <span className={styles.loanBadge}>On Loan</span>
            )}
            <span className={styles.typeBadge}>{book.category}</span>
          </div>
        </div>
      </div>

      {book.shelfLocation && (
        <div className={styles.shelfSection}>
          <span className={styles.shelfLabel}>Shelf Location</span>
          <span className={styles.shelfValue}>{book.shelfLocation}</span>
        </div>
      )}

      <div className={styles.bookDetailStats}>
        <div className={styles.bookStatItem}>
          <span className={styles.bookStatLabel}>Total</span>
          <span className={styles.bookStatValue}>{book.quantity}</span>
        </div>
        <div className={styles.bookStatItem}>
          <span className={styles.bookStatLabel}>Available</span>
          <span
            className={styles.bookStatValue}
            style={{ color: isAvailable ? "var(--clr-success)" : "var(--clr-error)" }}
          >
            {book.available}
          </span>
        </div>
        <div className={styles.bookStatItem}>
          <span className={styles.bookStatLabel}>On Loan</span>
          <span className={styles.bookStatValue}>{book.checkedOut}</span>
        </div>
      </div>

      <div className={styles.checkoutListSection}>
        <span className={styles.shelfLabel}>Currently Checked Out To</span>
        {activeCheckouts.length === 0 ? (
          <p className={styles.noCheckoutsHint}>No copies currently on loan.</p>
        ) : (
          <div className={styles.checkoutList}>
            {activeCheckouts.map((c) => (
              <div key={c.id} className={styles.checkoutListItem}>
                <div>
                  <div className={styles.checkoutListName}>{c.studentName}</div>
                  <div className={styles.checkoutListMeta}>{c.className} · {c.admNo}</div>
                </div>
                <span className={c.isOverdue ? styles.overdueChip : styles.dueSoonChip}>
                  Due {fmtDate(c.dueDate)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function LibraryContent({
  books,
  checkouts,
  students,
  stats,
  canManage,
}: LibraryProps) {
  const router = useRouter();
  const [catFilter,       setCatFilter]       = useState<string>("");
  const [search,          setSearch]          = useState<string>("");
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [returning,       setReturning]       = useState<string | null>(null);
  const [checkedIds,      setCheckedIds]      = useState<Set<string>>(new Set());
  const [bulkDeleting,    setBulkDeleting]    = useState(false);

  // A single modal slot — only one modal can ever be open at a time, by construction.
  type ModalState =
    | { type: "addBook" }
    | { type: "view"; book: LibraryBook }
    | { type: "edit"; book: LibraryBook }
    | { type: "checkout"; book?: LibraryBook }
    | null;
  const [modal, setModal] = useState<ModalState>(null);

  // Build book index map for LIB numbers (sorted by title, matching server order)
  const bookIndexMap = new Map(books.map((b, i) => [b.id, i]));

  // Derived
  const categories     = Array.from(new Set(books.map(b => b.category))).sort();
  const overdue        = checkouts.filter(c => c.isOverdue);
  const totalTitles    = books.length;
  const totalQty       = books.reduce((s, b) => s + b.quantity, 0);
  const totalAvailable = books.reduce((s, b) => s + b.available, 0);
  const totalCheckedOut = books.reduce((s, b) => s + b.checkedOut, 0);

  const filteredBooks = books.filter(b =>
    (catFilter === "" || b.category === catFilter) &&
    (search === "" || b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleReturn(checkoutId: string) {
    setReturning(checkoutId);
    try {
      const res = await fetch(`/api/library/checkouts/${checkoutId}`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Return failed");
      showToast("Book returned successfully", "success");
      router.refresh();
    } catch {
      showToast("Failed to return book. Please try again.", "error");
    } finally {
      setReturning(null);
    }
  }

  async function bulkDeleteBooks() {
    if (checkedIds.size === 0) return;
    const confirmed = await confirm({
      message: `Delete ${checkedIds.size} selected book title${checkedIds.size !== 1 ? "s" : ""}? This cannot be undone.`,
      tone: "danger",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;
    setBulkDeleting(true);
    try {
      const results = await Promise.allSettled(
        Array.from(checkedIds).map((id) => fetch(`/api/library/books/${id}`, { method: "DELETE" }))
      );
      const succeeded = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;
      const failed = results.length - succeeded;
      showToast(`${succeeded} book${succeeded !== 1 ? "s" : ""} deleted${failed ? `, ${failed} failed` : ""}.`, failed ? "error" : "success");
      setCheckedIds(new Set());
      router.refresh();
    } finally {
      setBulkDeleting(false);
    }
  }

  const PAGE_SIZE = 6;
  const [tab, setTab] = useState<"catalog" | "checkouts">("catalog");
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / PAGE_SIZE));
  const pageBooks = filteredBooks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className={styles.root}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Library Management</h1>
          <p className={styles.subtitle}>Manage books, checkouts, and returns.</p>
        </div>
        <div className={styles.headerActions}>
          {canManage && (
            <button className={styles.btnPrimary} onClick={() => setModal({ type: "addBook" })}>
              <Plus size={15} /> Add Book
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Total Titles</span>
            <div className={styles.statIconBox}><LibraryBig size={16} /></div>
          </div>
          <div className={styles.statValue}>{totalTitles}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Total Copies</span>
            <div className={styles.statIconBox}><BookOpen size={16} /></div>
          </div>
          <div className={styles.statValue}>{totalQty}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Currently Checked Out</span>
            <div className={styles.statIconBox}><ClipboardList size={16} /></div>
          </div>
          <div className={styles.statValue}>{totalCheckedOut}</div>
        </div>
        <div className={`${styles.statCard} ${overdue.length > 0 ? styles.statCardAlert : ""}`}>
          <div className={styles.statTop}>
            <span className={`${styles.statLabel} ${overdue.length > 0 ? styles.statLabelAlert : ""}`}>Overdue Returns</span>
            <div className={`${styles.statIconBox} ${overdue.length > 0 ? styles.statIconAlert : ""}`}><AlertTriangle size={16} /></div>
          </div>
          <div className={`${styles.statValue} ${overdue.length > 0 ? styles.statValueAlert : ""}`}>{overdue.length}</div>
        </div>
      </div>

      {/* Main card */}
      <div className={styles.mainCard}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === "catalog" ? styles.tabActive : ""}`} onClick={() => setTab("catalog")}>Catalog</button>
          <button className={`${styles.tab} ${tab === "checkouts" ? styles.tabActive : ""}`} onClick={() => setTab("checkouts")}>
            Checkouts
            {overdue.length > 0 && <span className={styles.tabBadge}>{overdue.length}</span>}
          </button>
        </div>

        {tab === "catalog" && (
          <>
            <div className={styles.filterBar}>
              <div className={styles.searchWrap}>
                <Search size={14} className={styles.searchIcon} />
                <input
                  className={styles.searchInput}
                  placeholder="Search catalog…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <div className={styles.filterRight}>
                <span className={styles.filterLabel}>Filter:</span>
                <div className={styles.selectWrap}>
                  <select className={styles.select} value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}>
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} className={styles.selectChevron} />
                </div>
              </div>
            </div>

            {checkedIds.size > 0 && (
              <div className={styles.filterBar} style={{ background: "var(--clr-success-bg)", borderBottom: "1px solid var(--clr-success-border)" }}>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--clr-success)" }}>{checkedIds.size} selected</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className={styles.iconBtn} style={{ background: "var(--clr-error)", borderColor: "var(--clr-error)", color: "#fff", width: "auto", padding: "0 12px", display: "inline-flex", alignItems: "center", gap: 6 }} onClick={bulkDeleteBooks} disabled={bulkDeleting}>
                    <Trash2 size={14} /> {bulkDeleting ? "Deleting…" : "Delete Selected"}
                  </button>
                  <button className={styles.iconBtn} style={{ width: "auto", padding: "0 12px" }} onClick={() => setCheckedIds(new Set())}>Clear</button>
                </div>
              </div>
            )}

            {pageBooks.length === 0 ? (
              <div className={styles.tabEmpty}>No books match your search.</div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}>
                        <input
                          type="checkbox"
                          checked={pageBooks.some(b => b.checkedOut === 0) && pageBooks.filter(b => b.checkedOut === 0).every(b => checkedIds.has(b.id))}
                          onChange={() => {
                            const selectable = pageBooks.filter(b => b.checkedOut === 0);
                            const next = new Set(checkedIds);
                            if (selectable.every(b => checkedIds.has(b.id))) selectable.forEach(b => next.delete(b.id));
                            else selectable.forEach(b => next.add(b.id));
                            setCheckedIds(next);
                          }}
                        />
                      </th>
                      <th>Title</th>
                      <th>Author</th>
                      <th>ISBN</th>
                      <th>Category</th>
                      <th className={styles.right}>Qty</th>
                      <th>Available</th>
                      <th>Shelf</th>
                      <th className={styles.right}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageBooks.map(book => {
                      const isAvail = book.available > 0;
                      return (
                        <tr key={book.id} className={styles.dataRowStatic}>
                          <td>
                            <input
                              type="checkbox"
                              checked={checkedIds.has(book.id)}
                              disabled={book.checkedOut > 0}
                              title={book.checkedOut > 0 ? "Cannot delete a book with active checkouts" : undefined}
                              onChange={() => {
                                const next = new Set(checkedIds);
                                if (next.has(book.id)) next.delete(book.id); else next.add(book.id);
                                setCheckedIds(next);
                              }}
                            />
                          </td>
                          <td className={styles.bookTitle}>{book.title}</td>
                          <td>{book.author}</td>
                          <td className={styles.isbnMono}>{book.isbn ?? "—"}</td>
                          <td><span className={styles.typeBadge}>{book.category}</span></td>
                          <td className={styles.right}>{book.quantity}</td>
                          <td className={isAvail ? styles.availText : styles.availTextZero}>{book.available}</td>
                          <td>{book.shelfLocation ?? "—"}</td>
                          <td className={styles.right}>
                            <div className={styles.tableActions}>
                              <button className={styles.iconBtn} title="View details" onClick={() => setModal({ type: "view", book })}><Eye size={16} /></button>
                              {canManage && (
                                <button className={styles.iconBtn} title="Edit book" onClick={() => setModal({ type: "edit", book })}><Pencil size={14} /></button>
                              )}
                              <button
                                className={styles.iconBtn}
                                title={isAvail ? "Hand over to a student" : "No copies available"}
                                disabled={!isAvail}
                                onClick={() => setModal({ type: "checkout", book })}
                              >
                                <ArrowRightLeft size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {filteredBooks.length > 0 && (
              <div className={styles.paginationBar}>
                <span className={styles.paginationInfo}>Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filteredBooks.length)} of {filteredBooks.length} entries</span>
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

        {tab === "checkouts" && (
          <CheckoutsTable checkouts={checkouts} returning={returning} onReturn={handleReturn} />
        )}
      </div>

      {/* Exactly one modal slot — never two at once */}
      {modal?.type === "view" && (
        <div className={`${styles.modalOverlay} desktopOnly`} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <BookCopy size={18} style={{ color: "var(--clr-app-accent)" }} />
                <h2 className={styles.modalTitle}>Book Details</h2>
              </div>
              <button className={styles.modalClose} onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <BookDetail
                book={modal.book}
                libNum={libNumber(bookIndexMap.get(modal.book.id) ?? 0)}
                activeCheckouts={checkouts.filter((c) => c.bookId === modal.book.id)}
              />
            </div>
            <div className={styles.modalFooter}>
              {canManage && (
                <button className={styles.btnCancel} onClick={() => setModal({ type: "edit", book: modal.book })}>
                  <Pencil size={13} /> Edit
                </button>
              )}
              <button
                className={styles.btnPrimary}
                disabled={modal.book.available <= 0}
                onClick={() => setModal({ type: "checkout", book: modal.book })}
              >
                <ArrowRightLeft size={13} /> Hand Over
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book Details sheet — mobile */}
      <div className="mobileOnly">
        <MobileSheet
          open={modal?.type === "view"}
          onClose={() => setModal(null)}
          title="Book Details"
          footer={<button type="button" className={kit.btnOutline} onClick={() => setModal(null)}>Close</button>}
        >
          {modal?.type === "view" && (
            <BookDetail
              book={modal.book}
              libNum={libNumber(bookIndexMap.get(modal.book.id) ?? 0)}
              activeCheckouts={checkouts.filter((c) => c.bookId === modal.book.id)}
            />
          )}
        </MobileSheet>
      </div>

      {modal?.type === "edit" && (
        <EditBookModal
          book={modal.book}
          canManage={canManage}
          onClose={() => setModal(null)}
          onSuccess={msg => showToast(msg, "success")}
          onError={msg => showToast(msg, "error")}
        />
      )}

      {modal?.type === "addBook" && (
        <AddBookModal
          onClose={() => setModal(null)}
          onSuccess={msg => showToast(msg, "success")}
          onError={msg => showToast(msg, "error")}
        />
      )}

      {modal?.type === "checkout" && (
        <CheckoutModal
          books={books}
          students={students}
          defaultBookId={modal.book?.id}
          onClose={() => setModal(null)}
          onSuccess={msg => showToast(msg, "success")}
          onError={msg => showToast(msg, "error")}
        />
      )}
    </div>
  );
}
