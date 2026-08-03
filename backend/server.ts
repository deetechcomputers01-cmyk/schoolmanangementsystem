/**
 * backend/server.ts — standalone Express API server.
 * Deploy this on Render (or any Node host) as the backend.
 * The Next.js frontend imports directly from backend/* when on the same host,
 * or calls this server over HTTP when deployed separately.
 *
 * Start: npx ts-node backend/server.ts
 * Build: npx tsc -p backend/tsconfig.json
 * Run:   node backend/dist/server.js
 */

import express from "express";
import cors from "cors";
import { json } from "express";

// ── Route modules ──────────────────────────────────────────────────────────
import { authRouter }          from "./routes/auth.routes";
import { studentsRouter }      from "./routes/students.routes";
import { staffRouter }         from "./routes/staff.routes";
import { attendanceRouter }    from "./routes/attendance.routes";
import { feesRouter }          from "./routes/fees.routes";
import { gradebookRouter }     from "./routes/gradebook.routes";
import { timetableRouter }     from "./routes/timetable.routes";
import { libraryRouter }       from "./routes/library.routes";
import { healthRouter }        from "./routes/health.routes";
import { examsRouter }         from "./routes/exams.routes";
import { announcementsRouter } from "./routes/announcements.routes";
import { academicRouter }      from "./routes/academic.routes";
import { payrollRouter }       from "./routes/payroll.routes";
import { reportsRouter }       from "./routes/reports.routes";
import { settingsRouter }      from "./routes/settings.routes";
import { adminRouter }         from "./routes/admin.routes";

// ── Middleware ─────────────────────────────────────────────────────────────
import { authMiddleware }  from "./middleware/auth.middleware";
import { errorMiddleware } from "./middleware/error.middleware";
import { isDatabaseUnavailable, prisma, readLocalEnvValue } from "./prisma";

const app  = express();
const PORT = process.env.PORT ?? 4000;
const FRONTEND_URL = readLocalEnvValue("FRONTEND_URL") ?? "http://localhost:3000";

// ── Global middleware ──────────────────────────────────────────────────────
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(json());

// ── Health check (no auth) ─────────────────────────────────────────────────
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "ok", ts: new Date().toISOString() });
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      res.status(503).json({ status: "degraded", database: "unavailable", code: "DATABASE_UNAVAILABLE" });
      return;
    }
    throw error;
  }
});

// ── Public routes ─────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);

// ── Protected routes (require valid JWT) ──────────────────────────────────
app.use(authMiddleware);
app.use("/api/students",      studentsRouter);
app.use("/api/staff",         staffRouter);
app.use("/api/attendance",    attendanceRouter);
app.use("/api/fees",          feesRouter);
app.use("/api/gradebook",     gradebookRouter);
app.use("/api/timetable",     timetableRouter);
app.use("/api/library",       libraryRouter);
app.use("/api/health",        healthRouter);
app.use("/api/exams",         examsRouter);
app.use("/api/announcements", announcementsRouter);
app.use("/api/academic",      academicRouter);
app.use("/api/payroll",       payrollRouter);
app.use("/api/reports",       reportsRouter);
app.use("/api/settings",      settingsRouter);
app.use("/api/admin",         adminRouter);

// ── Error handler (must be last) ──────────────────────────────────────────
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`[ScholarSphere API] running on port ${PORT}`);
});

export default app;
