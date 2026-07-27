import mongoose from "mongoose";
import connectMongoDB from "@/lib/mongoose";
import AnnadhanaBooking from "@/models/AnnadhanaBookingModel";
import AnnadhanaCampaign from "@/models/AnnadhanaCampaignModel";
import AnnadhanaUpdate from "@/models/AnnadhanaUpdateModel";
import type {
  ANNADHANA_BOOKING_STATUSES,
  ANNADHANA_OCCASIONS,
} from "@/models/AnnadhanaBookingModel";
import type { AuditUser } from "@/lib/audit";
import { ownerFilter, type GivingOwner } from "@/lib/giving";
import type { Doc, ListResult } from "@/lib/repository";

const DEFAULT_CURRENCY = "INR";
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export type AnnadhanaOccasion = (typeof ANNADHANA_OCCASIONS)[number];
export type AnnadhanaBookingStatus =
  (typeof ANNADHANA_BOOKING_STATUSES)[number];

export interface AnnadhanaBookingInput {
  campaignId?: string;
  campaignTitle?: string;
  occasion: AnnadhanaOccasion;
  occasionDetail?: string;
  honoreeName?: string;
  eventDate: Date;
  /** Signed-in account (Auth.js user id) the booking belongs to. */
  userId?: string;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  amount: number; // major currency units (e.g. rupees)
  currency?: string;
  note?: string;
}

export interface AnnadhanaBookingRecord {
  _id: unknown;
  campaignId?: unknown;
  campaignTitle?: string;
  occasion: AnnadhanaOccasion;
  occasionDetail?: string;
  honoreeName?: string;
  eventDate: Date;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  amount: number;
  receivedAmt: number;
  currency: string;
  status: AnnadhanaBookingStatus;
  source: "online" | "manual";
  orderId?: string;
  payId?: string;
  note?: string;
}

/** A donor's own Annadhana Sevai booking, for the "My Giving" page. */
export interface MyAnnadhanaBooking {
  id: string;
  occasion: AnnadhanaOccasion;
  occasionDetail?: string;
  honoreeName?: string;
  campaignTitle?: string;
  eventDate: string; // ISO date
  amount: number;
  receivedAmt: number;
  currency: string;
  status: AnnadhanaBookingStatus;
}

/**
 * The signed-in user's Annadhana Sevai bookings (purpose + amount), newest
 * event first, capped at 100. Matches by linked account id or donor email.
 */
export async function getMyAnnadhanaBookings(
  owner: GivingOwner,
): Promise<MyAnnadhanaBooking[]> {
  await connectMongoDB();
  const rows = await AnnadhanaBooking.find(ownerFilter(owner, "donorEmail"))
    .sort({ eventDate: -1 })
    .limit(100)
    .lean<AnnadhanaBookingRecord[]>()
    .exec();

  return rows.map((row) => ({
    id: String(row._id),
    occasion: row.occasion,
    occasionDetail: row.occasionDetail,
    honoreeName: row.honoreeName,
    campaignTitle: row.campaignTitle,
    eventDate: new Date(row.eventDate).toISOString(),
    amount: row.amount ?? 0,
    receivedAmt: row.receivedAmt ?? 0,
    currency: row.currency ?? DEFAULT_CURRENCY,
    status: row.status,
  }));
}

/**
 * Record an admin-entered (offline) booking. Marked `received` immediately.
 */
export async function recordManualAnnadhanaBooking(
  input: AnnadhanaBookingInput,
  actor: AuditUser,
): Promise<AnnadhanaBookingRecord> {
  await connectMongoDB();
  const created = await AnnadhanaBooking.create({
    ...input,
    currency: input.currency ?? DEFAULT_CURRENCY,
    receivedAmt: input.amount,
    status: "received",
    source: "manual",
    createdBy: actor,
    updatedBy: actor,
  });
  return created.toObject() as AnnadhanaBookingRecord;
}

/**
 * Record the intent to book when a Razorpay order is created (public
 * self-booking). Stays `pending` (receivedAmt 0) until capture is confirmed.
 */
export async function recordAnnadhanaBookingIntent(
  input: AnnadhanaBookingInput & { orderId: string },
  actor?: AuditUser,
): Promise<AnnadhanaBookingRecord> {
  await connectMongoDB();
  const created = await AnnadhanaBooking.create({
    ...input,
    currency: input.currency ?? DEFAULT_CURRENCY,
    receivedAmt: 0,
    status: "pending",
    source: "online",
    createdBy: actor,
    updatedBy: actor,
  });
  return created.toObject() as AnnadhanaBookingRecord;
}

