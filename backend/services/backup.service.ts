import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import type { SessionUser } from "@/types/auth";
import { audit } from "./audit.service";

// Backup files hold every user's password hash + full PII, so they're encrypted
// at rest with AES-256-GCM — matching the "AES-256" claim shown in the UI.
const ENCRYPTION_KEY = scryptSync(
  process.env.BACKUP_ENCRYPTION_SECRET ?? "dev-backup-secret-change-me",
  "scholarsphere-backup-salt",
  32
);

function encryptBuffer(plaintext: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]); // iv(12) + authTag(16) + ciphertext
}

function decryptBuffer(encrypted: Buffer): Buffer {
  const iv = encrypted.subarray(0, 12);
  const authTag = encrypted.subarray(12, 28);
  const ciphertext = encrypted.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

const includeInitiator = { initiator: { select: { id: true, name: true, role: true } } } as const;

// Every real business model gets dumped, ordered so parent tables are created
// before the children that reference them (restore runs this list forward to
// re-create rows and in reverse to clear them first). BackupRecord itself is
// excluded — backing up the list of backups is circular and not useful.
const BACKUP_MODELS = [
  "user", "class", "academicYear", "schoolSettings", "book", "mealMenu", "hostel",
  "staff", "term", "room",
  "student", "subject",
  "guardian", "timetableSlot", "vehicle", "visitorLog", "asset",
  "blockedIP", "announcement", "calendarEvent", "auditLog", "staffSalary",
  "schoolDocument", "parentBroadcast", "approvalRequest", "supportTicket",
  "attendance", "feeRecord", "healthRecord", "bookCheckout", "grade", "exam",
  "payment", "sickVisit", "vaccination", "payslip", "transportRoute",
  "examScore", "examQuestion", "examAttempt", "ticketMessage", "approvalStep",
  "scholarship", "expense", "allocation", "hostelIncident", "assetMovement",
  "message", "mealServing", "studentTransport", "studentAnswer",
] as const;

const BACKUP_DIR = path.join(process.cwd(), "backend-data", "backups");

function replacer(_key: string, value: unknown) {
  if (value instanceof Prisma.Decimal) return { __type: "Decimal", value: value.toString() };
  if (typeof value === "bigint") return { __type: "BigInt", value: value.toString() };
  return value;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

function reviver(_key: string, value: unknown) {
  if (value && typeof value === "object" && "__type" in (value as Record<string, unknown>)) {
    const tagged = value as { __type: string; value: string };
    if (tagged.__type === "Decimal") return new Prisma.Decimal(tagged.value);
    if (tagged.__type === "BigInt") return BigInt(tagged.value);
  }
  if (typeof value === "string" && ISO_DATE_RE.test(value)) return new Date(value);
  return value;
}

function backupFilePath(id: string) {
  return path.join(BACKUP_DIR, `${id}.json.enc`);
}

// ── Queries ────────────────────────────────────────────────────────────────────

export async function listBackups(filters?: { status?: string; target?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.target) where.target = filters.target;

  return prisma.backupRecord.findMany({
    where,
    include: includeInitiator,
    orderBy: { createdAt: "desc" },
  });
}

export async function getBackup(id: string) {
  return prisma.backupRecord.findUnique({ where: { id }, include: includeInitiator });
}

export async function getBackupStats() {
  const [total, byStatus] = await Promise.all([
    prisma.backupRecord.count(),
    prisma.backupRecord.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const latest = await prisma.backupRecord.findFirst({
    where:   { status: "healthy" },
    orderBy: { createdAt: "desc" },
  });
  return { total, byStatus, latest };
}

// ── Mutations ──────────────────────────────────────────────────────────────────

// Real, portable backup: dumps every business table to a single JSON file on
// local disk (no pg_dump dependency, which may not exist on the deploy host).
export async function createBackup(actor: SessionUser, data: {
  name:       string;
  backupType: string;
  expiresAt?: Date;
}) {
  const record = await prisma.backupRecord.create({
    data: {
      name:        data.name,
      backupType:  data.backupType,
      target:      "local",
      status:      "running",
      initiatedBy: actor.id,
      expiresAt:   data.expiresAt ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
    include: includeInitiator,
  });
  await audit(actor, "run_backup", "BackupRecord", record.id, { name: record.name });

  const startedAt = Date.now();
  try {
    const dump: Record<string, unknown[]> = {};
    for (const model of BACKUP_MODELS) {
      dump[model] = await (prisma[model] as unknown as { findMany: () => Promise<unknown[]> }).findMany();
    }

    const payload = JSON.stringify(
      { version: 1, createdAt: new Date().toISOString(), models: BACKUP_MODELS, dump },
      replacer
    );
    const encrypted = encryptBuffer(Buffer.from(payload, "utf-8"));

    await mkdir(BACKUP_DIR, { recursive: true });
    await writeFile(backupFilePath(record.id), encrypted);

    const checksum  = createHash("sha256").update(encrypted).digest("hex");
    const sizeBytes = BigInt(encrypted.byteLength);
    const duration  = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

    return await prisma.backupRecord.update({
      where:   { id: record.id },
      data:    { status: "healthy", duration, sizeBytes, checksum },
      include: includeInitiator,
    });
  } catch (error) {
    await prisma.backupRecord.update({ where: { id: record.id }, data: { status: "failed" } });
    throw error;
  }
}

// Real restore: reads the dump file, verifies its checksum, then replaces every
// dumped table's contents with the backup's contents inside one transaction —
// either the whole restore lands, or nothing changes.
export async function restoreBackup(actor: SessionUser, id: string) {
  const record = await prisma.backupRecord.findUniqueOrThrow({ where: { id } });
  if (record.status !== "healthy") {
    throw new Error("Only a healthy backup can be restored.");
  }

  const encrypted = await readFile(backupFilePath(id)).catch(() => {
    throw new Error("Backup file is missing from disk — it may have been deleted or moved.");
  });
  if (record.checksum) {
    const actualChecksum = createHash("sha256").update(encrypted).digest("hex");
    if (actualChecksum !== record.checksum) {
      throw new Error("Backup file checksum mismatch — the file may be corrupted or modified.");
    }
  }

  let raw: string;
  try {
    raw = decryptBuffer(encrypted).toString("utf-8");
  } catch {
    throw new Error("Backup file could not be decrypted — it may be corrupted or the encryption key changed.");
  }

  const parsed = JSON.parse(raw, reviver) as { dump: Record<string, unknown[]> };

  await prisma.$transaction(
    async (tx) => {
      const client = tx as unknown as Record<string, { deleteMany: (a: object) => Promise<unknown>; createMany: (a: object) => Promise<unknown> }>;
      for (const model of [...BACKUP_MODELS].reverse()) {
        await client[model].deleteMany({});
      }
      for (const model of BACKUP_MODELS) {
        const rows = parsed.dump[model] ?? [];
        if (rows.length === 0) continue;
        await client[model].createMany({ data: rows });
      }
    },
    { timeout: 120_000, maxWait: 10_000 }
  );

  await audit(actor, "restore_backup", "BackupRecord", id, { name: record.name });
  return { restoredModels: BACKUP_MODELS.length, restoredAt: new Date().toISOString() };
}

export async function updateBackup(actor: SessionUser, id: string, data: {
  status?:   string;
  checksum?: string;
}) {
  const record = await prisma.backupRecord.update({
    where: { id },
    data:  {
      ...(data.status   !== undefined && { status:   data.status }),
      ...(data.checksum !== undefined && { checksum: data.checksum }),
    },
    include: includeInitiator,
  });
  await audit(actor, "update_backup", "BackupRecord", id, data);
  return record;
}

export async function deleteBackup(actor: SessionUser, id: string) {
  const record = await prisma.backupRecord.delete({ where: { id } });
  await unlink(backupFilePath(id)).catch(() => {});
  await audit(actor, "delete_backup", "BackupRecord", id, { name: record.name });
  return record;
}
