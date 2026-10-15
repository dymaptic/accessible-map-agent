import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_ROUTES = ["/app", "/history", "/settings", "/admin"];

export function middleware(request: NextRequest) {
  const sessionId = request.cookies.get("session_id")?.value;
  const path = request.nextUrl.pathname;

  // Check if this is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );

  if (isProtectedRoute && !sessionId) {
    // Redirect to home page with return URL
    const url = new URL("/", request.url);
    url.searchParams.set("returnTo", path);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/app/:path*",
    "/history/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
