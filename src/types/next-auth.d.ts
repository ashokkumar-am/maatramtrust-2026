import type { DefaultSession } from "next-auth";
import type { UserRole, UserStatus } from "@/lib/roles";

declare module "next-auth" {
  /** Shape of the object returned by `auth()` / `useSession()`. */
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  /** The user record persisted by the adapter (MongoDB). Stored roles may be
   * legacy values (e.g. `"user"`), so this is a plain string — normalize with
   * `normalizeRole()` before use. */
  interface User {
    role?: string;
    status?: UserStatus;
  }
}
