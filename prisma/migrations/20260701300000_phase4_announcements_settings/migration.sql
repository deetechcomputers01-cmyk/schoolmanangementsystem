-- Phase 4: Announcements & School Settings

CREATE TABLE "Announcement" (
    "id"          TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "body"        TEXT NOT NULL,
    "audience"    TEXT[] NOT NULL DEFAULT '{}',
    "isPinned"    BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt"   TIMESTAMP(3),
    "authorId"    TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "SchoolSettings" (
    "id"           TEXT NOT NULL DEFAULT 'singleton',
    "name"         TEXT NOT NULL DEFAULT 'ScholarSphere Academy',
    "address"      TEXT NOT NULL DEFAULT '',
    "motto"        TEXT NOT NULL DEFAULT '',
    "phone"        TEXT NOT NULL DEFAULT '',
    "email"        TEXT NOT NULL DEFAULT '',
    "logoUrl"      TEXT,
    "reportFooter" TEXT NOT NULL DEFAULT '',
    "timezone"     TEXT NOT NULL DEFAULT 'Africa/Accra',
    "gradingScale" JSONB,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SchoolSettings_pkey" PRIMARY KEY ("id")
);
