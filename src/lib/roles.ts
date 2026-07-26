/**
 * RBAC roles. Every registered account is a `donor` by default (they can
 * sponsor students and see their own giving); `editor` additionally manages
 * the blog; `admin` has full dashboard access.
 */
export const ROLES = ["donor", "editor", "admin"] as const;

export type UserRole = (typeof ROLES)[number];

export const DEFAULT_ROLE: UserRole = "donor";

/** Roles allowed to manage blog posts. */
export const BLOG_MANAGER_ROLES: readonly UserRole[] = ["admin", "editor"];

/**
 * Map a stored role to a current one. Accounts created before the RBAC split
 * may hold the legacy `"user"` role (or nothing) — both mean `donor` now.
 */
export function normalizeRole(value?: string | null): UserRole {
  return (ROLES as readonly string[]).includes(value ?? "")
    ? (value as UserRole)
    : DEFAULT_ROLE;
}

export const USER_STATUSES = ["active", "disabled"] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

/** Users without a stored status (e.g. created before the field existed). */
export const DEFAULT_STATUS: UserStatus = "active";

/**
 * Whether an email is in the admin allowlist (`ADMIN_EMAILS` env var,
 * comma-separated, case-insensitive). Lets you bootstrap admins without editing
 * the database — the auth session grants the `admin` role to these accounts.
 * Read lazily (inside the function) so it stays safe if imported client-side.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.toLowerCase());
}
