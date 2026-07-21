import { NextResponse } from "next/server";
import { getPublicDocumentGroups } from "@/lib/documents";

/**
 * Public: active org documents (annual reports, ITR) grouped by type, newest
 * year first. Download each via `/api/v1/documents/[id]/download`.
 */
export async function GET() {
  try {
    const groups = await getPublicDocumentGroups();
    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Failed to load documents:", error);
    return NextResponse.json(
      { message: "Error loading documents" },
      { status: 500 },
    );
  }
}
