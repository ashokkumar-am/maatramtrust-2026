"use server";

import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";
import connectMongoDB from "@/lib/mongoose";
import Student from "@/models/StudentModel";
import { getAuditUser } from "@/lib/audit";
import {
  markSponsorshipReceivedByOrder,
  recordSponsorshipIntent,
} from "@/lib/sponsorships";
import { triggerEmail } from "@/lib/email";
import { sponsorshipOrderSchema } from "@/lib/validations";
import {
  DONATION_CURRENCY,
  MIN_DONATION_PAISE,
  RAZORPAY_KEY_ID,
  razorpay,
} from "@/lib/razorpay";

export type SponsorshipOrderResult =
  | {
      ok: true;
      keyId: string;
      orderId: string;
      amount: number;
      currency: string;
    }
  | { ok: false; error: string; requiresSignIn?: boolean };

/**
 * Start a Razorpay order to sponsor a specific student. Only registered
 * (signed-in) users can sponsor — the sponsorship is recorded against their
 * account so it shows up under "My Giving". Records a `pending` sponsorship
 * (donor details + year, against the student); the webhook flips it to
 * `received` on capture. The amount is server-authoritative (paise).
 */
export async function createStudentSponsorshipOrder(
  input: unknown,
): Promise<SponsorshipOrderResult> {
  const actor = await getAuditUser();
  if (!actor) {
    return {
      ok: false,
      error: "Please sign in to sponsor a student.",
      requiresSignIn: true,
    };
  }

  const parsed = sponsorshipOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please provide a student and a valid amount." };
  }

  const amountPaise = Math.round(parsed.data.amount * 100);
  if (amountPaise < MIN_DONATION_PAISE) {
    return { ok: false, error: "Amount is below the minimum." };
  }

  await connectMongoDB();
  const student = await Student.findById(parsed.data.studentId)
    .lean<{ _id: unknown; name: string }>()
    .exec();
  if (!student) {
    return { ok: false, error: "Student not found." };
  }

  const year = parsed.data.year ?? new Date().getFullYear();
  // Donor identity falls back to the signed-in account.
  const donorName = parsed.data.donorName ?? actor.name;
  const donorEmail = parsed.data.donorEmail ?? actor.email;

  try {
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: DONATION_CURRENCY,
      // Razorpay caps `receipt` at 40 chars; keep it short but traceable
      // (last 6 of the student id + timestamp).
      receipt: `spn_${parsed.data.studentId.slice(-6)}_${Date.now()}`,
      notes: {
        purpose: "sponsorship",
        studentId: parsed.data.studentId,
        year: String(year),
        donorEmail: donorEmail ?? "",
      },
    });

    await recordSponsorshipIntent(
      {
        studentId: parsed.data.studentId,
        studentName: student.name,
        year,
        userId: actor.id,
        donorName,
        donorEmail,
        donorPhone: parsed.data.donorPhone,
        amount: parsed.data.amount,
        currency: DONATION_CURRENCY,
        orderId: order.id,
      },
      actor,
    );

    return {
      ok: true,
      keyId: RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: Number(order.amount),
      currency: order.currency,
    };
  } catch (error) {
    console.error("[sponsor] order creation failed", error);
    return { ok: false, error: "Could not start the sponsorship payment." };
  }
}

/**
 * Confirm a sponsorship after Razorpay Checkout succeeds. Verifies the payment
 * signature, then marks the sponsorship received (capturing the donor against
 * the student). Idempotent with the webhook — whichever runs first wins, and
 * the `student.sponsored` email fires exactly once.
 */
export async function confirmStudentSponsorship(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<{ ok: boolean }> {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return { ok: false };

  const valid = validatePaymentVerification(
    { order_id: input.orderId, payment_id: input.paymentId },
    input.signature,
    secret,
  );
  if (!valid) return { ok: false };

  const sponsorship = await markSponsorshipReceivedByOrder({
    orderId: input.orderId,
    paymentId: input.paymentId,
  });

  if (sponsorship) {
    triggerEmail("student.sponsored", {
      sponsorName: sponsorship.donorName,
      sponsorEmail: sponsorship.donorEmail,
      studentName: sponsorship.studentName ?? "the student",
      amount: sponsorship.receivedAmt,
      currency: sponsorship.currency,
    });
  }

  return { ok: true };
}