/**
 * Flip a pending booking to `received` when its Razorpay order is captured.
 * `amountPaise` is the captured amount in the smallest unit; stored in major
 * units. Idempotent: only matches rows not already received. Returns the
 * updated record, or `null` when the order isn't an annadhana booking.
 */
export async function markAnnadhanaBookingReceivedByOrder(input: {
  orderId: string;
  paymentId: string;
  amountPaise?: number;
  currency?: string;
}): Promise<AnnadhanaBookingRecord | null> {
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

  return AnnadhanaBooking.findOneAndUpdate(
    { orderId: input.orderId, status: { $ne: "received" } },
    [{ $set: set }],
    // Mongoose 9 requires opting in to aggregation-pipeline updates.
    { new: true, updatePipeline: true },
  ).lean<AnnadhanaBookingRecord>();
}

/**
 * Mark a pending booking `failed` when its payment fails. Returns the updated
 * record, or `null` when the order isn't a (still-pending) annadhana booking.
 */
export async function markAnnadhanaBookingFailedByOrder(input: {
  orderId: string;
  paymentId: string;
}): Promise<AnnadhanaBookingRecord | null> {
  await connectMongoDB();
  return AnnadhanaBooking.findOneAndUpdate(
    { orderId: input.orderId, status: "pending" },
    { $set: { status: "failed", payId: input.paymentId } },
    { new: true },
  ).lean<AnnadhanaBookingRecord>();
}

/** Whether an order corresponds to an annadhana booking. */
export async function annadhanaBookingExistsForOrder(
  orderId: string,
): Promise<boolean> {
  await connectMongoDB();
  return (await AnnadhanaBooking.exists({ orderId })) != null;
}

function toInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** Escape regex metacharacters so a search term is matched literally. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SEARCH_FIELDS = ["donorName", "donorEmail", "honoreeName"];

/** Translate the supported query params into a Mongo filter. */
function buildBookingFilter(searchParams: URLSearchParams): Doc {
  const filter: Doc = {};

  const q = searchParams.get("q")?.trim();
  if (q) {
    filter.$or = SEARCH_FIELDS.map((field) => ({
      [field]: { $regex: escapeRegex(q), $options: "i" },
    }));
  }

  const occasion = searchParams.get("occasion")?.trim();
  if (occasion) filter.occasion = occasion;

  const status = searchParams.get("status")?.trim();
  if (status) filter.status = status;

  const campaignId = searchParams.get("campaign")?.trim();
  if (campaignId && mongoose.isValidObjectId(campaignId)) {
    filter.campaignId = campaignId;
  }

  // `when=past|upcoming` splits on the event date; `from`/`to` bound it.
  const eventDate: Record<string, Date> = {};
  const when = searchParams.get("when")?.trim();
  const now = new Date();
  if (when === "past") eventDate.$lt = now;
  if (when === "upcoming") eventDate.$gte = now;

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (from && !Number.isNaN(Date.parse(from))) {
    eventDate.$gte = new Date(from);
  }
  if (to && !Number.isNaN(Date.parse(to))) eventDate.$lte = new Date(to);
  if (Object.keys(eventDate).length > 0) filter.eventDate = eventDate;

  return filter;
}

/**
 * Paginated admin booking history. Supports `?q=` (donor/honoree search),
 * `?occasion=`, `?status=`, `?campaign=<id>`, `?when=past|upcoming`,
 * `?from=`/`?to=` (event-date bounds) and `?page`/`?limit`. Sorted by event
 * date (newest first) so past bookings read as a chronological ledger.
 */
