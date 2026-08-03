import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../auth/tokens";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const accessToken = header?.startsWith("Bearer ")
    ? header.slice(7)
    : readCookie(req.headers.cookie, "accessToken");

  if (!accessToken) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    const payload = await verifyAccessToken(accessToken);
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function readCookie(header: string | undefined, name: string) {
  const value = header?.split(";").find((part) => part.trim().startsWith(`${name}=`));
  return value ? decodeURIComponent(value.trim().slice(name.length + 1)) : undefined;
}
