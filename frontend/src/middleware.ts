import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS   = ["/login", "/reset-password"];
const AUTH_API       = "/api/auth/";
const STATIC_SKIP    = ["/_next/static", "/_next/image", "/favicon.ico", "/manifest.json", "/sw.js"];

// Role → allowed page prefixes
const ROLE_ROUTES: Record<string, string[]> = {
  super_admin: ["/"],
  principal:   ["/dashboard","/students","/staff","/attendance","/gradebook","/fees","/timetable","/academic-calendar","/exams","/report-cards","/announcements","/admissions","/payroll","/discipline","/health","/library","/reports"],
  teacher:     ["/dashboard","/students","/attendance","/gradebook","/timetable","/academic-calendar","/exams","/report-cards","/announcements","/discipline","/library"],
  staff:       ["/dashboard","/students","/fees","/reports","/academic-calendar","/report-cards","/announcements","/admissions","/health","/library"],
  student:     ["/dashboard","/student-portal","/report-cards","/timetable","/announcements","/library"],
  guardian:    ["/dashboard","/parent-portal","/report-cards","/timetable","/announcements"],
  accountant:  ["/dashboard","/fees","/payroll","/reports","/accountant-portal","/announcements"],
};

function canAccess(role: string, pathname: string): boolean {
  if (role === "super_admin") return true;
  const allowed = ROLE_ROUTES[role] ?? [];
  return allowed.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

function accessSecret() {
  return new TextEncoder().encode(
    process.env.JWT_ACCESS_SECRET ?? "dev-access-secret-change-before-production"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (STATIC_SKIP.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (pathname.startsWith(AUTH_API))                    return NextResponse.next();
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const isApi  = pathname.startsWith("/api/");
  const token  = request.cookies.get("accessToken")?.value;

  if (!token) {
    if (isApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let payload: { id: string; name: string; email: string; role: string; tokenType: string };
  try {
    const { payload: p } = await jwtVerify(token, accessSecret());
    payload = p as typeof payload;
    if (payload.tokenType !== "access") throw new Error("not access token");
  } catch {
    if (isApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Forward identity via headers so server components can read them
  const headers = new Headers(request.headers);
  headers.set("x-user-id",    payload.id);
  headers.set("x-user-role",  payload.role);
  headers.set("x-user-name",  payload.name);
  headers.set("x-user-email", payload.email);

  if (isApi) return NextResponse.next({ request: { headers } });

  const role = payload.role;
  if (!canAccess(role, pathname)) {
    const home =
      role === "student"  ? "/student-portal"  :
      role === "guardian" ? "/parent-portal"   :
      "/dashboard";
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)"],
};
