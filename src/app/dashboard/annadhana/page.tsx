import Link from "next/link";
import { Camera, Megaphone } from "lucide-react";
import connectMongoDB from "@/lib/mongoose";
import AnnadhanaCampaign from "@/models/AnnadhanaCampaignModel";
import { listAnnadhanaBookings } from "@/lib/annadhana";
import { requireAdminPage } from "@/lib/dashboard-auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnnadhanaBookingButton } from "@/components/dashboard/annadhana-booking-button";
import {
  AnnadhanaBookingsList,
  type BookingRow,
} from "@/components/dashboard/annadhana-bookings-list";

export const metadata = { title: "Annadhana Sevai · Maatram Admin" };

const PAGE_SIZE = 20;

interface CampaignDoc {
  _id: unknown;
  title: string;
}

interface BookingDoc {
  _id: unknown;
  occasion: string;
  occasionDetail?: string;
  honoreeName?: string;
  eventDate: Date;
  donorName?: string;
  donorEmail?: string;
  amount: number;
  receivedAmt: number;
  currency: string;
  status: string;
  source: string;
  campaignTitle?: string;
}

export default async function AdminAnnadhanaPage() {
  await requireAdminPage("/dashboard/annadhana");
  await connectMongoDB();

  const [bookings, campaignDocs] = await Promise.all([
    listAnnadhanaBookings(new URLSearchParams({ limit: String(PAGE_SIZE) })),
    // All campaigns (not just active) so offline entries can backfill history.
    AnnadhanaCampaign.find()
      .sort({ order: 1, title: 1 })
      .select("title")
      .lean<CampaignDoc[]>()
      .exec(),
  ]);

  const campaigns = campaignDocs.map((c) => ({
    id: String(c._id),
    title: c.title,
  }));

  // Dates come back as Date objects — serialize for the client component.
  const initialItems: BookingRow[] = (
    bookings.items as unknown as BookingDoc[]
  ).map((b) => ({
    id: String(b._id),
    occasion: b.occasion,
    occasionDetail: b.occasionDetail,
    honoreeName: b.honoreeName,
    eventDate: new Date(b.eventDate).toISOString(),
    donorName: b.donorName,
    donorEmail: b.donorEmail,
    amount: b.amount,
    receivedAmt: b.receivedAmt,
    currency: b.currency,
    status: b.status,
    source: b.source,
    campaignTitle: b.campaignTitle,
  }));

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Annadhana Sevai
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Meal sponsorship bookings for birthdays, anniversaries, memorials
            and other celebrations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/annadhana/updates"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Camera className="size-3" />
            Daily updates
          </Link>
          <Link
            href="/dashboard/annadhana/campaigns"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Megaphone className="size-3" />
            Campaigns
          </Link>
          <AnnadhanaBookingButton campaigns={campaigns} />
        </div>
      </header>

      <AnnadhanaBookingsList initialItems={initialItems} pageSize={PAGE_SIZE} />
    </div>
  );
}
