"use client";

import { getOfflineDb, type SyncJob } from "./db";

export async function addToSyncQueue(url: string, body: unknown, method: SyncJob["method"] = "POST") {
  const db = await getOfflineDb();
  await db.add("syncQueue", { url, body, method, createdAt: Date.now() });
}

export async function flushSyncQueue() {
  const db = await getOfflineDb();
  const jobs = await db.getAll("syncQueue");
  for (const job of jobs) {
    const response = await fetch(job.url, {
      method: job.method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job.body)
    });
    if (response.ok && job.id) await db.delete("syncQueue", job.id);
  }
}

export async function countSyncQueue() {
  const db = await getOfflineDb();
  return db.count("syncQueue");
}
