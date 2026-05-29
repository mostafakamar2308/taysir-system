import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { verifyToken } from "@/lib/jwt";
import { Role } from "@/types/user";

const intlMiddleware = createMiddleware(routing);

function getPathWithoutLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1);
    }
    if (pathname === `/${locale}`) {
      return "/";
    }
  }
  return pathname;
}

function getLocaleFromPathname(pathname: string) {
  for (const locale of routing.locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    } else return routing.defaultLocale;
  }
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;
  const locale = getLocaleFromPathname(pathname);
  const pathWithoutLocale = getPathWithoutLocale(pathname);

  if (pathWithoutLocale === "login") {
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        let dashboardPath = "";
        if (payload.role === Role.Admin) {
          dashboardPath = `/dashboard/`;
        } else if (payload.role === Role.Tutor) {
          dashboardPath = `/dashboard/tutor`;
        } else if (payload.role === Role.SuperAdmin) {
          dashboardPath = `/dashboard/admin/dashboard`;
        }
        if (dashboardPath) {
          return NextResponse.redirect(
            new URL(`/${locale}${dashboardPath}`, request.url),
          );
        }
      }
    }
    return intlMiddleware(request);
  }

  if (pathWithoutLocale.startsWith("dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    if (
      pathWithoutLocale.startsWith("dashboard/admin") &&
      payload.role !== Role.SuperAdmin
    ) {
      return NextResponse.redirect(
        new URL(`/${locale}/dashboard`, request.url),
      );
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.id.toString());
    requestHeaders.set("x-user-role", String(payload.role));
    requestHeaders.set("x-user-academy-id", String(payload.academyId || ""));

    return intlMiddleware(
      new NextRequest(request, {
        headers: requestHeaders,
      }),
    );
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
