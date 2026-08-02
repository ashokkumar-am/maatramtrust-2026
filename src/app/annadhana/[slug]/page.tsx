import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getCampaignFeedBySlug,
  getUpcomingSponsoredDays,
} from "@/lib/annadhana";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CampaignFeed,
  type FeedDay,
} from "@/components/annadhana/campaign-feed";
import { UpcomingDays } from "@/components/annadhana/upcoming-days";

const PAGE_SIZE = 10;

export default async function CampaignFeedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const feed = await getCampaignFeedBySlug(slug, { limit: PAGE_SIZE });
  if (!feed) notFound();

  const { campaign } = feed;
  const upcomingDays = await getUpcomingSponsoredDays(campaign.id);
  const progress = campaign.targetAmount
    ? Math.min(100, (campaign.raisedAmount / campaign.targetAmount) * 100)
    : null;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <Link
        href="/annadhana"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-3.5" />
        All Annadhana Sevai
      </Link>

      <header className="mb-8">
        {campaign.image && (
          <Image
            src={campaign.image}
            alt=""
            width={960}
            height={360}
            unoptimized
            className="mb-4 max-h-64 w-full rounded-lg object-cover"
          />
        )}
        <h1 className="text-3xl font-semibold tracking-tight">
          {campaign.title}
        </h1>
        {campaign.description && (
          <p className="text-muted-foreground mt-2">{campaign.description}</p>
        )}
        <p className="mt-3 text-sm">
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
        <div className="mt-4">
          <Link
            href="/annadhana"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Sponsor a day&apos;s breakfast
          </Link>
        </div>
      </header>

      <UpcomingDays days={upcomingDays} />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Daily updates</h2>
        <CampaignFeed
          slug={campaign.slug}
          initialItems={feed.items as FeedDay[]}
          pageSize={PAGE_SIZE}
        />
      </section>
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const feed = await getCampaignFeedBySlug(slug, { limit: 1 });
  return {
    title: feed
      ? `${feed.campaign.title} · Maatram`
      : "Annadhana Sevai · Maatram",
    description:
      feed?.campaign.description ??
      "Day-wise updates from our Annadhana Sevai campaign.",
  };
}
