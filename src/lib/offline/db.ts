"use client";

import { openDB, type DBSchema } from "idb";

export type SyncJob = {
  id?: number;
  url: string;
  body: unknown;
  method: "POST" | "PATCH" | "DELETE";
  createdAt: number;
};

interface SchoolDb extends DBSchema {
  syncQueue: {
    key: number;
    value: SyncJob;
  };
}

export function getOfflineDb() {
  return openDB<SchoolDb>("school-ms-offline", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("syncQueue")) {
        db.createObjectStore("syncQueue", { keyPath: "id", autoIncrement: true });
      }
    }
  });
}
