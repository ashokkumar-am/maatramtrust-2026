export const ROLES = ["user", "admin"] as const;

export type UserRole = (typeof ROLES)[number];

export const DEFAULT_ROLE: UserRole = "user";

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
