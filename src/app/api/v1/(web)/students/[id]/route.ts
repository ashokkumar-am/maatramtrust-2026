import { getPublicStudentById } from "@/lib/student-view";
import { NextResponse } from "next/server";

/**
 * Public detail for a single student. Returns 404 when the id is unknown.
 * Internal fields are stripped by the shared data layer.
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const student = await getPublicStudentById(id);
    if (!student) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ student });
  } catch (error) {
    console.error("Failed to load student:", error);
    return NextResponse.json(
      { message: "Error loading student" },
      { status: 500 },
    );
  }
}
