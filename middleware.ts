import { NextResponse, type NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/auth/tokens";
import { canAccessRoute } from "@/lib/auth/rbac";
import type { Role } from "@prisma/client";

const PUBLIC_PATHS = ["/login", "/reset-password"];
const AUTH_API_PREFIX = "/api/auth/";
const STATIC_PREFIXES = ["/_next/static", "/_next/image", "/favicon.ico", "/manifest.json", "/sw.js"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let static assets and auth endpoints through immediately
  if (STATIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (pathname.startsWith(AUTH_API_PREFIX)) return NextResponse.next();
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const isProtectedPage = !PUBLIC_PATHS.includes(pathname) && !pathname.startsWith("/api/");
  const isProtectedApi = pathname.startsWith("/api/");

  const token = request.cookies.get("accessToken")?.value;

  if (!token) {
    if (isProtectedApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let payload: Awaited<ReturnType<typeof verifyAccessToken>>;
  try {
    payload = await verifyAccessToken(token);
    if (payload.tokenType !== "access") throw new Error("Invalid token type");
  } catch {
    if (isProtectedApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Attach user role to request headers so API routes can read it without re-verifying
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.id);
  requestHeaders.set("x-user-role", payload.role);
  requestHeaders.set("x-user-name", payload.name);
  requestHeaders.set("x-user-email", payload.email);

  // API routes: skip page-level routing, let service layer handle permissions
  if (isProtectedApi) {
    // Block inactive users at middleware level
    // (isActive check happens in user management service for API calls)
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Page routes: enforce role-based routing
  if (isProtectedPage) {
    const user = { id: payload.id, name: payload.name, email: payload.email, role: payload.role as Role };

    // Student and guardian go to their own portal
    if ((user.role === "student" || user.role === "guardian") && !pathname.startsWith("/portal") && !pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }

    if (!canAccessRoute(user, pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)"]
};
