import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { markDonationCaptured, markDonationFailed } from "@/lib/donations";
import { fulfilCapturedDonation } from "@/lib/donation-fulfilment";
import {
  markSponsorshipReceivedByOrder,
  sponsorshipExistsForOrder,
} from "@/lib/sponsorships";
import {
  annadhanaBookingExistsForOrder,
  markAnnadhanaBookingFailedByOrder,
  markAnnadhanaBookingReceivedByOrder,
} from "@/lib/annadhana";
import { triggerEmail } from "@/lib/email";

interface CapturedPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  email?: string;
}

/**
 * Capture a sponsorship order: flip it to received and thank the sponsor.
 * Idempotent — a null update means another path already recorded it.
 */
async function handleSponsorshipCaptured(
  payment: CapturedPayment,
): Promise<void> {
  const sponsorship = await markSponsorshipReceivedByOrder({
    orderId: payment.order_id,
    paymentId: payment.id,
    amountPaise: payment.amount,
    currency: payment.currency,
  });
  if (sponsorship) {
    triggerEmail("student.sponsored", {
      sponsorName: sponsorship.donorName,
      sponsorEmail: sponsorship.donorEmail ?? payment.email,
      studentName: sponsorship.studentName ?? "the student",
      amount: sponsorship.receivedAmt,
      currency: sponsorship.currency,
    });
  }
}

/**
 * Capture an annadhana booking order: flip it to received and confirm the
 * booking to the donor. Idempotent like the sponsorship path.
 */
async function handleAnnadhanaCaptured(
  payment: CapturedPayment,
): Promise<void> {
  const booking = await markAnnadhanaBookingReceivedByOrder({
    orderId: payment.order_id,
    paymentId: payment.id,
    amountPaise: payment.amount,
    currency: payment.currency,
  });
  if (booking) {
    triggerEmail("annadhana.booked", {
      donorName: booking.donorName,
      donorEmail: booking.donorEmail ?? payment.email,
      occasion: booking.occasion,
      occasionDetail: booking.occasionDetail,
      honoreeName: booking.honoreeName,
      eventDate: booking.eventDate,
      amount: booking.receivedAmt,
      currency: booking.currency,
      campaignTitle: booking.campaignTitle,
    });
  }
}

// Razorpay signs the webhook with your dashboard webhook secret. We must verify
// the signature against the *raw* request body, so read it as text (never parse
// before verifying).
export async function POST(request: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[razorpay] RAZORPAY_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "not configured" }, { status: 500 });
  }

  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let valid = false;
  try {
    valid = Razorpay.validateWebhookSignature(rawBody, signature, secret);
  } catch {
    valid = false;
  }

  if (!valid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as {
    event: string;
    payload?: {
      payment?: {
        entity?: {
          id: string;
          order_id: string;
          amount: number;
          currency: string;
          email?: string;
        };
      };
    };
  };

  try {
    switch (event.event) {
      case "payment.captured": {
        const payment = event.payload?.payment?.entity;
        if (payment?.order_id) {
          // Route the order to what it paid for: a student sponsorship, an
          // annadhana booking, or a plain donation. Every mark is idempotent —
          // if the client confirmation already recorded it, the update returns
          // null and the (duplicate) email/receipt is skipped.
          if (await sponsorshipExistsForOrder(payment.order_id)) {
            await handleSponsorshipCaptured(payment);
          } else if (await annadhanaBookingExistsForOrder(payment.order_id)) {
            await handleAnnadhanaCaptured(payment);
          } else {
            const captured = await markDonationCaptured({
              orderId: payment.order_id,
              paymentId: payment.id,
              amount: payment.amount,
              currency: payment.currency,
            });
            console.info("[razorpay] donation captured", payment.id);
            // Only the winning transition fulfils (PDF receipt + emails once).
            if (captured) await fulfilCapturedDonation(captured);
          }
        }
        break;
      }
      case "payment.failed": {
        const payment = event.payload?.payment?.entity;
        if (payment?.order_id) {
          if (await annadhanaBookingExistsForOrder(payment.order_id)) {
            await markAnnadhanaBookingFailedByOrder({
              orderId: payment.order_id,
              paymentId: payment.id,
            });
            console.warn("[razorpay] annadhana booking failed", payment.id);
          } else {
            await markDonationFailed({
              orderId: payment.order_id,
              paymentId: payment.id,
            });
            console.warn("[razorpay] donation failed", payment.id);
          }
        }
        break;
      }
      default:
        console.info("[razorpay] unhandled event", event.event);
    }
  } catch (error) {
    // Return 500 so Razorpay retries the webhook (the writes are idempotent).
    console.error("[razorpay] webhook handler error", error);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }

  // Always 200 once handled so Razorpay stops retrying.
  return NextResponse.json({ received: true });
}
