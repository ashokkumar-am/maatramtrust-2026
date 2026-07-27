import "server-only";
import type { PipelineStage } from "mongoose";
import connectMongoDB from "@/lib/mongoose";
import clientPromise from "@/lib/mongodb";
import Contact from "@/models/ContactModel";
import Newsletter from "@/models/NewsletterModel";
import StudentPayment from "@/models/StudentPaymentModel";
import AnnadhanaBooking from "@/models/AnnadhanaBookingModel";

const MONTHS_BACK = 12;

/** One month on the raised-per-month chart (all amounts in rupees). */
export interface MonthlyRaisedPoint {
  /** Short label for the axis, e.g. "Aug 25". */
  month: string;
  donations: number;
  sponsorships: number;
  annadhana: number;
}

/** One year on the sponsorships chart (amounts in rupees). */
export interface YearlySponsorshipPoint {
  year: string;
  pledged: number;
  received: number;
}

/** One month on the community-growth chart (new records that month). */
export interface MonthlyCommunityPoint {
  month: string;
  contacts: number;
  subscribers: number;
}

export interface AdminCharts {
  monthlyRaised: MonthlyRaisedPoint[];
  sponsorshipsByYear: YearlySponsorshipPoint[];
  monthlyCommunity: MonthlyCommunityPoint[];
}

interface MonthTotal {
  _id: string; // "YYYY-MM"
  total: number;
}

/** The last `MONTHS_BACK` month keys ("YYYY-MM") and axis labels, oldest first. */
function monthWindow(): { start: Date; keys: string[]; labels: string[] } {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth() - MONTHS_BACK + 1,
    1,
  );
  const keys: string[] = [];
  const labels: string[] = [];
  for (let i = 0; i < MONTHS_BACK; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    keys.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
    labels.push(
      d.toLocaleString("en-IN", { month: "short" }) +
        " " +
        String(d.getFullYear()).slice(-2),
    );
  }
  return { start, keys, labels };
}

/** Pipeline: sum `amountExpr` per "YYYY-MM" of `createdAt` since `start`. */
function monthlyTotalPipeline(
  start: Date,
  match: Record<string, unknown>,
  amountExpr: string | number | Record<string, unknown>,
): PipelineStage[] {
  return [
    { $match: { ...match, createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        total: { $sum: amountExpr },
      },
    },
  ];
}

function toMap(rows: MonthTotal[]): Map<string, number> {
  return new Map(rows.map((r) => [r._id, r.total]));
}

/**
 * Aggregated datasets for the admin overview charts: money raised per month by
 * source (last 12 months), sponsorships pledged vs received per year, and new
 * contacts/subscribers per month. All money in rupees, zero-filled so every
 * month/year in range appears.
 */
export async function getAdminCharts(): Promise<AdminCharts> {
  await connectMongoDB();
  const { start, keys, labels } = monthWindow();

  const client = await clientPromise;
  const donationsCol = client
    .db(process.env.MONGODB_DB)
    .collection("donations");

  const [
    donationRows,
    sponsorshipRows,
    annadhanaRows,
    contactRows,
    subscriberRows,
    yearRows,
  ] = await Promise.all([
    donationsCol
      .aggregate<MonthTotal>(
        monthlyTotalPipeline(
          start,
          { status: "captured" },
          {
            $divide: ["$amount", 100], // stored in paise
          },
        ),
      )
      .toArray(),
    StudentPayment.aggregate<MonthTotal>(
      monthlyTotalPipeline(start, { status: "received" }, "$receivedAmt"),
    ),
    AnnadhanaBooking.aggregate<MonthTotal>(
      monthlyTotalPipeline(start, { status: "received" }, "$receivedAmt"),
    ),
    Contact.aggregate<MonthTotal>(monthlyTotalPipeline(start, {}, 1)),
    Newsletter.aggregate<MonthTotal>(monthlyTotalPipeline(start, {}, 1)),
    StudentPayment.aggregate<{
      _id: number;
      pledged: number;
      received: number;
    }>([
      {
        $group: {
          _id: "$year",
          pledged: { $sum: "$amount" },
          received: { $sum: "$receivedAmt" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const donations = toMap(donationRows);
  const sponsorships = toMap(sponsorshipRows);
  const annadhana = toMap(annadhanaRows);
  const contacts = toMap(contactRows);
  const subscribers = toMap(subscriberRows);

  return {
    monthlyRaised: keys.map((key, i) => ({
      month: labels[i],
      donations: donations.get(key) ?? 0,
      sponsorships: sponsorships.get(key) ?? 0,
      annadhana: annadhana.get(key) ?? 0,
    })),
    sponsorshipsByYear: yearRows.map((row) => ({
      year: String(row._id),
      pledged: row.pledged,
      received: row.received,
    })),
    monthlyCommunity: keys.map((key, i) => ({
      month: labels[i],
      contacts: contacts.get(key) ?? 0,
      subscribers: subscribers.get(key) ?? 0,
    })),
  };
}
