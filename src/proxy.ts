import { NextResponse, type NextRequest } from "next/server";
import { normalizedHostname } from "@/lib/admin-domain";

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/") ||
    pathname === "/api/admin" || pathname.startsWith("/api/admin/");
}

export function proxy(request: NextRequest) {
  const configuredHost = normalizedHostname(process.env.ADMIN_HOST);
  const requestHost = request.nextUrl.hostname.toLowerCase();
  const pathname = request.nextUrl.pathname;
  const isAdminDeployment = process.env.ADMIN_ONLY_DEPLOYMENT === "true";
  const isConfiguredAdminHost = Boolean(configuredHost && requestHost === configuredHost);

  if (isAdminPath(pathname)) {
    if (!isConfiguredAdminHost) return new Response(null, { status: 404 });
  }

  if (isConfiguredAdminHost && pathname === "/") {
    return NextResponse.rewrite(new URL("/admin", request.url));
  }

  if (isAdminDeployment && isConfiguredAdminHost) {
    const allowedPath = isAdminPath(pathname) || pathname.startsWith("/_next/") ||
      pathname.startsWith("/images/") || pathname.startsWith("/api/files/") || pathname.startsWith("/api/media/");
    if (!allowedPath) return new Response(null, { status: 404 });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-site-pathname", pathname);
  const countryCode = request.headers.get("x-vercel-ip-country")?.toUpperCase() ?? "XX";
  requestHeaders.set("x-app-country", /^[A-Z]{2}$/.test(countryCode) ? countryCode : "XX");
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/:path*"],
};
