import { NextResponse } from "next/server";
import { getActiveAnnadhanaCampaigns } from "@/lib/annadhana";

/**
 * Public: active Annadhana Sevai campaigns (ordered), each with the amount
 * raised so far so the booking page can show progress.
 */
export async function GET() {
  try {
    const campaigns = await getActiveAnnadhanaCampaigns();
    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("Failed to load annadhana campaigns:", error);
    return NextResponse.json(
      { message: "Error loading campaigns" },
      { status: 500 },
    );
  }
}
