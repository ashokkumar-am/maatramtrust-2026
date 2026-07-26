import "server-only";
import type { Collection } from "mongodb";
import { nanoid } from "nanoid";
import clientPromise from "@/lib/mongodb";
import type { AuditUser } from "@/lib/audit";

export type DonationStatus = "created" | "captured" | "failed" | "refunded";

/** Where a donation came from: online (Razorpay) or an admin cash/offline entry. */
export type DonationSource = "web" | "cash";

/**
 * A donation is keyed by the Razorpay order id (`_id`). That makes every write
 * naturally idempotent — a retried webhook (or a client confirmation racing the
 * webhook) upserts the same document instead of inserting a duplicate.
 */
export interface DonationDoc {
  _id: string; // razorpay order id
  orderId: string;
  paymentId?: string;
  amount: number; // smallest currency unit (paise)
  currency: string;
  status: DonationStatus;
  userId?: string;
  email?: string;
  /** Donor's display name (may differ from their login name). */
  donorName?: string;
  /** When true, the donor is hidden by name on the public wall. */
  anonymous?: boolean;
  /** Optional donation category (denormalized name for display). */
  categoryId?: string;
  categoryName?: string;
  /** Human-readable receipt number, generated once on capture. */
  receiptNumber?: string;
  /** "web" (Razorpay) or "cash" (admin offline entry). Legacy docs are "web". */
  source?: DonationSource;
  /** Payment method for cash/offline entries (e.g. cash, cheque, bank). */
  method?: string;
  /** Free-text reference/note for offline entries. */
  note?: string;
  /** Admin who recorded a manual (cash) donation. */
  recordedBy?: AuditUser;
  /** Void/refund audit: when it was voided, why, and by whom. */
  voidedAt?: Date;
  voidReason?: string;
  voidedBy?: AuditUser;
  createdAt: Date;
  updatedAt: Date;
  capturedAt?: Date;
}

/** Serializable donation for the admin dashboard list (all statuses/sources). */
export interface AdminDonation {
  id: string;
  amount: number; // major currency units (rupees)
  currency: string;
  status: DonationStatus;
  source: DonationSource;
  donorName?: string;
  email?: string;
  category?: string;
  method?: string;
  at: Date;
}

/** Public, serializable donation for the homepage donor wall (masked). */
export interface PublicDonation {
  id: string;
  name: string; // masked donor name, or "Anonymous"
  category?: string;
  amount: number; // major currency units (e.g. rupees)
  currency: string;
  at: Date; // captured timestamp
}

async function donations(): Promise<Collection<DonationDoc>> {
  const client = await clientPromise;
  // Defaults to the database in MONGODB_URI when MONGODB_DB is unset.
  return client.db(process.env.MONGODB_DB).collection<DonationDoc>("donations");
}

/** MongoDB duplicate-key errors surface as code 11000 (violated unique index). */
function isDuplicateKeyError(error: unknown): boolean {
  return (error as { code?: number } | null)?.code === 11000;
}

/**
 * Deterministic receipt number derived from the payment id, so replays (webhook
 * + client confirmation) always produce the same number for a given payment.
 */
function receiptNumberFor(paymentId: string, when: Date): string {
  const suffix = paymentId.replace(/^pay_/, "").toUpperCase().slice(-8);
  return `MTM-${when.getFullYear()}-${suffix}`;
}

/** Record the intent to donate when the order is created (status: "created"). */
export async function recordDonationOrder(input: {
  orderId: string;
  amount: number;
  currency: string;
  userId?: string;
  email?: string;
  donorName?: string;
  anonymous?: boolean;
  categoryId?: string;
  categoryName?: string;
}): Promise<void> {
  const col = await donations();
  const now = new Date();
  await col.updateOne(
    { _id: input.orderId },
    {
      $setOnInsert: {
        orderId: input.orderId,
        amount: input.amount,
        currency: input.currency,
        status: "created",
        userId: input.userId,
        email: input.email,
        donorName: input.donorName,
        anonymous: input.anonymous ?? false,
        categoryId: input.categoryId,
        categoryName: input.categoryName,
        createdAt: now,
      },
      $set: { updatedAt: now },
    },
    { upsert: true },
  );
}

/**
 * Mark a donation captured, exactly once. Only transitions a not-yet-captured
 * document; returns the captured doc when this call performed the transition,
 * or `null` when the donation was already captured (so the caller emails /
 * generates the receipt only once, whichever of webhook/confirmation wins).
 */