export async function listAnnadhanaBookings(
  searchParams: URLSearchParams,
): Promise<ListResult> {
  await connectMongoDB();
  const limit = Math.min(
    toInt(searchParams.get("limit"), DEFAULT_LIMIT),
    MAX_LIMIT,
  );
  const page = toInt(searchParams.get("page"), 1);
  const filter = buildBookingFilter(searchParams);

  const [items, total] = await Promise.all([
    AnnadhanaBooking.find(filter)
      .sort({ eventDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<Doc[]>()
      .exec(),
    AnnadhanaBooking.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

/** How many bookings reference a campaign (delete guard). */
export async function countBookingsForCampaign(
  campaignId: string,
): Promise<number> {
  await connectMongoDB();
  return AnnadhanaBooking.countDocuments({ campaignId });
}

/** How many daily updates reference a campaign (delete guard). */
export async function countUpdatesForCampaign(
  campaignId: string,
): Promise<number> {
  await connectMongoDB();
  return AnnadhanaUpdate.countDocuments({ campaignId });
}

export interface PublicAnnadhanaCampaign {
  id: string;
  title: string;
  slug: string;
  description?: string;
  image?: string;
  minAmount: number;
  targetAmount?: number;
  raisedAmount: number;
  startDate?: string;
  endDate?: string;
}

interface CampaignDoc {
  _id: unknown;
  title: string;
  slug: string;
  description?: string;
  image?: string;
  minAmount?: number;
  targetAmount?: number;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Active campaigns for the public booking page (ordered), each with the total
 * received so far so progress can be shown against `targetAmount`.
 */
export async function getActiveAnnadhanaCampaigns(): Promise<
  PublicAnnadhanaCampaign[]
> {
  await connectMongoDB();
  const campaigns = await AnnadhanaCampaign.find({ isActive: true })
    .sort({ order: 1, createdAt: -1 })
    .lean<CampaignDoc[]>()
    .exec();
  if (campaigns.length === 0) return [];

  const raised = await AnnadhanaBooking.aggregate<{
    _id: unknown;
    total: number;
  }>([
    {
      $match: {
        campaignId: { $in: campaigns.map((c) => c._id) },
        status: "received",
      },
    },
    { $group: { _id: "$campaignId", total: { $sum: "$receivedAmt" } } },
  ]);
  const raisedByCampaign = new Map(
    raised.map((row) => [String(row._id), row.total]),
  );

  return campaigns.map((campaign) => ({
    id: String(campaign._id),
    title: campaign.title,
    slug: campaign.slug,
    description: campaign.description,
    image: campaign.image,
    minAmount: campaign.minAmount ?? 0,
    targetAmount: campaign.targetAmount,
    raisedAmount: raisedByCampaign.get(String(campaign._id)) ?? 0,
    startDate: campaign.startDate?.toISOString(),
    endDate: campaign.endDate?.toISOString(),
  }));
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** UTC day key (`yyyy-mm-dd`) for grouping bookings against update dates. */
const dayKey = (date: Date) => new Date(date).toISOString().slice(0, 10);

export interface UpdateMediaItem {
  url: string;
  publicId?: string;
  mediaType: "image" | "video";
}

export interface DailySponsor {
  donorName?: string;
  occasion: AnnadhanaOccasion;
  occasionDetail?: string;
  honoreeName?: string;
}

export interface PublicDailyUpdate {
  id: string;
  date: string; // ISO
  title?: string;
  description?: string;
  media: UpdateMediaItem[];
  sponsors: DailySponsor[];
}

export interface CampaignFeed {
  campaign: PublicAnnadhanaCampaign;
  items: PublicDailyUpdate[];
  total: number;
  page: number;
  limit: number;
}

interface UpdateDoc {
  _id: unknown;
  date: Date;
  title?: string;
  description?: string;
  media?: UpdateMediaItem[];
}

interface SponsorBookingDoc {
  eventDate: Date;
  donorName?: string;
  occasion: AnnadhanaOccasion;
  occasionDetail?: string;
  honoreeName?: string;
}

/**
 * The sponsors to credit for each update day: received bookings whose event
 * date falls on that day and that are either tagged to this campaign or
 * untagged (a general annadhana booking still sponsors that day's breakfast).
 * Returned as a map of `yyyy-mm-dd` → sponsors.
 */
async function sponsorsByDay(
  campaignId: unknown,
  dates: Date[],
): Promise<Map<string, DailySponsor[]>> {
  const byDay = new Map<string, DailySponsor[]>();
  if (dates.length === 0) return byDay;

  const times = dates.map((d) => new Date(d).getTime());
  const bookings = await AnnadhanaBooking.find({
    status: "received",
    eventDate: {
      $gte: new Date(Math.min(...times)),
      $lt: new Date(Math.max(...times) + DAY_MS),
    },
    $or: [{ campaignId }, { campaignId: null }],
  })
    .select("eventDate donorName occasion occasionDetail honoreeName")
    .sort({ createdAt: 1 })
    .lean<SponsorBookingDoc[]>()
    .exec();

  for (const booking of bookings) {
    const key = dayKey(booking.eventDate);
    const list = byDay.get(key) ?? [];
    list.push({
      donorName: booking.donorName,
      occasion: booking.occasion,
      occasionDetail: booking.occasionDetail,
      honoreeName: booking.honoreeName,
    });
    byDay.set(key, list);
  }
  return byDay;
}

/**
 * Public day-wise feed for a campaign: its active updates (newest day first,
 * paginated) with each day's media and sponsors. `null` when the slug doesn't
 * match an active campaign.
 */
export async function getCampaignFeedBySlug(
  slug: string,
  options: { page?: number; limit?: number } = {},
): Promise<CampaignFeed | null> {
  await connectMongoDB();
  const campaignDoc = await AnnadhanaCampaign.findOne({ slug, isActive: true })
    .lean<CampaignDoc>()
    .exec();
  if (!campaignDoc) return null;

  const limit = Math.min(Math.max(options.limit ?? 10, 1), 50);
  const page = Math.max(options.page ?? 1, 1);

  const filter = { campaignId: campaignDoc._id, isActive: true };
  const [updates, total, raised] = await Promise.all([
    AnnadhanaUpdate.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("date title description media")
      .lean<UpdateDoc[]>()
      .exec(),
    AnnadhanaUpdate.countDocuments(filter),
    AnnadhanaBooking.aggregate<{ total: number }>([
      { $match: { campaignId: campaignDoc._id, status: "received" } },
      { $group: { _id: null, total: { $sum: "$receivedAmt" } } },
    ]),
  ]);

  const sponsors = await sponsorsByDay(
    campaignDoc._id,
    updates.map((u) => u.date),
  );

  return {
    campaign: {
      id: String(campaignDoc._id),
      title: campaignDoc.title,
      slug: campaignDoc.slug,
      description: campaignDoc.description,
      image: campaignDoc.image,
      minAmount: campaignDoc.minAmount ?? 0,
      targetAmount: campaignDoc.targetAmount,
      raisedAmount: raised[0]?.total ?? 0,
      startDate: campaignDoc.startDate?.toISOString(),
      endDate: campaignDoc.endDate?.toISOString(),
    },
    items: updates.map((update) => ({
      id: String(update._id),
      date: new Date(update.date).toISOString(),
      title: update.title,
      description: update.description,
      media: (update.media ?? []).map((m) => ({
        url: m.url,
        publicId: m.publicId,
        mediaType: m.mediaType ?? "image",
      })),
      sponsors: sponsors.get(dayKey(update.date)) ?? [],
    })),
    total,
    page,
    limit,
  };
}

/**
 * Paginated admin listing of daily updates, newest day first. Supports
 * `?campaign=<id>` and `?page`/`?limit`.
 */
export async function listAnnadhanaUpdates(
  searchParams: URLSearchParams,
): Promise<ListResult> {
  await connectMongoDB();
  const limit = Math.min(
    toInt(searchParams.get("limit"), DEFAULT_LIMIT),
    MAX_LIMIT,
  );
  const page = toInt(searchParams.get("page"), 1);

  const filter: Doc = {};
  const campaignId = searchParams.get("campaign")?.trim();
  if (campaignId && mongoose.isValidObjectId(campaignId)) {
    filter.campaignId = campaignId;
  }

  const [items, total] = await Promise.all([
    AnnadhanaUpdate.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<Doc[]>()
      .exec(),
    AnnadhanaUpdate.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

/**
 * Resolve a campaign's title by id regardless of its active state / window —
 * used for admin-entered bookings (which may backfill a finished campaign).
 * `null` for unknown/invalid ids (never throws).
 */
export async function resolveCampaignTitle(
  campaignId: string | undefined,
): Promise<string | null> {
  if (!campaignId || !mongoose.isValidObjectId(campaignId)) return null;

  await connectMongoDB();
  const campaign = await AnnadhanaCampaign.findById(campaignId)
    .select("title")
    .lean<{ title: string }>()
    .exec();
  return campaign?.title ?? null;
}

export interface BookableCampaign {
  _id: unknown;
  title: string;
  minAmount?: number;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Resolve a campaign that can accept a booking right now — active and inside
 * its date window (when one is set). Returns `null` for unknown/invalid ids
 * or campaigns that aren't currently bookable (never throws).
 */
export async function resolveBookableCampaign(
  campaignId: string | undefined,
): Promise<BookableCampaign | null> {
  if (!campaignId || !mongoose.isValidObjectId(campaignId)) return null;

  await connectMongoDB();
  const campaign = await AnnadhanaCampaign.findOne({
    _id: campaignId,
    isActive: true,
  })
    .select("title minAmount startDate endDate")
    .lean<BookableCampaign>()
    .exec();
  if (!campaign) return null;

  const now = new Date();
  if (campaign.startDate && campaign.startDate > now) return null;
  if (campaign.endDate && campaign.endDate < now) return null;
  return campaign;
}
