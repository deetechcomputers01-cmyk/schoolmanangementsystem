import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

// BigInt fields (e.g. BackupRecord.sizeBytes) come back from Prisma as native
// bigint, which JSON.stringify/NextResponse.json cannot serialize on their own
// and throws instead — this makes every bigint round-trip through the API as a string.
declare global {
  interface BigInt {
    toJSON(): string;
  }
}
if (!(BigInt.prototype as unknown as { toJSON?: unknown }).toJSON) {
  (BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function (this: bigint) {
    return this.toString();
  };
}

function readLocalEnvFiles() {
  const paths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../.env"),
    path.resolve(process.cwd(), "frontend/.env"),
    path.resolve(process.cwd(), "../frontend/.env"),
  ];

  return [...new Set(paths)]
    .filter((envPath) => existsSync(envPath))
    .map((envPath) => readFileSync(envPath, "utf8"))
    .join("\n");
}

export function readLocalEnvValue(name: string) {
  if (process.env[name]) return process.env[name];
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = readLocalEnvFiles().match(new RegExp(`^${escapedName}\\s*=\\s*["']?([^"'\\r\\n]+)["']?\\s*$`, "m"));
  return match?.[1];
}

const databaseUrl = readLocalEnvValue("DATABASE_URL");

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function isDatabaseUnavailable(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code)
    : "";
  const message = error instanceof Error ? error.message : String(error ?? "");

  return ["P1001", "P1002", "P1017", "P2024"].includes(code)
    || /can't reach database|connection refused|connect econnrefused|database server/i.test(message);
}

export async function readFromDatabase<T>(operation: () => Promise<T>, fallback: T) {
  try {
    return await operation();
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    console.error("[Database unavailable]", error instanceof Error ? error.message : error);
    return fallback;
  }
}
