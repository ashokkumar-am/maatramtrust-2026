import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Session } from "next-auth";

/**
 * Guard for admin dashboard pages (Server Components). Verifies the real
 * session against the database — the Proxy/middleware guard is only optimistic
 * — and redirects to login (unauthenticated) or the dashboard home (non-admin).
 */
export async function requireAdminPage(
  callbackUrl = "/dashboard",
): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }
  return session;
}
