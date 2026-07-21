import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { toAuditUser, type AuditUser } from "@/lib/audit";

export type AdminAuthResult =
  { ok: true; actor: AuditUser } | { ok: false; response: NextResponse };

/**
 * Guard for admin-only Route Handlers. Returns the acting admin as an
 * {@link AuditUser} on success, or a ready-to-return `401`/`403` response.
 * Every admin endpoint must call this first (Server Functions are reachable
 * by direct POST, so authorization lives in the handler, not the UI).
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const session = await auth();

  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  if (session.user.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, actor: toAuditUser(session.user) };
}
