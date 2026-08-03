import { prisma } from "../prisma";
import type { SessionUser } from "@/types/auth";
import { audit } from "./audit.service";

const includeOwner = { owner: { select: { id: true, name: true, role: true } } } as const;

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Called by Staff/Student upload flows so every real file lands in the Document
// Center too — SchoolDocument is the canonical, aggregated store for browsing by owner.
export async function syncOwnerDocument(
  ownerId: string,
  category: "staff-files" | "student-records",
  file: { name: string; url: string; type: string; size: number }
) {
  return prisma.schoolDocument.create({
    data: {
      name: file.name,
      category,
      fileUrl: file.url,
      fileSize: fmtSize(file.size),
      fileType: file.type,
      visibility: "internal",
      status: "active",
      ownerId,
    },
  });
}

// ── Queries ────────────────────────────────────────────────────────────────────

export async function listDocuments(filters?: {
  category?: string;
  status?:   string;
  visibility?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.category)   where.category   = filters.category;
  if (filters?.status)     where.status     = filters.status;
  if (filters?.visibility) where.visibility = filters.visibility;

  return prisma.schoolDocument.findMany({
    where,
    include: includeOwner,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getDocumentStats() {
  const [total, pendingReview, needsSign, restricted, archived] = await Promise.all([
    prisma.schoolDocument.count(),
    prisma.schoolDocument.count({ where: { status: "pending_review" } }),
    prisma.schoolDocument.count({ where: { needsSign: true, status: { not: "archived" } } }),
    prisma.schoolDocument.count({ where: { status: "restricted" } }),
    prisma.schoolDocument.count({ where: { status: "archived" } }),
  ]);
  return { total, pendingReview, needsSign, restricted, archived };
}

export async function getFolderCounts(): Promise<Record<string, number>> {
  const rows = await prisma.schoolDocument.groupBy({
    by: ["category"],
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((r) => [r.category, r._count._all]));
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export async function createDocument(actor: SessionUser, data: {
  name:       string;
  category:   string;
  fileUrl?:   string;
  fileSize?:  string;
  fileType?:  string;
  visibility?: string;
  classDept?: string;
  isTemplate?: boolean;
}) {
  const doc = await prisma.schoolDocument.create({
    data: {
      name:       data.name,
      category:   data.category,
      fileUrl:    data.fileUrl   ?? "",
      fileSize:   data.fileSize  ?? "",
      fileType:   data.fileType  ?? "pdf",
      visibility: data.visibility ?? "internal",
      status:     "pending_review",
      ownerId:    actor.id,
      classDept:  data.classDept  ?? null,
      isTemplate: data.isTemplate ?? false,
    },
    include: includeOwner,
  });
  await audit(actor, "upload_document", "SchoolDocument", doc.id, { name: doc.name });
  return doc;
}

export async function updateDocument(actor: SessionUser, id: string, data: {
  status?:     string;
  visibility?: string;
  needsSign?:  boolean;
  name?:       string;
}) {
  const doc = await prisma.schoolDocument.update({
    where: { id },
    data:  {
      ...(data.status     !== undefined && { status:     data.status }),
      ...(data.visibility !== undefined && { visibility: data.visibility }),
      ...(data.needsSign  !== undefined && { needsSign:  data.needsSign }),
      ...(data.name       !== undefined && { name:       data.name }),
    },
    include: includeOwner,
  });
  await audit(actor, "update_document", "SchoolDocument", id, data);
  return doc;
}

export async function deleteDocument(actor: SessionUser, id: string) {
  const doc = await prisma.schoolDocument.delete({ where: { id } });
  await audit(actor, "delete_document", "SchoolDocument", id, { name: doc.name });
  return doc;
}
