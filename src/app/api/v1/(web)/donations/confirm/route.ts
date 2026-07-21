import { NextResponse } from "next/server";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";
import { markDonationCaptured } from "@/lib/donations";
import { fulfilCapturedDonation } from "@/lib/donation-fulfilment";
import { donationConfirmSchema } from "@/lib/validations";

/**
 * Confirm a donation after Razorpay Checkout succeeds. Verifies the payment
 * signature, then captures the donation and sends the receipt. Idempotent with
 * the webhook — whichever runs first performs the capture and sends the receipt
 * email exactly once (a duplicate confirmation is a no-op that still returns ok).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

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
    console.error("[donation] RAZORPAY_KEY_SECRET is not set");
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
    const captured = await markDonationCaptured({ orderId, paymentId });
    // `null` => already captured (e.g. the webhook won). Idempotent success.
    if (captured) {
      await fulfilCapturedDonation(captured);
      return NextResponse.json({
        ok: true,
        receiptNumber: captured.receiptNumber,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[donation] confirmation failed", error);
    return NextResponse.json(
      { message: "Could not confirm the donation." },
      { status: 500 },
    );
  }
}
