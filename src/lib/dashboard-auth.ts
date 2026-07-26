import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Session } from "next-auth";
import type { UserRole } from "@/lib/roles";

/**
 * RBAC guard for dashboard pages (Server Components). Verifies the real
 * session against the database — the Proxy/middleware guard is only optimistic
 * — and redirects to login (unauthenticated) or the dashboard home (role not
 * allowed).
 */
export async function requireRolePage(
  roles: readonly UserRole[],
  callbackUrl = "/dashboard",
): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  if (!roles.includes(session.user.role)) {
    redirect("/dashboard");
  }
  return session;
}

/** Admin-only page guard — see {@link requireRolePage}. */
export async function requireAdminPage(
  callbackUrl = "/dashboard",
): Promise<Session> {
  return requireRolePage(["admin"], callbackUrl);
}
