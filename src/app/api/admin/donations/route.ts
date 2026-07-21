import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAdmin } from "@/lib/admin-auth";
import connectMongoDB from "@/lib/mongoose";
import Category from "@/models/CategoryModel";
import { getAdminDonations, recordManualDonation } from "@/lib/donations";
import { fulfilCapturedDonation } from "@/lib/donation-fulfilment";
import { manualDonationSchema } from "@/lib/validations";

/** Resolve a category's display name, or `null` when unknown. */
async function resolveCategoryName(
  categoryId: string | undefined,
): Promise<string | null> {
  if (!categoryId || !mongoose.isValidObjectId(categoryId)) return null;
  await connectMongoDB();
  const category = await Category.findById(categoryId)
    .select("name")
    .lean<{ name: string }>()
    .exec();
  return category?.name ?? null;
}

/** List recent donations (web + cash) for the dashboard, paginated. */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 50;
  const q = searchParams.get("q") ?? undefined;

  const donations = await getAdminDonations({ page, limit, q });
  return NextResponse.json({ donations });
}

/** Record an admin cash/offline donation (captured immediately). */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = manualDonationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid request",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const categoryName = parsed.data.categoryId
    ? await resolveCategoryName(parsed.data.categoryId)
    : null;

  try {
    const donation = await recordManualDonation({
      amount: parsed.data.amount,
      donorName: parsed.data.donorName,
      email: parsed.data.donorEmail,
      anonymous: parsed.data.anonymous ?? false,
      categoryId: parsed.data.categoryId,
      categoryName: categoryName ?? undefined,
      method: parsed.data.method ?? "cash",
      note: parsed.data.note,
      receivedAt: parsed.data.receivedAt,
      actor: auth.actor,
    });

    // Email the donor a PDF receipt when we have their address (best-effort).
    if (donation.email) await fulfilCapturedDonation(donation);

    return NextResponse.json(
      { id: donation._id, receiptNumber: donation.receiptNumber },
      { status: 201 },
    );
  } catch (error) {
    console.error("[donations] manual entry failed", error);
    return NextResponse.json(
      { message: "Could not record the donation." },
      { status: 500 },
    );
  }
}
