import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  listAnnadhanaBookings,
  recordManualAnnadhanaBooking,
  resolveCampaignTitle,
} from "@/lib/annadhana";
import { annadhanaBookingCreateSchema } from "@/lib/validations";
import { triggerEmail } from "@/lib/email";

/**
 * Booking history (admin). Paginated (`?page`/`?limit`), searchable (`?q=`
 * across donor name/email and honoree) and filterable by `?occasion=`,
 * `?status=`, `?campaign=<id>`, `?when=past|upcoming` and `?from=`/`?to=`
 * (event-date bounds). Sorted by event date, newest first.
 */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  return NextResponse.json(await listAnnadhanaBookings(searchParams));
}

/**
 * Manually record an annadhana booking (admin) — a donor booked offline for a
 * birthday, anniversary, memorial or other celebration. Marked received
 * immediately; fires the `annadhana.booked` email.
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

  const parsed = annadhanaBookingCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid request",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Campaign is optional; reject only when an id is supplied but unknown.
  let campaignTitle: string | undefined;
  if (data.campaignId) {
    const title = await resolveCampaignTitle(data.campaignId);
    if (!title) {
      return NextResponse.json(
        { message: "Unknown campaign." },
        { status: 400 },
      );
    }
    campaignTitle = title;
  }

  try {
    const booking = await recordManualAnnadhanaBooking(
      { ...data, campaignTitle },
      auth.actor,
    );

    triggerEmail("annadhana.booked", {
      donorName: booking.donorName,
      donorEmail: booking.donorEmail,
      occasion: booking.occasion,
      occasionDetail: booking.occasionDetail,
      honoreeName: booking.honoreeName,
      eventDate: booking.eventDate,
      amount: booking.receivedAmt,
      currency: booking.currency,
      campaignTitle: booking.campaignTitle,
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("[admin] annadhana booking failed", error);
    return NextResponse.json(
      { message: "Could not record the booking" },
      { status: 500 },
    );
  }
}
