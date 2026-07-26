import "server-only";
import { ObjectId, type Collection, type Db } from "mongodb";
import clientPromise from "@/lib/mongodb";
import {
  DEFAULT_STATUS,
  isAdminEmail,
  normalizeRole,
  type UserRole,
  type UserStatus,
} from "@/lib/roles";

/**
 * Admin view over the Auth.js collections (`users`, `accounts`, `sessions`)
 * managed by the MongoDB adapter. Everyone who has ever signed in has a
 * `users` document; each linked login method (Google today, more later) is an
 * `accounts` document pointing back at it, so provider lists come from a join
 * rather than a hardcoded set.
 */
interface UserDoc {
  _id: ObjectId;
  name?: string;
  email?: string;
  image?: string;
  /** May hold legacy values (e.g. "user") — normalize before use. */
  role?: string;
  status?: UserStatus;
}

/** One row of the admin user-management table (serializable). */
export interface AdminUserView {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  /** Effective role — the `ADMIN_EMAILS` allowlist wins over the stored role. */
  role: UserRole;
  status: UserStatus;
  /** Login methods linked to this user (Auth.js provider ids). */
  providers: string[];
  /** From the ObjectId timestamp — the adapter stores no createdAt. */
  createdAt: string;
  /** Allowlisted via `ADMIN_EMAILS`: role/status can't be changed in the UI. */
  isEnvAdmin: boolean;
}

async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db();
}

async function usersCollection(): Promise<Collection<UserDoc>> {
  return (await getDb()).collection<UserDoc>("users");
}

function toView(doc: UserDoc & { providers?: string[] }): AdminUserView {
  const isEnvAdmin = isAdminEmail(doc.email);
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    image: doc.image,
    role: isEnvAdmin ? "admin" : normalizeRole(doc.role),
    status: doc.status ?? DEFAULT_STATUS,
    providers: doc.providers ?? [],
    createdAt: doc._id.getTimestamp().toISOString(),
    isEnvAdmin,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Paginated, searchable list of everyone who has signed in, newest first,
 * with each user's linked providers joined in from `accounts`.
 */
export async function listAdminUsers(options: {
  page?: number;
  limit?: number;
  q?: string;
}): Promise<{ items: AdminUserView[]; total: number }> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 50));

  const filter = options.q
    ? {
        $or: [
          { name: { $regex: escapeRegex(options.q), $options: "i" } },
          { email: { $regex: escapeRegex(options.q), $options: "i" } },
        ],
      }
    : {};

  const users = await usersCollection();
  const [docs, total] = await Promise.all([
    users
      .aggregate<UserDoc & { providers: string[] }>([
        { $match: filter },
        { $sort: { _id: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $lookup: {
            from: "accounts",
            localField: "_id",
            foreignField: "userId",
            as: "accounts",
          },
        },
        {
          $addFields: {
            providers: {
              $setUnion: [
                {
                  $map: {
                    input: "$accounts",
                    as: "account",
                    in: "$$account.provider",
                  },
                },
                [],
              ],
            },
          },
        },
        { $project: { accounts: 0 } },
      ])
      .toArray(),
    users.countDocuments(filter),
  ]);

  return { items: docs.map(toView), total };
}

/** Fetch one user for pre-mutation checks; `null` on bad id / unknown user. */
export async function getAdminUser(id: string): Promise<AdminUserView | null> {
  if (!ObjectId.isValid(id)) return null;
  const users = await usersCollection();
  const doc = await users.findOne({ _id: new ObjectId(id) });
  return doc ? toView(doc) : null;
}

/** Store a user's role. Returns false when the user doesn't exist. */
export async function setUserRole(
  id: string,
  role: UserRole,
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const users = await usersCollection();
  const result = await users.updateOne(
    { _id: new ObjectId(id) },
    { $set: { role } },
  );
  return result.matchedCount > 0;
}

/**
 * Enable or disable a user. Disabling also revokes their database sessions,
 * so they are signed out immediately — the `signIn` callback then keeps them
 * out until re-enabled.
 */
export async function setUserStatus(
  id: string,
  status: UserStatus,
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const userId = new ObjectId(id);

  const db = await getDb();
  const result = await db
    .collection<UserDoc>("users")
    .updateOne({ _id: userId }, { $set: { status } });
  if (result.matchedCount === 0) return false;

  if (status === "disabled") {
    await db.collection("sessions").deleteMany({ userId });
  }
  return true;
}
