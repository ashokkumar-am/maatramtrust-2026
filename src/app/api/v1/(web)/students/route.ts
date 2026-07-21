import { getPublicStudents } from "@/lib/student-view";
import { NextResponse } from "next/server";

/**
 * Public students available for sponsorship. Internal fields are stripped by
 * the shared data layer; fully-funded students sort to the bottom.
 */
export async function GET() {
  try {
    const students = await getPublicStudents();
    return NextResponse.json({ students });
  } catch (error) {
    console.error("Failed to load students:", error);
    return NextResponse.json(
      { message: "Error loading students" },
      { status: 500 },
    );
  }
}
