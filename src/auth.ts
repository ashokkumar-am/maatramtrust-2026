import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import { isAdminEmail, normalizeRole } from "@/lib/roles";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  // The app always runs behind a trusted reverse proxy (Amplify/CloudFront
  // in prod, `next dev` locally), so the Host header is safe to trust.
  // Without this, Auth.js v5 throws UntrustedHost on every request.
  trustHost: true,
  // Sign-in methods. To add a social provider (Facebook, Twitter/X,
  // Instagram, …) append it here with its env credentials and add its
  // display label to `src/lib/user-providers.ts` — the adapter links each
  // provider login to the user via the `accounts` collection.
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  // The MongoDB adapter persists users; use database-backed sessions.
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Disabled users can't sign back in (disabling also revoked their
    // sessions — see `setUserStatus`). First-time users have no record yet,
    // so no status — they pass through.
    signIn({ user }) {
      return user.status !== "disabled";
    },
    // With the database strategy, `user` is the record from MongoDB.
    // Surface its id (self-checks, giving lookups) and role: the
    // `ADMIN_EMAILS` allowlist wins, otherwise the stored role (legacy
    // "user" / missing → "donor").
    session({ session, user }) {
      session.user.id = user.id;
      session.user.role = isAdminEmail(user.email)
        ? "admin"
        : normalizeRole(user.role);
      return session;
    },
  },
});
