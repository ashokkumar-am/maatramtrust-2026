import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/roles";

declare module "next-auth" {
  /** Shape of the object returned by `auth()` / `useSession()`. */
  interface Session {
    user: {
      role: UserRole;
    } & DefaultSession["user"];
  }

  /** The user record persisted by the adapter (MongoDB). */
  interface User {
    role?: UserRole;
  }
}
