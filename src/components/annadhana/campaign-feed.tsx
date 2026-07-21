"use client";

import { useCallback } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { HeartHandshake } from "lucide-react";
import { toLocalDay } from "@/lib/utils";
import { useInfiniteList } from "@/hooks/use-infinite-list";

export interface FeedMedia {
  url: string;
  publicId?: string;
  mediaType: "image" | "video";
}

export interface FeedSponsor {
  donorName?: string;
  occasion: string;
  occasionDetail?: string;
  honoreeName?: string;
}

export interface FeedDay {
  id: string;
  date: string;
  title?: string;
  description?: string;
  media: FeedMedia[];
  sponsors: FeedSponsor[];
}

/** "their birthday", "the memory of Lakshmi", "their wedding anniversary"… */
function occasionPhrase(sponsor: FeedSponsor): string {
  const honoree = sponsor.honoreeName;
  switch (sponsor.occasion) {
    case "birthday":
      return honoree ? `${honoree}'s birthday` : "a birthday";
    case "anniversary":
      return honoree ? `${honoree}'s anniversary` : "an anniversary";
    case "memorial":
      return honoree ? `the memory of ${honoree}` : "a loved one's memory";
    default:
      return sponsor.occasionDetail || "a celebration";
  }
}

function SponsorLine({ sponsors }: { sponsors: FeedSponsor[] }) {
  if (sponsors.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      {sponsors.map((sponsor, index) => (
        <p
          key={`${sponsor.donorName ?? "friend"}-${index}`}
          className="flex items-start gap-1.5 text-sm"
        >
          <HeartHandshake className="mt-0.5 size-3.5 shrink-0 text-[#0a7d3e]" />
          <span>
            Breakfast sponsored by{" "}
            <strong>{sponsor.donorName ?? "a kind friend"}</strong> marking{" "}
            {occasionPhrase(sponsor)}.
          </span>
        </p>
      ))}
    </div>
  );
}

function MediaGrid({ media }: { media: FeedMedia[] }) {
  if (media.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {media.map((item) => (
        <div
          key={item.publicId ?? item.url}
          className="overflow-hidden rounded-lg border"
        >
          {item.mediaType === "video" ? (
            <video
              src={item.url}
              controls
              preload="metadata"
              className="h-40 w-full object-cover"
            />
          ) : (
            <Image
              src={item.url}
              alt=""
              width={480}
              height={320}
              unoptimized
              className="h-40 w-full object-cover"
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function CampaignFeed({
  slug,
  initialItems,
  pageSize,
}: {
  slug: string;
  initialItems: FeedDay[];
  pageSize: number;
}) {
  const fetchPage = useCallback(
    async (page: number): Promise<FeedDay[]> => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      const res = await fetch(
        `/api/v1/annadhana/campaigns/${encodeURIComponent(slug)}/updates?${params.toString()}`,
      );
      if (!res.ok) return [];
      const data = (await res.json()) as { items?: FeedDay[] };
      return data.items ?? [];
    },
    [slug, pageSize],
  );

  const { items, sentinelRef, loading } = useInfiniteList({
    initialItems,
    pageSize,
    fetchPage,
  });

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Daily updates will appear here once the campaign is underway.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {items.map((day) => (
        <article
          key={day.id}
          className="flex flex-col gap-3 rounded-lg border p-4"
        >
          <header>
            <h3 className="font-medium">
              {format(toLocalDay(day.date), "EEEE, dd MMMM yyyy")}
              {day.title ? (
                <span className="text-muted-foreground"> · {day.title}</span>
              ) : null}
            </h3>
            {day.description && (
              <p className="text-muted-foreground mt-1 text-sm">
                {day.description}
              </p>
            )}
          </header>
          <SponsorLine sponsors={day.sponsors} />
          <MediaGrid media={day.media} />
        </article>
      ))}
      <div ref={sentinelRef} aria-hidden className="h-6" />
      {loading && (
        <p className="text-muted-foreground py-3 text-center text-sm">
          Loading…
        </p>
      )}
    </div>
  );
}
