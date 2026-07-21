import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listAnnadhanaUpdates, resolveCampaignTitle } from "@/lib/annadhana";
import { annadhanaUpdateRepository } from "@/lib/resources";
import { annadhanaUpdateCreateSchema } from "@/lib/validations";

/**
 * Daily campaign updates (admin). Paginated (`?page`/`?limit`), filterable by
 * `?campaign=<id>`; newest day first.
 */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  return NextResponse.json(await listAnnadhanaUpdates(searchParams));
}

/**
 * Post a day's update (photos/videos) for a campaign. One update per campaign
 * per day — a duplicate date returns 409.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = annadhanaUpdateCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid request",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const campaignTitle = await resolveCampaignTitle(parsed.data.campaignId);
  if (!campaignTitle) {
    return NextResponse.json({ message: "Unknown campaign." }, { status: 400 });
  }

  try {
    const created = await annadhanaUpdateRepository.create(
      { ...parsed.data, campaignTitle },
      auth.actor,
    );
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json(
        { message: "An update for this campaign and day already exists." },
        { status: 409 },
      );
    }
    console.error("[admin] annadhana update create failed", error);
    return NextResponse.json(
      { message: "Could not save the update" },
      { status: 500 },
    );
  }
}
