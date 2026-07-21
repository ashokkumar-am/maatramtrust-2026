import { getActiveBanners } from "@/lib/banners";
import { NextResponse } from "next/server";

/**
 * Public homepage banners: only active ones, ordered by `order` then newest.
 * Internal fields are stripped by the shared data layer.
 */
export async function GET() {
  try {
    const banners = await getActiveBanners();
    return NextResponse.json({ banners });
  } catch (error) {
    console.error("Failed to load banners:", error);
    return NextResponse.json(
      { message: "Error loading banners" },
      { status: 500 },
    );
  }
}
