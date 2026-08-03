import { prisma } from "../prisma";
import type { SessionUser } from "@/types/auth";
import { audit } from "./audit.service";

export async function listBooks(category?: string) {
  return prisma.book.findMany({
    where: category ? { category } : {},
    include: { _count: { select: { checkouts: true } } },
    orderBy: { title: "asc" }
  });
}

export async function addBook(
  actor: SessionUser,
  data: { title: string; author: string; isbn?: string; category: string; quantity: number; shelfLocation?: string }
) {
  const book = await prisma.book.create({
    data: { ...data, available: data.quantity, isbn: data.isbn || null, shelfLocation: data.shelfLocation || null }
  });
  await audit(actor, "add_book", "Book", book.id, { title: book.title });
  return book;
}

export async function updateBook(
  actor: SessionUser,
  id: string,
  data: { title?: string; author?: string; isbn?: string; category?: string; shelfLocation?: string; quantity?: number }
) {
  const book = await prisma.book.findUniqueOrThrow({ where: { id } });

  let available = book.available;
  if (data.quantity !== undefined && data.quantity !== book.quantity) {
    const checkedOut = book.quantity - book.available;
    if (data.quantity < checkedOut) {
      throw new Error(`Cannot reduce quantity below ${checkedOut} — that many copies are currently checked out.`);
    }
    available = data.quantity - checkedOut;
  }

  const updated = await prisma.book.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.author !== undefined && { author: data.author }),
      ...(data.isbn !== undefined && { isbn: data.isbn || null }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.shelfLocation !== undefined && { shelfLocation: data.shelfLocation || null }),
      ...(data.quantity !== undefined && { quantity: data.quantity, available }),
    },
  });
  await audit(actor, "update_book", "Book", id, data);
  return updated;
}

export async function deleteBook(actor: SessionUser, id: string) {
  if (actor.role !== "super_admin" && actor.role !== "principal") throw new Error("Forbidden");
  const book = await prisma.book.findUniqueOrThrow({ where: { id } });
  if (book.available !== book.quantity) throw new Error("Cannot delete — some copies are checked out");
  await prisma.book.delete({ where: { id } });
  await audit(actor, "delete_book", "Book", id, { title: book.title });
  return book;
}

export async function listCheckouts(active = false) {
  return prisma.bookCheckout.findMany({
    where: active ? { returnedAt: null } : {},
    include: {
      book:    { select: { title: true, author: true } },
      student: { select: { firstName: true, lastName: true, admissionNo: true, class: { select: { name: true } } } }
    },
    orderBy: { checkedOutAt: "desc" }
  });
}

export async function checkoutBook(
  actor: SessionUser,
  data: { bookId: string; studentId: string; dueDate: string }
) {
  const book = await prisma.book.findUniqueOrThrow({ where: { id: data.bookId } });
  if (book.available < 1) throw new Error("No copies available");

  const [checkout] = await prisma.$transaction([
    prisma.bookCheckout.create({
      data: {
        bookId:    data.bookId,
        studentId: data.studentId,
        dueDate:   new Date(data.dueDate)
      },
      include: { book: { select: { title: true } }, student: { select: { firstName: true, lastName: true } } }
    }),
    prisma.book.update({ where: { id: data.bookId }, data: { available: { decrement: 1 } } })
  ]);
  await audit(actor, "checkout_book", "BookCheckout", checkout.id, { bookId: data.bookId, studentId: data.studentId });
  return checkout;
}

export async function returnBook(actor: SessionUser, checkoutId: string) {
  const checkout = await prisma.bookCheckout.findUniqueOrThrow({ where: { id: checkoutId } });
  if (checkout.returnedAt) throw new Error("Already returned");

  const [updated] = await prisma.$transaction([
    prisma.bookCheckout.update({ where: { id: checkoutId }, data: { returnedAt: new Date() } }),
    prisma.book.update({ where: { id: checkout.bookId }, data: { available: { increment: 1 } } })
  ]);
  await audit(actor, "return_book", "BookCheckout", checkoutId, {});
  return updated;
}
