import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import { DEFAULT_ROLE, isAdminEmail } from "@/lib/roles";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
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
    // With the database strategy, `user` is the record from MongoDB.
    // Surface its role on the session: the `ADMIN_EMAILS` allowlist wins,
    // otherwise fall back to the stored role (defaulting to "user").
    session({ session, user }) {
      session.user.role = isAdminEmail(user.email)
        ? "admin"
        : (user.role ?? DEFAULT_ROLE);
      return session;
    },
  },
});
