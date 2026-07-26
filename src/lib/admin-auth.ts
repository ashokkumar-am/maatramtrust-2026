import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { toAuditUser, type AuditUser } from "@/lib/audit";
import type { UserRole } from "@/lib/roles";

export type AdminAuthResult =
  { ok: true; actor: AuditUser } | { ok: false; response: NextResponse };

/**
 * RBAC guard for protected Route Handlers. Returns the acting user as an
 * {@link AuditUser} when their role is in `roles`, or a ready-to-return
 * `401`/`403` response. Every protected endpoint must call this first
 * (Server Functions are reachable by direct POST, so authorization lives in
 * the handler, not the UI).
 */
export async function requireRole(
  roles: readonly UserRole[],
): Promise<AdminAuthResult> {
  const session = await auth();

  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!roles.includes(session.user.role)) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, actor: toAuditUser(session.user) };
}

/** Admin-only guard — see {@link requireRole}. */
export async function requireAdmin(): Promise<AdminAuthResult> {
  return requireRole(["admin"]);
}