export async function markDonationCaptured(input: {
  orderId: string;
  paymentId: string;
  amount?: number;
  currency?: string;
}): Promise<DonationDoc | null> {
  const col = await donations();
  const now = new Date();

  const set: Partial<DonationDoc> = {
    orderId: input.orderId,
    paymentId: input.paymentId,
    status: "captured",
    capturedAt: now,
    updatedAt: now,
    receiptNumber: receiptNumberFor(input.paymentId, now),
  };
  if (input.amount != null) set.amount = input.amount;
  if (input.currency) set.currency = input.currency;

  try {
    return await col.findOneAndUpdate(
      { _id: input.orderId, status: { $ne: "captured" } },
      { $set: set, $setOnInsert: { createdAt: now, anonymous: false } },
      { upsert: true, returnDocument: "after" },
    );
  } catch (error) {
    // Duplicate key => the document is already captured (filter excluded it and
    // the upsert collided on _id). That's the idempotent no-op path.
    if (isDuplicateKeyError(error)) return null;
    throw error;
  }
}

/**
 * Mark a donation failed, but never overwrite a captured one (a late "failed"
 * must not clobber a successful payment).
 */
export async function markDonationFailed(input: {
  orderId: string;
  paymentId?: string;
}): Promise<void> {
  const col = await donations();
  const now = new Date();
  try {
    await col.updateOne(
      { _id: input.orderId, status: { $ne: "captured" } },
      {
        $set: {
          orderId: input.orderId,
          paymentId: input.paymentId,
          status: "failed",
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
  } catch (error) {
    // Duplicate key => a captured doc already exists for this order. Ignore.
    if (isDuplicateKeyError(error)) return;
    throw error;
  }
}

/**
 * Mask a donor's name for public display: first name partly starred, last-name
 * initial only (e.g. "Ashok Kumar" -> "A**** K."). Anonymous or empty names
 * collapse to "Anonymous".
 */
function maskDonorName(name?: string, anonymous?: boolean): string {
  const trimmed = name?.trim();
  if (anonymous || !trimmed) return "Anonymous";

  const parts = trimmed.split(/\s+/);
  const [first] = parts;
  const maskedFirst = first[0] + "*".repeat(Math.max(1, first.length - 1));
  if (parts.length === 1) return maskedFirst;

  const last = parts[parts.length - 1];
  return `${maskedFirst} ${last[0]}.`;
}

/**
 * Recent captured donations for the public homepage wall. Names are masked and
 * amounts returned in major units; no email or payment references are exposed.
 */
export async function getPublicDonations(
  limit = 20,
): Promise<PublicDonation[]> {
  const col = await donations();
  const safeLimit = Math.min(Math.max(1, limit), 50);

  const docs = await col
    .find({ status: "captured" })
    .sort({ capturedAt: -1 })
    .limit(safeLimit)
    .toArray();

  return docs.map((doc) => ({
    id: doc._id,
    name: maskDonorName(doc.donorName, doc.anonymous),
    category: doc.categoryName,
    amount: doc.amount / 100,
    currency: doc.currency,
    at: doc.capturedAt ?? doc.updatedAt,
  }));
}

/**
 * Record an admin-entered cash/offline donation. Captured immediately (the
 * money is already received), so it counts toward the dashboard totals and
 * appears on the public wall alongside online donations. `amount` is in major
 * units (rupees) and stored as paise for consistency with web donations.
 */
export async function recordManualDonation(input: {
  amount: number;
  currency?: string;
  donorName?: string;
  email?: string;
  anonymous?: boolean;
  categoryId?: string;
  categoryName?: string;
  method?: string;
  note?: string;
  /** Date the money was actually received (backdate). Defaults to now. */
  receivedAt?: Date;
  actor?: AuditUser;
}): Promise<DonationDoc> {
  const col = await donations();
  const now = new Date();
  // `receivedAt` backdates the ledger/wall position; `updatedAt` is entry time.
  const at = input.receivedAt ?? now;
  const id = `cash_${nanoid()}`;
  const reference = input.note?.trim() || `Cash (${input.method ?? "cash"})`;

  const doc: DonationDoc = {
    _id: id,
    orderId: id,
    paymentId: reference,
    amount: Math.round(input.amount * 100),
    currency: input.currency ?? "INR",
    status: "captured",
    source: "cash",
    method: input.method,
    note: input.note,
    email: input.email,
    donorName: input.donorName,
    anonymous: input.anonymous ?? false,
    categoryId: input.categoryId,
    categoryName: input.categoryName,
    receiptNumber: receiptNumberFor(id, at),
    recordedBy: input.actor,
    createdAt: at,
    updatedAt: now,
    capturedAt: at,
  };

  await col.insertOne(doc);
  return doc;
}

/**
 * Void/refund a captured donation: soft status change to "refunded" (the record
 * is kept for audit). Only a currently-captured donation can be voided, so it
 * immediately drops out of the dashboard totals and the public wall. Returns
 * the updated doc, or `null` when the id isn't a captured donation.
 */
export async function voidDonation(input: {
  id: string;
  reason?: string;
  actor?: AuditUser;
}): Promise<DonationDoc | null> {
  const col = await donations();
  const now = new Date();
  return col.findOneAndUpdate(
    { _id: input.id, status: "captured" },
    {
      $set: {
        status: "refunded",
        voidedAt: now,
        updatedAt: now,
        voidReason: input.reason,
        voidedBy: input.actor,
      },
    },
    { returnDocument: "after" },
  );
}

/** Recent donations (all sources/statuses) for the admin dashboard list. */
export async function getAdminDonations(
  opts: { page?: number; limit?: number; q?: string } = {},
): Promise<AdminDonation[]> {
  const col = await donations();
  const limit = Math.min(Math.max(1, opts.limit ?? 50), 200);
  const page = Math.max(1, opts.page ?? 1);

  const q = opts.q?.trim();
  const filter = q
    ? (() => {
        const rx = {
          $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          $options: "i",
        };
        return {
          $or: [
            { donorName: rx },
            { email: rx },
            { categoryName: rx },
            { note: rx },
          ],
        };
      })()
    : {};

  const docs = await col
    .find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  return docs.map((doc) => ({
    id: doc._id,
    amount: doc.amount / 100,
    currency: doc.currency,
    status: doc.status,
    source: doc.source ?? "web",
    donorName: doc.donorName,
    email: doc.email,
    category: doc.categoryName,
    method: doc.method,
    at: doc.capturedAt ?? doc.createdAt,
  }));
}

/**
 * The signed-in account a giving record belongs to. Matched by `userId` when
 * the record was made while signed in, or by the account's email for records
 * keyed only by address (e.g. admin cash entries for a known donor).
 */
export interface GivingOwner {
  userId: string;
  email?: string | null;
}

function ownerFilter(
  owner: GivingOwner,
  emailField: "email" | "donorEmail",
): Record<string, unknown> {
  const or: Record<string, unknown>[] = [{ userId: owner.userId }];
  if (owner.email) or.push({ [emailField]: owner.email });
  return { $or: or };
}

export { ownerFilter };

/** A donor's own donation, serializable for the "My Giving" page. */
export interface MyDonation {
  id: string;
  amount: number; // major currency units (rupees)
  currency: string;
  status: DonationStatus;
  category?: string;
  receiptNumber?: string;
  at: string; // ISO date
  /** Captured with a receipt — the donor can download the PDF. */
  receiptAvailable: boolean;
}

/** The signed-in user's donations, newest first (capped at 100). */
export async function getMyDonations(
  owner: GivingOwner,
): Promise<MyDonation[]> {
  const col = await donations();
  const docs = await col
    .find(ownerFilter(owner, "email"))
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  return docs.map((doc) => ({
    id: doc._id,
    amount: doc.amount / 100,
    currency: doc.currency,
    status: doc.status,
    category: doc.categoryName,
    receiptNumber: doc.receiptNumber,
    at: (doc.capturedAt ?? doc.createdAt).toISOString(),
    receiptAvailable:
      doc.status === "captured" &&
      Boolean(doc.paymentId) &&
      Boolean(doc.receiptNumber),
  }));
}

/**
 * One donation, only if it belongs to `owner` — for self-service receipt
 * download. Returns `null` for unknown ids and other users' donations alike.
 */
export async function getOwnedDonation(
  id: string,
  owner: GivingOwner,
): Promise<DonationDoc | null> {
  const col = await donations();
  return col.findOne({ _id: id, ...ownerFilter(owner, "email") });
}
