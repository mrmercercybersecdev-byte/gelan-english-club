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

  if (isAdminPath(pathname)) {
    if (!configuredHost) {
      return new Response("Organiser access is not configured.", { status: 503 });
    }
    if (requestHost !== configuredHost) return new Response(null, { status: 404 });
  }

  if (configuredHost && requestHost === configuredHost && pathname === "/") {
    return NextResponse.rewrite(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/api/admin/:path*"],
};
