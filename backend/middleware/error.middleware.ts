import type { Request, Response, NextFunction } from "express";
import { isDatabaseUnavailable } from "../prisma";

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error("[API Error]", err);
  if (isDatabaseUnavailable(err)) {
    res.status(503).json({ error: "Database unavailable", code: "DATABASE_UNAVAILABLE" });
    return;
  }
  const message = err instanceof Error ? err.message : "Internal server error";
  const status  = (err as any)?.status ?? 500;
  res.status(status).json({ error: message });
}
