"use client";

import { getOfflineDb, type SyncJob } from "./db";

export async function addToSyncQueue(url: string, body: unknown, method: SyncJob["method"] = "POST") {
  const db = await getOfflineDb();
  await db.add("syncQueue", { url, body, method, createdAt: Date.now() });
}

// Returns how many jobs synced successfully and how many are still queued
// (a failed job — bad status or a network error — stays queued, with its
// attempt count and last error recorded, for the next retry).
export async function flushSyncQueue() {
  const db = await getOfflineDb();
  const jobs = await db.getAll("syncQueue");
  let synced = 0;
  for (const job of jobs) {
    try {
      const response = await fetch(job.url, {
        method: job.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job.body)
      });
      if (response.ok && job.id) {
        await db.delete("syncQueue", job.id);
        synced += 1;
      } else if (job.id) {
        await db.put("syncQueue", { ...job, attempts: (job.attempts ?? 0) + 1, lastError: `Server responded ${response.status}` });
      }
    } catch {
      if (job.id) {
        await db.put("syncQueue", { ...job, attempts: (job.attempts ?? 0) + 1, lastError: "Network request failed" });
      }
    }
  }
  return { synced, remaining: jobs.length - synced };
}

export async function countSyncQueue() {
  const db = await getOfflineDb();
  return db.count("syncQueue");
}

export async function listSyncQueue() {
  const db = await getOfflineDb();
  const jobs = await db.getAll("syncQueue");
  return jobs.sort((a, b) => b.createdAt - a.createdAt);
}
