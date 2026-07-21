import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require an authenticated user.
const protectedRoutes = ["/dashboard", "/account"];
// Routes that an authenticated user shouldn't see (e.g. the login page).
const authRoutes = ["/login"];

// Auth.js v5 session cookie names. The `__Secure-` prefix is used over HTTPS.
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

// Optimistic check only: we read the session cookie's presence, never the DB.
// Secure verification (validating the session against MongoDB) happens in
// Server Components / Route Handlers via `auth()`. See the Next.js auth guide.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasSession = SESSION_COOKIES.some(
    (name) => request.cookies.get(name)?.value,
  );

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  // Unauthenticated user hitting a protected route → send to login.
  if (isProtected && !hasSession) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated user hitting the login page → send home.
  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except API routes, Next internals, and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
