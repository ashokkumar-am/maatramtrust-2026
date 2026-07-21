import { NextResponse } from "next/server";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";
import { markAnnadhanaBookingReceivedByOrder } from "@/lib/annadhana";
import { donationConfirmSchema } from "@/lib/validations";
import { triggerEmail } from "@/lib/email";

/**
 * Confirm an annadhana booking after Razorpay Checkout succeeds. Verifies the
 * payment signature, then marks the booking received. Idempotent with the
 * webhook — whichever runs first performs the transition and the
 * `annadhana.booked` email fires exactly once (a duplicate confirmation is a
 * no-op that still returns ok).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  // Same Razorpay confirmation payload as donations (orderId/paymentId/signature).
  const parsed = donationConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid request",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    console.error("[annadhana] RAZORPAY_KEY_SECRET is not set");
    return NextResponse.json({ message: "Not configured" }, { status: 500 });
  }

  const { orderId, paymentId, signature } = parsed.data;
  const valid = validatePaymentVerification(
    { order_id: orderId, payment_id: paymentId },
    signature,
    secret,
  );
  if (!valid) {
    return NextResponse.json(
      { message: "Payment verification failed." },
      { status: 400 },
    );
  }

  try {
    const booking = await markAnnadhanaBookingReceivedByOrder({
      orderId,
      paymentId,
    });
    // `null` => already received (e.g. the webhook won). Idempotent success.
    if (booking) {
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
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[annadhana] confirmation failed", error);
    return NextResponse.json(
      { message: "Could not confirm the booking." },
      { status: 500 },
    );
  }
}
