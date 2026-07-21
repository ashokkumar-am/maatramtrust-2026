import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import connectMongoDB from "@/lib/mongoose";
import Category from "@/models/CategoryModel";
import { getPublicDonations, recordDonationOrder } from "@/lib/donations";
import { donationOrderSchema } from "@/lib/validations";
import {
  DONATION_CURRENCY,
  MIN_DONATION_PAISE,
  RAZORPAY_KEY_ID,
  razorpay,
} from "@/lib/razorpay";

/**
 * Resolve an active category's display name, or `null` when the id is unknown /
 * inactive. Invalid ObjectIds resolve to `null` (never throw).
 */
async function resolveCategoryName(
  categoryId: string | undefined,
): Promise<string | null> {
  if (!categoryId) return null;
  if (!mongoose.isValidObjectId(categoryId)) return null;

  await connectMongoDB();
  const category = await Category.findOne({ _id: categoryId, isActive: true })
    .select("name")
    .lean<{ name: string }>()
    .exec();
  return category?.name ?? null;
}

/**
 * Public donor wall: recent captured donations, donor names masked. Optional
 * `?limit=` (1–50, default 20).
 */
export async function GET(request: Request) {
  try {
    const limitParam = new URL(request.url).searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;
    const donations = await getPublicDonations(
      Number.isFinite(limit as number) ? (limit as number) : undefined,
    );
    return NextResponse.json({ donations });
  } catch (error) {
    console.error("Failed to load donations:", error);
    return NextResponse.json(
      { message: "Error loading donations" },
      { status: 500 },
    );
  }
}

/**
 * Start a donation: create a Razorpay order for the given amount (optionally
 * tagged with a category) and record the intent. The amount is
 * server-authoritative — converted to paise here, never trusted from a prior
 * client value. Donor name/email fall back to the logged-in Google account.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = donationOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid request",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const amountPaise = Math.round(parsed.data.amount * 100);
  if (amountPaise < MIN_DONATION_PAISE) {
    return NextResponse.json(
      { message: "Amount is below the minimum donation." },
      { status: 400 },
    );
  }

  // Category is optional; reject only when an id is supplied but doesn't resolve.
  let categoryName: string | null = null;
  if (parsed.data.categoryId) {
    categoryName = await resolveCategoryName(parsed.data.categoryId);
    if (!categoryName) {
      return NextResponse.json(
        { message: "Invalid or inactive category." },
        { status: 400 },
      );
    }
  }

  const session = await auth();
  const donorEmail =
    parsed.data.donorEmail ?? session?.user?.email ?? undefined;
  const donorName = parsed.data.donorName ?? session?.user?.name ?? undefined;

  try {
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: DONATION_CURRENCY,
      receipt: `donation_${Date.now()}`,
      notes: {
        purpose: "donation",
        userId: session?.user?.id ?? "guest",
        email: donorEmail ?? "",
        categoryId: parsed.data.categoryId ?? "",
      },
    });

    // The webhook / confirmation is authoritative for the paid state, so a
    // failure to persist the intent must not block checkout.
    try {
      await recordDonationOrder({
        orderId: order.id,
        amount: Number(order.amount),
        currency: order.currency,
        userId: session?.user?.id,
        email: donorEmail,
        donorName,
        anonymous: parsed.data.anonymous ?? false,
        categoryId: parsed.data.categoryId,
        categoryName: categoryName ?? undefined,
      });
    } catch (error) {
      console.error("[donation] failed to record order", error);
    }

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
    console.error("[donation] order creation failed", error);
    return NextResponse.json(
      { message: "Could not start the payment. Try again." },
      { status: 502 },
    );
  }
}
