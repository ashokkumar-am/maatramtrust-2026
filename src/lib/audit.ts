import { auth } from "@/auth";

/**
 * Minimal snapshot of the authenticated user recorded on audited records
 * (e.g. `createdBy` / `updatedBy`). Denormalized so the audit trail is
 * readable without a join back to the users collection.
 */
export type AuditUser = {
  id?: string;
  email?: string;
  name?: string;
};

/**
 * Map a session user to the {@link AuditUser} shape. Pure so it can be reused
 * by any auth flow (Server Actions, admin API) without duplicating the mapping.
 */
export function toAuditUser(user: {
  id?: string | null;
  email?: string | null;
  name?: string | null;
}): AuditUser {
  return {
    id: user.id ?? undefined,
    email: user.email ?? undefined,
    name: user.name ?? undefined,
  };
}

/**
 * Resolve the current authenticated user as an {@link AuditUser}, or `null`
 * when there is no session. Callers (Server Actions) decide how to handle the
 * unauthenticated case so the mapping stays a single responsibility.
 */
export async function getAuditUser(): Promise<AuditUser | null> {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  return toAuditUser(session.user);
}
