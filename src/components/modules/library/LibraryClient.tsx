"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Book, Loader2, Plus, RotateCcw, Trash2, X } from "lucide-react";

type BookRow = { id: string; title: string; author: string; isbn: string | null; category: string; quantity: number; available: number; _count: { checkouts: number } };
type Checkout = {
  id: string; checkedOutAt: string | Date; dueDate: string | Date; returnedAt: string | Date | null;
  book: { title: string; author: string };
  student: { firstName: string; lastName: string; admissionNo: string; class: { name: string } };
};
type Student = { id: string; firstName: string; lastName: string; class: { name: string } };

type Props = { initialBooks: BookRow[]; initialCheckouts: Checkout[]; students: Student[]; canManage: boolean };

const BOOK_BLANK = { title: "", author: "", isbn: "", category: "Fiction", quantity: "1" };
const CATEGORIES = ["Fiction","Non-Fiction","Science","Mathematics","History","Geography","Literature","Reference","Religious Studies","Other"];

export function LibraryClient({ initialBooks, initialCheckouts, students, canManage }: Props) {
  const [books, setBooks]         = useState<BookRow[]>(initialBooks);
  const [checkouts, setCheckouts] = useState<Checkout[]>(initialCheckouts);
  const [tab, setTab]             = useState<"books"|"checkouts">("books");
  const [showBookForm, setShowBookForm] = useState(false);
  const [bookForm, setBookForm]   = useState({ ...BOOK_BLANK });
  const [checkoutForm, setCheckoutForm] = useState({ bookId: "", studentId: "", dueDate: "" });
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [busy, setBusy]           = useState<string | null>(null);
  const [flash, setFlash]         = useState<{ msg: string; ok: boolean } | null>(null);

  const notify = (msg: string, ok = true) => { setFlash({ msg, ok }); setTimeout(() => setFlash(null), 3000); };
  const reloadBooks     = async () => { const r = await fetch("/api/library/books");     if (r.ok) setBooks(await r.json()); };
  const reloadCheckouts = async () => { const r = await fetch("/api/library/checkouts"); if (r.ok) setCheckouts(await r.json()); };

  const addBook = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy("addbook");
    const res = await fetch("/api/library/books", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...bookForm, isbn: bookForm.isbn || undefined, quantity: parseInt(bookForm.quantity) })
    });
    setBusy(null);
    if (res.ok) { setShowBookForm(false); setBookForm({ ...BOOK_BLANK }); notify("Book added"); reloadBooks(); }
    else notify("Failed", false);
  };

  const removeBook = async (id: string) => {
    if (!confirm("Delete this book?")) return; setBusy(`del-${id}`);
    const res = await fetch(`/api/library/books/${id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) { notify("Deleted"); reloadBooks(); } else { const j = await res.json(); notify(j.error ?? "Failed", false); }
  };

  const checkout = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy("checkout");
    const res = await fetch("/api/library/checkouts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...checkoutForm, dueDate: new Date(checkoutForm.dueDate).toISOString() })
    });
    setBusy(null);
    if (res.ok) { setShowCheckoutForm(false); setCheckoutForm({ bookId: "", studentId: "", dueDate: "" }); notify("Book checked out"); reloadBooks(); reloadCheckouts(); }
    else { const j = await res.json(); notify(j.error ?? "Failed", false); }
  };

  const returnBook = async (id: string) => {
    setBusy(`return-${id}`);
    const res = await fetch(`/api/library/checkouts/${id}`, { method: "PATCH" });
    setBusy(null);
    if (res.ok) { notify("Book returned"); reloadBooks(); reloadCheckouts(); }
    else notify("Failed", false);
  };

  const fmt = (d: string | Date) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const isOverdue = (dueDate: string | Date) => new Date(dueDate) < new Date();
  const activeCheckouts = checkouts.filter((c) => !c.returnedAt);

  return (
    <div>
      {flash && <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${flash.ok ? "bg-emerald/10 text-emerald" : "bg-rose-50 text-rose-600"}`}>{flash.msg}</div>}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        {(["books","checkouts"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-5 py-2 text-sm font-semibold capitalize transition ${tab === t ? "bg-navy text-white" : "border border-line text-muted hover:border-navy"}`}>
            {t === "books" ? `Books (${books.length})` : `Checkouts (${activeCheckouts.length} active)`}
          </button>
        ))}
        {canManage && tab === "books" && <button onClick={() => setShowBookForm(true)} className="ml-auto flex items-center gap-2 rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/80"><Plus size={14} /> Add Book</button>}
        {canManage && tab === "checkouts" && <button onClick={() => setShowCheckoutForm(true)} className="ml-auto flex items-center gap-2 rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/80"><Book size={14} /> Check Out</button>}
      </div>

      {/* Add book form */}
      {showBookForm && (
        <Card className="mb-6 border-2 border-emerald/30">
          <div className="mb-4 flex items-center justify-between"><h3 className="font-heading text-base font-semibold text-navy">Add Book</h3>
            <button onClick={() => setShowBookForm(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-slate-100"><X size={16} /></button></div>
          <form onSubmit={addBook} className="grid gap-3 sm:grid-cols-2">
            <div><label className="mb-1 block text-xs font-semibold text-muted">Title</label>
              <input required value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-semibold text-muted">Author</label>
              <input required value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-semibold text-muted">ISBN (optional)</label>
              <input value={bookForm.isbn} onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })} className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-semibold text-muted">Category</label>
              <select value={bookForm.category} onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })} className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div><label className="mb-1 block text-xs font-semibold text-muted">Quantity</label>
              <input type="number" min="1" value={bookForm.quantity} onChange={(e) => setBookForm({ ...bookForm, quantity: e.target.value })} className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
            <div className="flex items-end"><button type="submit" disabled={!!busy} className="flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {busy === "addbook" ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add Book</button></div>
          </form>
        </Card>
      )}

      {/* Checkout form */}
      {showCheckoutForm && (
        <Card className="mb-6 border-2 border-sky-200">
          <div className="mb-4 flex items-center justify-between"><h3 className="font-heading text-base font-semibold text-navy">Check Out Book</h3>
            <button onClick={() => setShowCheckoutForm(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-slate-100"><X size={16} /></button></div>
          <form onSubmit={checkout} className="grid gap-3 sm:grid-cols-3">
            <div><label className="mb-1 block text-xs font-semibold text-muted">Book</label>
              <select required value={checkoutForm.bookId} onChange={(e) => setCheckoutForm({ ...checkoutForm, bookId: e.target.value })} className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm">
                <option value="">Select book</option>
                {books.filter((b) => b.available > 0).map((b) => <option key={b.id} value={b.id}>{b.title} ({b.available} avail.)</option>)}</select></div>
            <div><label className="mb-1 block text-xs font-semibold text-muted">Student</label>
              <select required value={checkoutForm.studentId} onChange={(e) => setCheckoutForm({ ...checkoutForm, studentId: e.target.value })} className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm">
                <option value="">Select student</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.class.name})</option>)}</select></div>
            <div><label className="mb-1 block text-xs font-semibold text-muted">Due Date</label>
              <input type="date" required value={checkoutForm.dueDate} onChange={(e) => setCheckoutForm({ ...checkoutForm, dueDate: e.target.value })} className="focus-ring w-full rounded-lg border border-line px-3 py-2 text-sm" /></div>
            <div className="sm:col-span-3"><button type="submit" disabled={!!busy} className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {busy === "checkout" ? <Loader2 size={14} className="animate-spin" /> : <Book size={14} />} Confirm Checkout</button></div>
          </form>
        </Card>
      )}

      {/* Books table */}
      {tab === "books" && (
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted">
              <tr><th className="px-5 py-3">Title</th><th className="px-5 py-3">Author</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Available</th>{canManage && <th className="px-5 py-3" />}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {books.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted">No books in the catalogue.</td></tr>}
              {books.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-navy">{b.title}<p className="text-xs font-normal text-muted">{b.isbn}</p></td>
                  <td className="px-5 py-3 text-muted">{b.author}</td>
                  <td className="px-5 py-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-navy">{b.category}</span></td>
                  <td className="px-5 py-3">
                    <Badge tone={b.available > 0 ? "success" : "danger"}>{b.available}/{b.quantity}</Badge>
                  </td>
                  {canManage && <td className="px-5 py-3">
                    <button onClick={() => removeBook(b.id)} disabled={!!busy} className="grid h-7 w-7 place-items-center rounded-lg border border-line text-muted hover:border-rose-200 hover:text-rose-500 disabled:opacity-40">
                      {busy === `del-${b.id}` ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={13} />}</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Checkouts table */}
      {tab === "checkouts" && (
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted">
              <tr><th className="px-5 py-3">Book</th><th className="px-5 py-3">Student</th><th className="px-5 py-3">Checked Out</th><th className="px-5 py-3">Due Date</th><th className="px-5 py-3">Status</th>{canManage && <th className="px-5 py-3" />}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {checkouts.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-muted">No checkouts recorded.</td></tr>}
              {checkouts.map((c) => (
                <tr key={c.id} className={`hover:bg-slate-50 ${!c.returnedAt && isOverdue(c.dueDate) ? "bg-rose-50/40" : ""}`}>
                  <td className="px-5 py-3 font-semibold text-navy">{c.book.title}</td>
                  <td className="px-5 py-3"><p className="font-semibold text-navy">{c.student.firstName} {c.student.lastName}</p><p className="text-xs text-muted">{c.student.class.name}</p></td>
                  <td className="px-5 py-3 text-muted">{fmt(c.checkedOutAt)}</td>
                  <td className={`px-5 py-3 font-semibold ${!c.returnedAt && isOverdue(c.dueDate) ? "text-rose-600" : "text-navy"}`}>{fmt(c.dueDate)}</td>
                  <td className="px-5 py-3">
                    {c.returnedAt ? <Badge tone="success">Returned {fmt(c.returnedAt)}</Badge>
                      : isOverdue(c.dueDate) ? <Badge tone="danger">Overdue</Badge>
                      : <Badge tone="warning">Out</Badge>}
                  </td>
                  {canManage && <td className="px-5 py-3">
                    {!c.returnedAt && <button onClick={() => returnBook(c.id)} disabled={!!busy} className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-muted hover:border-emerald hover:text-emerald disabled:opacity-40">
                      {busy === `return-${c.id}` ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />} Return</button>}
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
