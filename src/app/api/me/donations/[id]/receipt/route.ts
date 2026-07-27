import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getOwnedDonation } from "@/lib/donations";
import { generateDonationReceipt } from "@/lib/receipt";

/**
 * Self-service donation receipt: the signed-in donor downloads the PDF for
 * their own captured donation. Ownership is enforced in the query (userId or
 * account email), so other users' donations 404 rather than 403 — the id
 * space stays unguessable. This is the generic receipt today; it becomes the
 * statutory 80G certificate once the org's 80G details are added to
 * `src/lib/receipt.ts`.
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const donation = await getOwnedDonation(id, {
    userId: session.user.id,
    email: session.user.email,
  });
  if (!donation) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  if (
    donation.status !== "captured" ||
    !donation.paymentId ||
    !donation.receiptNumber
  ) {
    return NextResponse.json(
      { message: "A receipt is only available for completed donations." },
      { status: 409 },
    );
  }

  try {
    const pdf = await generateDonationReceipt({
      donorName: donation.donorName,
      amount: donation.amount / 100,
      currency: donation.currency,
      paymentId: donation.paymentId,
      receiptNumber: donation.receiptNumber,
      category: donation.categoryName,
      date: donation.capturedAt ?? donation.createdAt,
    });

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="donation-receipt-${donation.receiptNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[me] receipt generation failed", error);
    return NextResponse.json(
      { message: "Could not generate the receipt." },
      { status: 500 },
    );
  }
}
