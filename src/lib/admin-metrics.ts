import "server-only";
import connectMongoDB from "@/lib/mongoose";
import clientPromise from "@/lib/mongodb";
import Student from "@/models/StudentModel";
import Contact from "@/models/ContactModel";
import Newsletter from "@/models/NewsletterModel";
import Category from "@/models/CategoryModel";
import Banner from "@/models/BannerModel";
import OrgDocument from "@/models/DocumentModel";
import BlogPost from "@/models/BlogModel";
import StudentPayment from "@/models/StudentPaymentModel";
import AnnadhanaBooking from "@/models/AnnadhanaBookingModel";

export interface AdminMetrics {
  students: number;
  contacts: number;
  subscribers: number;
  categories: number;
  banners: number;
  documents: number;
  posts: number;
  /** Captured general donations. */
  donationsCount: number;
  donationsTotal: number; // major currency units
  /** Received student sponsorships. */
  sponsorshipsCount: number;
  sponsorshipsTotal: number; // major currency units
  /** Received annadhana bookings. */
  annadhanaCount: number;
  annadhanaTotal: number; // major currency units
  /** Donations + sponsorships + annadhana bookings actually received. */
  raisedTotal: number; // major currency units
  currency: string;
}

/** Count + received-amount aggregation over a Mongoose payment model. */
function sumReceived(
  model: typeof StudentPayment,
): Promise<{ count: number; total: number }[]> {
  return model.aggregate([
    { $match: { status: "received" } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        total: { $sum: "$receivedAmt" },
      },
    },
  ]);
}

/**
 * Aggregate counts across admin resources for the dashboard overview. Counts
 * use `estimatedDocumentCount` (index metadata, no collection scan). Money in
 * comes from three sources: captured general donations (paise, in the
 * `donations` collection), received student sponsorships and received
 * annadhana bookings (both rupees) — each is surfaced plus a combined
 * "raised" total.
 */
export async function getAdminMetrics(): Promise<AdminMetrics> {
  await connectMongoDB();

  const [
    students,
    contacts,
    subscribers,
    categories,
    banners,
    documents,
    posts,
  ] = await Promise.all([
    Student.estimatedDocumentCount(),
    Contact.estimatedDocumentCount(),
    Newsletter.estimatedDocumentCount(),
    Category.estimatedDocumentCount(),
    Banner.estimatedDocumentCount(),
    OrgDocument.estimatedDocumentCount(),
    BlogPost.estimatedDocumentCount(),
  ]);

  const client = await clientPromise;
  const [donationRows, sponsorshipRows, annadhanaRows] = await Promise.all([
    client
      .db(process.env.MONGODB_DB)
      .collection("donations")
      .aggregate<{ count: number; total: number }>([
        { $match: { status: "captured" } },
        {
          $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$amount" } },
        },
      ])
      .toArray(),
    sumReceived(StudentPayment),
    sumReceived(AnnadhanaBooking),
  ]);

  const donationStats = donationRows[0];
  const sponsorshipStats = sponsorshipRows[0];
  const annadhanaStats = annadhanaRows[0];

  // General donations store paise; sponsorships and annadhana bookings store
  // major units (rupees).
  const donationsTotal = (donationStats?.total ?? 0) / 100;
  const sponsorshipsTotal = sponsorshipStats?.total ?? 0;
  const annadhanaTotal = annadhanaStats?.total ?? 0;

  return {
    students,
    contacts,
    subscribers,
    categories,
    banners,
    documents,
    posts,
    donationsCount: donationStats?.count ?? 0,
    donationsTotal,
    sponsorshipsCount: sponsorshipStats?.count ?? 0,
    sponsorshipsTotal,
    annadhanaCount: annadhanaStats?.count ?? 0,
    annadhanaTotal,
    raisedTotal: donationsTotal + sponsorshipsTotal + annadhanaTotal,
    currency: "INR",
  };
}
