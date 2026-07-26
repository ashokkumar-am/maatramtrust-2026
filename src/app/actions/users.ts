"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  ROLES,
  USER_STATUSES,
  type UserRole,
  type UserStatus,
} from "@/lib/roles";
import { getAdminUser, setUserRole, setUserStatus } from "@/lib/users";

export type UserActionResult = { ok: true } | { ok: false; error: string };

type Guarded = { ok: true } | { ok: false; error: string };

/**
 * Server Actions are reachable by direct POST, so each mutation re-checks the
 * caller is an admin and re-validates the target: acting on yourself is
 * blocked (no self-lockout), and `ADMIN_EMAILS` allowlist accounts are
 * immutable here — the env allowlist outranks anything stored in the DB.
 */
async function requireAdminActor(targetId: string): Promise<Guarded> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { ok: false, error: "Only admins can manage users." };
  }
  if (session.user.id === targetId) {
    return { ok: false, error: "You can't change your own account." };
  }
  return { ok: true };
}

/** Promote a user to admin or demote them back to a regular user. */
export async function setUserRoleAction(
  id: string,
  role: UserRole,
): Promise<UserActionResult> {
  const guard = await requireAdminActor(id);
  if (!guard.ok) return guard;

  if (!ROLES.includes(role)) {
    return { ok: false, error: "Unknown role." };
  }

  const target = await getAdminUser(id);
  if (!target) {
    return { ok: false, error: "User not found." };
  }
  if (target.isEnvAdmin) {
    return {
      ok: false,
      error: "This admin is set via ADMIN_EMAILS and can't be changed here.",
    };
  }

  try {
    await setUserRole(id, role);
    revalidatePath("/dashboard/users");
    return { ok: true };
  } catch (error) {
    console.error("[users] role update failed", error);
    return { ok: false, error: "Could not update the role." };
  }
}

/** Disable a user (revokes their sessions, blocks sign-in) or re-enable them. */
export async function setUserStatusAction(
  id: string,
  status: UserStatus,
): Promise<UserActionResult> {
  const guard = await requireAdminActor(id);
  if (!guard.ok) return guard;

  if (!USER_STATUSES.includes(status)) {
    return { ok: false, error: "Unknown status." };
  }

  const target = await getAdminUser(id);
  if (!target) {
    return { ok: false, error: "User not found." };
  }
  if (target.isEnvAdmin) {
    return {
      ok: false,
      error: "This admin is set via ADMIN_EMAILS and can't be disabled here.",
    };
  }

  try {
    await setUserStatus(id, status);
    revalidatePath("/dashboard/users");
    return { ok: true };
  } catch (error) {
    console.error("[users] status update failed", error);
    return { ok: false, error: "Could not update the status." };
  }
}
