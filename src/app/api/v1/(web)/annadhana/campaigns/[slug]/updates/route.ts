import { NextResponse } from "next/server";
import { getCampaignFeedBySlug } from "@/lib/annadhana";

type Context = { params: Promise<{ slug: string }> };

/**
 * Public: a campaign's day-wise feed — each day's photos/videos plus the
 * sponsor(s) of that day's breakfast (derived from received bookings).
 * Paginated with `?page`/`?limit` (default 10, max 50), newest day first;
 * `?year=` / `?month=` (1-12) narrow the feed to a period.
 */
export async function GET(request: Request, ctx: Context) {
  const { slug } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || undefined;
  const limit = Number(searchParams.get("limit")) || undefined;
  const year = Number(searchParams.get("year")) || undefined;
  const month = Number(searchParams.get("month")) || undefined;

  try {
    const feed = await getCampaignFeedBySlug(slug, {
      page,
      limit,
      year,
      month,
    });
    if (!feed) {
      return NextResponse.json(
        { message: "Campaign not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(feed);
  } catch (error) {
    console.error("Failed to load campaign feed:", error);
    return NextResponse.json(
      { message: "Error loading campaign updates" },
      { status: 500 },
    );
  }
}
