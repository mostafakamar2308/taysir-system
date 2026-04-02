import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { verifyToken } from "@/lib/jwt";
import { Role } from "./types/user";

// Create the next-intl proxy
const intlMiddleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Public paths
  if (pathname === "/login") {
    if (token) {
      const payload = verifyToken(token);
      console.log(payload);

      if (payload) {
        if (payload.role === Role.Admin) {
          return NextResponse.redirect(new URL("/ar/dashboard/", request.url));
        }
        if (payload.role === Role.Tutor)
          return NextResponse.redirect(
            new URL("/ar/dashboard/tutor", request.url),
          );
        if (payload.role === Role.SuperAdmin)
          return NextResponse.redirect(
            new URL("/ar/dashboard/admin/dashboard", request.url),
          );
      }
    }
    return intlMiddleware(request);
  }

  // Protected dashboard paths
  if (pathname.startsWith("/ar/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (
      pathname.startsWith("/ar/dashboard/admin") &&
      payload.role !== Role.SuperAdmin
    ) {
      return NextResponse.redirect(new URL("/ar/dashboard", request.url));
    }

    // Add user info to headers for server components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.id.toString());
    requestHeaders.set("x-user-role", String(payload.role));
    requestHeaders.set("x-user-academy-id", String(payload.academyId || ""));

    // Continue with intl routing
    return intlMiddleware(
      new NextRequest(request, {
        headers: requestHeaders,
      }),
    );
  }

  // For all other routes, use intl middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
