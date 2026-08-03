import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { isDatabaseUnavailable } from "@backend/prisma";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function badRequest(details: unknown) {
  return NextResponse.json({ error: "Bad request", details }, { status: 400 });
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) return fail("Invalid request body", 422, error.flatten());
  if (error instanceof Error && error.message === "Forbidden") return fail("Forbidden", 403);
  if (error instanceof Error && error.message === "Unauthorized") return fail("Unauthorized", 401);
  if (isDatabaseUnavailable(error)) return fail("Database unavailable", 503, { code: "DATABASE_UNAVAILABLE" });
  return fail("Something went wrong", 500);
}
