import "server-only";
import { triggerEmail } from "@/lib/email";
import { generateDonationReceipt } from "@/lib/receipt";
import type { DonationDoc } from "@/lib/donations";

/**
 * Fulfil a freshly-captured donation: generate the PDF receipt and fire the
 * donor acknowledgement + admin notification. Call this only on the capture
 * *transition* (when `markDonationCaptured` returns the doc), so the receipt is
 * produced exactly once regardless of whether the webhook or the client
 * confirmation won the race.
 *
 * PDF generation is awaited (a few ms) while the SES send itself stays
 * fire-and-forget via {@link triggerEmail}.
 */
export async function fulfilCapturedDonation(
  donation: DonationDoc,
): Promise<void> {
  let pdf: Uint8Array | undefined;

  if (donation.email && donation.paymentId && donation.receiptNumber) {
    try {
      pdf = await generateDonationReceipt({
        donorName: donation.donorName,
        amount: donation.amount / 100,
        currency: donation.currency,
        paymentId: donation.paymentId,
        receiptNumber: donation.receiptNumber,
        category: donation.categoryName,
        date: donation.capturedAt ?? new Date(),
      });
    } catch (error) {
      // A receipt failure must not block the acknowledgement email.
      console.error("[donation] receipt PDF generation failed", error);
    }
  }

  triggerEmail("donation.received", {
    email: donation.email,
    amountPaise: donation.amount,
    currency: donation.currency,
    paymentId: donation.paymentId ?? "",
    donorName: donation.donorName,
    category: donation.categoryName,
    receiptNumber: donation.receiptNumber,
    pdf,
  });
}
