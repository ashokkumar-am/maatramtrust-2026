import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAuditUser } from "@/lib/audit";
import {
  recordAnnadhanaBookingIntent,
  resolveBookableCampaign,
} from "@/lib/annadhana";
import { annadhanaBookingOrderSchema } from "@/lib/validations";
import {
  DONATION_CURRENCY,
  MIN_DONATION_PAISE,
  RAZORPAY_KEY_ID,
  razorpay,
} from "@/lib/razorpay";

/** Start of today — self-bookings must be for today or a future date. */
function startOfToday(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

/**
 * Public self-booking: start an Annadhana Sevai booking for an occasion
 * (birthday, anniversary, memorial, other celebration) on a chosen date.
 * Creates a Razorpay order and records a `pending` booking; the webhook /
 * confirm call flips it to `received` on capture. The amount is
 * server-authoritative (converted to paise here).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = annadhanaBookingOrderSchema.safeParse(body);
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
  if (data.eventDate < startOfToday()) {
    return NextResponse.json(
      { message: "The event date cannot be in the past." },
      { status: 400 },
    );
  }

  const amountPaise = Math.round(data.amount * 100);
  if (amountPaise < MIN_DONATION_PAISE) {
    return NextResponse.json(
      { message: "Amount is below the minimum." },
      { status: 400 },
    );
  }

  // Campaign is optional; when given it must be active and inside its window,
  // and the campaign's own minimum applies.
  let campaignTitle: string | undefined;
  if (data.campaignId) {
    const campaign = await resolveBookableCampaign(data.campaignId);
    if (!campaign) {
      return NextResponse.json(
        { message: "This campaign is not open for bookings." },
        { status: 400 },
      );
    }
    if (campaign.minAmount && data.amount < campaign.minAmount) {
      return NextResponse.json(
        { message: `The minimum for this campaign is ${campaign.minAmount}.` },
        { status: 400 },
      );
    }
    campaignTitle = campaign.title;
  }

  const session = await auth();
  const donorEmail = data.donorEmail ?? session?.user?.email ?? undefined;
  const donorName = data.donorName ?? session?.user?.name ?? undefined;
  const actor = await getAuditUser();

  try {
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: DONATION_CURRENCY,
      // Razorpay caps `receipt` at 40 chars; keep it short but traceable.
      receipt: `ads_${Date.now()}`,
      notes: {
        purpose: "annadhana",
        occasion: data.occasion,
        eventDate: data.eventDate.toISOString().slice(0, 10),
        donorEmail: donorEmail ?? "",
      },
    });

    // The booking record is what routes the webhook to annadhana handling, so
    // recording the intent must succeed before checkout starts.
    await recordAnnadhanaBookingIntent(
      {
        ...data,
        campaignTitle,
        userId: session?.user?.id,
        donorName,
        donorEmail,
        currency: DONATION_CURRENCY,
        orderId: order.id,
      },
      actor ?? undefined,
    );

    return NextResponse.json(
      {
        keyId: RAZORPAY_KEY_ID,
        orderId: order.id,
        amount: Number(order.amount),
        currency: order.currency,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[annadhana] order creation failed", error);
    return NextResponse.json(
      { message: "Could not start the payment. Try again." },
      { status: 502 },
    );
  }
}
