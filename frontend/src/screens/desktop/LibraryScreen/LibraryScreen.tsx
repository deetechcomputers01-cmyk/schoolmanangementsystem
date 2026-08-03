import { requireRole } from "@backend/auth/page-guard";
import { getCurrentUser } from "@backend/auth/cookies";
import { prisma } from "@backend/prisma";
import { LibraryContent } from "./LibraryContent";
import type {
  LibraryBook,
  LibraryCheckout,
  LibraryStudent,
  LibraryStats,
} from "./LibraryContent";

export const dynamic = "force-dynamic";

export async function LibraryScreen() {
  const user = await requireRole(
    "super_admin",
    "principal",
    "teacher",
    "staff",
    "student",
  );

  const now = new Date();

  const [books, checkouts, studentRows] = await Promise.all([
    prisma.book.findMany({
      include: {
        _count: {
          select: { checkouts: { where: { returnedAt: null } } },
        },
      },
      orderBy: { title: "asc" },
    }),
    prisma.bookCheckout.findMany({
      where: { returnedAt: null },
      include: {
        book: { select: { id: true, title: true, author: true } },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            class: { select: { name: true } },
          },
        },
      },
      orderBy: { dueDate: "asc" },
    }),
    prisma.student.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNo: true,
      },
      orderBy: [{ firstName: "asc" }],
    }),
  ]);

  const totalBooks     = books.reduce((s, b) => s + b.quantity,  0);
  const availableBooks = books.reduce((s, b) => s + b.available, 0);

  const libraryBooks: LibraryBook[] = books.map(b => ({
    id:            b.id,
    title:         b.title,
    author:        b.author,
    isbn:          b.isbn          ?? null,
    category:      b.category,
    quantity:      b.quantity,
    available:     b.available,
    checkedOut:    b.quantity - b.available,
    shelfLocation: b.shelfLocation ?? null,
  }));

  const libraryCheckouts: LibraryCheckout[] = checkouts.map(c => ({
    id:          c.id,
    bookId:      c.book.id,
    bookTitle:   c.book.title,
    bookAuthor:  c.book.author,
    studentId:   c.student.id,
    studentName: `${c.student.firstName} ${c.student.lastName}`,
    admNo:       c.student.admissionNo,
    className:   c.student.class?.name ?? "—",
    checkedOutAt: c.checkedOutAt.toISOString(),
    dueDate:     c.dueDate.toISOString(),
    isOverdue:   c.dueDate < now,
  }));

  const libraryStudents: LibraryStudent[] = studentRows.map(s => ({
    id:    s.id,
    name:  `${s.firstName} ${s.lastName}`,
    admNo: s.admissionNo,
  }));

  const stats: LibraryStats = {
    totalBooks,
    availableBooks,
    checkedOut:   totalBooks - availableBooks,
    overdueCount: libraryCheckouts.filter(c => c.isOverdue).length,
  };

  const canManage =
    user.role === "super_admin" ||
    user.role === "principal"   ||
    user.role === "staff";

  return (
    <LibraryContent
      books={libraryBooks}
      checkouts={libraryCheckouts}
      students={libraryStudents}
      stats={stats}
      canManage={canManage}
    />
  );
}
