import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify, SignJWT } from "jose";

const PUBLIC_PATHS   = ["/login", "/sign-in", "/forgot-password", "/reset-password"];
const AUTH_API       = "/api/auth/";
const STATIC_SKIP    = ["/_next/static", "/_next/image", "/favicon.ico", "/manifest.json", "/sw.js"];

// Role → allowed page prefixes
const ROLE_ROUTES: Record<string, string[]> = {
  super_admin: ["/"],
  principal:   ["/dashboard","/students","/staff","/attendance","/gradebook","/fees","/timetable","/academic-calendar","/exams","/report-cards","/announcements","/payroll","/health","/library","/reports","/notifications","/messages","/helpdesk","/parent-communications"],
  teacher:     ["/dashboard","/students","/attendance","/gradebook","/timetable","/academic-calendar","/exams","/report-cards","/announcements","/library","/teacher-portal","/notifications","/messages"],
  staff:       ["/dashboard","/students","/fees","/payroll","/my-payslips","/reports","/academic-calendar","/report-cards","/announcements","/health","/library","/accountant-portal","/transport-portal","/canteen-portal","/health-portal","/security-portal","/notifications"],
  student:     ["/dashboard","/student","/report-cards","/timetable","/announcements","/library","/notifications"],
  guardian:    ["/dashboard","/parent-portal","/report-cards","/timetable","/announcements","/fees/receipt","/notifications","/messages"],
  accountant:  ["/dashboard","/fees","/payroll","/reports","/accountant-portal","/announcements","/notifications"],
};

function canAccess(role: string, pathname: string): boolean {
  if (role === "super_admin") return true;
  const allowed = ROLE_ROUTES[role] ?? [];
  return allowed.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

const encoder = new TextEncoder();

function accessSecret() {
  return encoder.encode(process.env.JWT_ACCESS_SECRET ?? "dev-access-secret-change-before-production");
}

function refreshSecret() {
  return encoder.encode(process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-change-me");
}

type TokenPayload = {
  id: string;
  name: string;
  email: string;
  role: string;
  tokenType: string;
};

async function tryRefresh(request: NextRequest): Promise<{ payload: TokenPayload; newAccessToken: string } | null> {
  const rt = request.cookies.get("refreshToken")?.value;
  if (!rt) return null;
  try {
    const { payload: p } = await jwtVerify(rt, refreshSecret());
    const rp = p as TokenPayload;
    if (rp.tokenType !== "refresh") return null;

    const newAt = await new SignJWT({
      id: rp.id, name: rp.name, email: rp.email, role: rp.role, tokenType: "access",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(accessSecret());

    return { payload: rp, newAccessToken: newAt };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (STATIC_SKIP.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (pathname.startsWith(AUTH_API))                    return NextResponse.next();
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const isApi = pathname.startsWith("/api/");
  const token = request.cookies.get("accessToken")?.value;

  let payload: TokenPayload;
  let newAccessToken: string | undefined;

  if (token) {
    try {
      const { payload: p } = await jwtVerify(token, accessSecret());
      payload = p as TokenPayload;
      if (payload.tokenType !== "access") throw new Error("not access token");
    } catch {
      // Access token expired or invalid — try refresh
      const refreshed = await tryRefresh(request);
      if (!refreshed) {
        if (isApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        return NextResponse.redirect(new URL("/login", request.url));
      }
      payload = refreshed.payload;
      newAccessToken = refreshed.newAccessToken;
    }
  } else {
    // No access token at all — try refresh
    const refreshed = await tryRefresh(request);
    if (!refreshed) {
      if (isApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      return NextResponse.redirect(new URL("/login", request.url));
    }
    payload = refreshed.payload;
    newAccessToken = refreshed.newAccessToken;
  }

  // Forward identity via headers so server components can read them
  const headers = new Headers(request.headers);
  headers.set("x-user-id",    payload.id);
  headers.set("x-user-role",  payload.role);
  headers.set("x-user-name",  payload.name);
  headers.set("x-user-email", payload.email);
  headers.set("x-pathname",   pathname);

  if (isApi) {
    const res = NextResponse.next({ request: { headers } });
    if (newAccessToken) {
      res.cookies.set("accessToken", newAccessToken, {
        httpOnly: true, sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/", maxAge: 60 * 15,
      });
    }
    return res;
  }

  const role = payload.role;
  if (!canAccess(role, pathname)) {
    const home =
      role === "student"  ? "/dashboard"  :
      role === "guardian" ? "/parent-portal"   :
      "/dashboard";
    return NextResponse.redirect(new URL(home, request.url));
  }

  const res = NextResponse.next({ request: { headers } });
  if (newAccessToken) {
    res.cookies.set("accessToken", newAccessToken, {
      httpOnly: true, sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/", maxAge: 60 * 15,
    });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)"],
};
