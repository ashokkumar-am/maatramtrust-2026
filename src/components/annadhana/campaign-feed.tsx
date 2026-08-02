"use client";

import { useCallback } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { HeartHandshake } from "lucide-react";
import { toLocalDay } from "@/lib/utils";
import { useInfiniteList } from "@/hooks/use-infinite-list";
import {
  occasionPhrase,
  type OccasionSponsor,
} from "@/components/annadhana/occasion";

export interface FeedMedia {
  url: string;
  publicId?: string;
  mediaType: "image" | "video";
}

export type FeedSponsor = OccasionSponsor;

export interface FeedDay {
  id: string;
  date: string;
  title?: string;
  description?: string;
  media: FeedMedia[];
  sponsors: FeedSponsor[];
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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
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

export interface FeedPeriodFilter {
  year?: number;
  month?: number;
}

export function CampaignFeed({
  slug,
  initialItems,
  pageSize,
  period,
}: {
  slug: string;
  initialItems: FeedDay[];
  pageSize: number;
  /** Year/month window the feed is narrowed to (matches the SSR page 1). */
  period?: FeedPeriodFilter;
}) {
  const periodYear = period?.year;
  const periodMonth = period?.month;

  const fetchPage = useCallback(
    async (page: number): Promise<FeedDay[]> => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (periodYear) params.set("year", String(periodYear));
      if (periodMonth) params.set("month", String(periodMonth));
      const res = await fetch(
        `/api/v1/annadhana/campaigns/${encodeURIComponent(slug)}/updates?${params.toString()}`,
      );
      if (!res.ok) return [];
      const data = (await res.json()) as { items?: FeedDay[] };
      return data.items ?? [];
    },
    [slug, pageSize, periodYear, periodMonth],
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
      {items.map((day, index) => {
        const monthLabel = format(toLocalDay(day.date), "MMMM yyyy");
        const previousLabel =
          index > 0
            ? format(toLocalDay(items[index - 1].date), "MMMM yyyy")
            : null;
        return (
          <div key={day.id} className="flex flex-col gap-3">
            {monthLabel !== previousLabel && (
              <h3 className="text-muted-foreground bg-background/95 sticky top-20 z-10 -mb-1 w-fit rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase backdrop-blur">
                {monthLabel}
              </h3>
            )}
            <article className="flex flex-col gap-3 rounded-lg border p-4">
              <header>
                <h4 className="font-medium">
                  {format(toLocalDay(day.date), "EEEE, dd MMMM yyyy")}
                  {day.title ? (
                    <span className="text-muted-foreground">
                      {" "}
                      · {day.title}
                    </span>
                  ) : null}
                </h4>
                {day.description && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {day.description}
                  </p>
                )}
              </header>
              <SponsorLine sponsors={day.sponsors} />
              <MediaGrid media={day.media} />
            </article>
          </div>
        );
      })}
      <div ref={sentinelRef} aria-hidden className="h-6" />
      {loading && (
        <p className="text-muted-foreground py-3 text-center text-sm">
          Loading…
        </p>
      )}
    </div>
  );
}
