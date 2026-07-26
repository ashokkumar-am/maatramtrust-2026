import connectMongoDB from "@/lib/mongoose";
import StudentPayment from "@/models/StudentPaymentModel";
import type { AuditUser } from "@/lib/audit";

export interface SponsorshipInput {
  studentId: string;
  studentName?: string;
  year: number;
  /** Signed-in account (Auth.js user id) the sponsorship belongs to. */
  userId?: string;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  amount: number; // major currency units (e.g. rupees)
  currency?: string;
  note?: string;
}

export interface SponsorshipRecord {
  _id: unknown;
  studentId: unknown;
  studentName?: string;
  year: number;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  amount: number;
  receivedAmt: number;
  currency: string;
  status: "pending" | "received" | "failed";
  orderId?: string;
  payId?: string;
}

const DEFAULT_CURRENCY = "INR";

/**
 * Record a manually-entered sponsorship (admin). Marked `received` immediately.
 */
export async function recordManualSponsorship(
  input: SponsorshipInput,
  actor: AuditUser,
): Promise<SponsorshipRecord> {
  await connectMongoDB();
  const created = await StudentPayment.create({
    ...input,
    currency: input.currency ?? DEFAULT_CURRENCY,
    receivedAmt: input.amount,
    status: "received",
    createdBy: actor,
    updatedBy: actor,
  });
  return created.toObject() as SponsorshipRecord;
}

/**
 * Record the intent to sponsor when a Razorpay order is created. Stays
 * `pending` (receivedAmt 0) until the webhook confirms capture.
 */
export async function recordSponsorshipIntent(
  input: SponsorshipInput & { orderId: string },
  actor?: AuditUser,
): Promise<SponsorshipRecord> {
  await connectMongoDB();
  const created = await StudentPayment.create({
    ...input,
    currency: input.currency ?? DEFAULT_CURRENCY,
    receivedAmt: 0,
    status: "pending",
    createdBy: actor,
    updatedBy: actor,
  });
  return created.toObject() as SponsorshipRecord;
}

/**
 * Flip a pending sponsorship to `received` when its Razorpay order is captured.
 * `amountPaise` is the captured amount in the smallest unit; stored in major
 * units. Idempotent: only matches rows not already received. Returns the
 * updated record, or `null` when the order isn't a sponsorship.
 */
export async function markSponsorshipReceivedByOrder(input: {
  orderId: string;
  paymentId: string;
  amountPaise?: number;
  currency?: string;
}): Promise<SponsorshipRecord | null> {
  await connectMongoDB();
  const set: Record<string, unknown> = {
    status: "received",
    payId: input.paymentId,
    // Use the captured amount when known (webhook); otherwise mark the pledged
    // amount received (client-confirmation fallback). `$amount` is a field ref
    // resolved by the aggregation-pipeline update.
    receivedAmt:
      input.amountPaise != null ? input.amountPaise / 100 : "$amount",
  };
  if (input.currency) set.currency = input.currency;

  return StudentPayment.findOneAndUpdate(
    { orderId: input.orderId, status: { $ne: "received" } },
    [{ $set: set }],
    // Mongoose 9 requires opting in to aggregation-pipeline updates.
    { new: true, updatePipeline: true },
  ).lean<SponsorshipRecord>();
}

/** Whether an order corresponds to a sponsorship (vs a plain donation). */
export async function sponsorshipExistsForOrder(
  orderId: string,
): Promise<boolean> {
  await connectMongoDB();
  return (await StudentPayment.exists({ orderId })) != null;
}

export interface YearSponsorships {
  year: number;
  count: number;
  pledged: number;
  received: number;
  sponsorships: SponsorshipRecord[];
}

/**
 * All sponsorships for a student, grouped by year (newest year first) with
 * per-year pledged/received totals.
 */
export async function getStudentSponsorshipsByYear(
  studentId: string,
): Promise<YearSponsorships[]> {
  await connectMongoDB();
  const rows = await StudentPayment.find({ studentId })
    .sort({ year: -1, createdAt: -1 })
    .lean<SponsorshipRecord[]>()
    .exec();

  const byYear = new Map<number, YearSponsorships>();
  for (const row of rows) {
    const bucket = byYear.get(row.year) ?? {
      year: row.year,
      count: 0,
      pledged: 0,
      received: 0,
      sponsorships: [],
    };
    bucket.count += 1;
    bucket.pledged += row.amount ?? 0;
    bucket.received += row.receivedAmt ?? 0;
    bucket.sponsorships.push(row);
    byYear.set(row.year, bucket);
  }

  return [...byYear.values()].sort((a, b) => b.year - a.year);
}
