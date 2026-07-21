import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import {
  getActiveAnnadhanaCampaigns,
  type PublicAnnadhanaCampaign,
} from "@/lib/annadhana";
import { AnnadhanaBookingForm } from "@/components/annadhana/booking-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Annadhana Sevai · Maatram",
  description:
    "Sponsor meals for a birthday, anniversary, in memory of a loved one, or any celebration.",
};

/** Whether a campaign is inside its booking window right now. */
function isOpen(campaign: PublicAnnadhanaCampaign, now: Date): boolean {
  if (campaign.startDate && new Date(campaign.startDate) > now) return false;
  if (campaign.endDate && new Date(campaign.endDate) < now) return false;
  return true;
}

function CampaignCard({ campaign }: { campaign: PublicAnnadhanaCampaign }) {
  const progress = campaign.targetAmount
    ? Math.min(100, (campaign.raisedAmount / campaign.targetAmount) * 100)
    : null;

  return (
    <Link
      href={`/annadhana/${campaign.slug}`}
      className="hover:border-foreground/20 flex gap-3 rounded-lg border p-3 transition-colors"
    >
      {campaign.image ? (
        <Image
          src={campaign.image}
          alt=""
          width={64}
          height={64}
          unoptimized
          className="size-16 shrink-0 rounded-md object-cover"
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <h3 className="font-medium">{campaign.title}</h3>
        {campaign.description && (
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm">
            {campaign.description}
          </p>
        )}
        <p className="mt-1 text-sm">
          <span className="font-medium">
            ₹{campaign.raisedAmount.toLocaleString("en-IN")}
          </span>
          <span className="text-muted-foreground">
            {campaign.targetAmount
              ? ` raised of ₹${campaign.targetAmount.toLocaleString("en-IN")}`
              : " raised so far"}
          </span>
        </p>
        {progress !== null && (
          <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-[#0a7d3e]"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <p className="mt-1.5 text-xs font-medium text-[#0a7d3e]">
          View daily updates →
        </p>
      </div>
    </Link>
  );
}

export default async function AnnadhanaPage() {
  const [session, campaigns] = await Promise.all([
    auth(),
    getActiveAnnadhanaCampaigns(),
  ]);

  const now = new Date();
  const openCampaigns = campaigns.filter((c) => isOpen(c, now));
  const formCampaigns = openCampaigns.map((c) => ({
    id: c.id,
    title: c.title,
    minAmount: c.minAmount,
  }));

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">
          Annadhana Sevai
        </h1>
        <p className="text-muted-foreground mt-2">
          Mark a birthday, an anniversary, the memory of a loved one, or any
          celebration by sponsoring meals on a day of your choice. We&apos;ll
          confirm your booking by email.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Book your Annadhana Sevai</CardTitle>
            <CardDescription>
              Pick the occasion, date and amount — payment is processed
              securely.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnnadhanaBookingForm
              campaigns={formCampaigns}
              defaultName={session?.user?.name ?? ""}
              defaultEmail={session?.user?.email ?? ""}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Ongoing campaigns</h2>
          {openCampaigns.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No campaigns are running right now — you can still book a general
              Annadhana Sevai for your occasion.
            </p>
          ) : (
            openCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))
          )}
        </div>
      </div>
    </main>
  );
}
